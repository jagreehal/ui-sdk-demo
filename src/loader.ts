const modules = import.meta.glob("./entries/*.ts")

const components = Object.fromEntries(
  Object.entries(modules).map(([path, load]) => [
    path.split("/").pop()!.replace(/\.ts$/, ""),
    load,
  ]),
)

const entryNames = Object.keys(components).sort((a, b) => b.length - a.length)
const loading = new Map<string, Promise<unknown>>()
const loaded = new Set<string>()
const listeners = new Set<(entries: string[]) => void>()

function notify() {
  const snapshot = [...loaded].sort()
  for (const listener of listeners) listener(snapshot)
}

export function onEntriesLoaded(listener: (entries: string[]) => void) {
  listeners.add(listener)
  listener([...loaded].sort())
  return () => listeners.delete(listener)
}

export function getLoadedEntries() {
  return [...loaded].sort()
}

export function entryForTag(tag: string): string | null {
  if (!tag.startsWith("ui-")) return null
  const rest = tag.slice(3)
  for (const name of entryNames) {
    if (rest === name || rest.startsWith(`${name}-`)) return name
  }
  return null
}

export function loadComponent(tag: string) {
  const name = entryForTag(tag)
  if (!name) return
  if (loaded.has(name) || customElements.get(`ui-${name}`)) {
    loaded.add(name)
    return
  }
  if (loading.has(name)) return

  const load = components[name]
  if (!load) return

  const promise = Promise.resolve(load())
    .then(() => {
      loaded.add(name)
      notify()
    })
    .catch((error) => {
      loading.delete(name)
      console.error(`Failed to load ${name}`, error)
    })

  loading.set(name, promise)
}

export function scan(element: Element) {
  if (entryForTag(element.localName)) loadComponent(element.localName)

  for (const el of element.querySelectorAll("*")) {
    if (entryForTag(el.localName)) loadComponent(el.localName)
  }
}

export function entriesNeededIn(root: ParentNode) {
  const needed = new Set<string>()
  const visit = (el: Element) => {
    const name = entryForTag(el.localName)
    if (name) needed.add(name)
  }
  if (root instanceof Element) visit(root)
  for (const el of root.querySelectorAll("*")) visit(el)
  return [...needed].sort()
}

export async function whenEntriesReady(names: string[]) {
  // A failed import settles its loading promise too; whenDefined alone would wait forever.
  await Promise.all(names.map((name) => loading.get(name)))
  const missing = names.filter((name) => !customElements.get(`ui-${name}`))
  if (missing.length) throw new Error(`Failed to load entries: ${missing.join(", ")}`)
}

function boot() {
  scan(document.documentElement)
  // json-render state/actions, loaded like any other entry: only when the page has an embedded Spec.
  if (document.getElementById("json-render-spec")) {
    // Clicks on Spec buttons (e.g. a Cta with on.press) before the runtime arrives are queued and replayed, not lost.
    const early: HTMLElement[] = []
    const queue = (event: Event) => {
      const target = (event.target as Element).closest<HTMLElement>("button[data-jr-key], a[data-jr-key]")
      if (!target) return
      event.preventDefault()
      early.push(target)
    }
    document.addEventListener("click", queue, true)
    void import("./runtime.ts").then((runtime) => {
      runtime.hydrateDocument()
      document.removeEventListener("click", queue, true)
      for (const target of early) target.click()
    })
  }

  new MutationObserver((records) => {
    for (const record of records) {
      for (const node of record.addedNodes) {
        if (node instanceof Element) scan(node)
      }
    }
  }).observe(document.documentElement, {
    childList: true,
    subtree: true,
  })
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true })
  } else {
    boot()
  }
}
