import {
  createStateStore,
  evaluateVisibility,
  resolveActionParam,
  resolveBindings,
  type ActionBinding,
  type Spec,
  type StateStore,
} from "@json-render/core"

/**
 * json-render state + actions for server-rendered ui-sdk markup (from spec-html.ts).
 * Works on elements tagged `data-jr-key`:
 * - `visible`    → toggles `hidden` when state changes
 * - `on.press`   → runs actions (setState, the one built-in the catalog offers)
 * - `$bindState` → two-way: state → ui-* live property; `<prop>change` event → state
 * ui-sdk: setting a property fires no event, so state → element writes cannot loop.
 */

/** Catalog type → [ui-* tag, live property]; the change event is `${property}change`. */
const bindable: Record<string, [tag: string, property: string]> = {
  Dialog: ["ui-dialog", "open"],
  Switch: ["ui-switch", "checked"],
  Checkbox: ["ui-checkbox", "checked"],
  Toggle: ["ui-toggle", "pressed"],
  Select: ["ui-select", "value"],
}

export function hydrate(root: ParentNode, spec: Spec): StateStore {
  const store = createStateStore(spec.state ?? {})
  const ctx = () => ({ stateModel: store.getSnapshot() })
  const syncs: (() => void)[] = []

  const run = (binding: ActionBinding) => {
    if (binding.action !== "setState") {
      console.warn(`[json-render] action "${binding.action}" is not supported`)
      return
    }
    const params = Object.fromEntries(
      Object.entries(binding.params ?? {}).map(([key, value]) => [key, resolveActionParam(value, ctx())]),
    )
    if (typeof params.statePath === "string") store.set(params.statePath, params.value)
  }

  for (const node of root.querySelectorAll<HTMLElement>("[data-jr-key]")) {
    const element = spec.elements[node.dataset.jrKey!]
    if (!element) continue

    if (element.visible !== undefined) {
      syncs.push(() => {
        node.hidden = !evaluateVisibility(element.visible, ctx())
      })
    }

    const press = element.on?.press
    if (press) {
      node.addEventListener("click", (event) => {
        event.preventDefault()
        for (const binding of [press].flat()) run(binding)
      })
    }

    const [tag, property] = bindable[element.type] ?? []
    const path = property && resolveBindings(element.props as Record<string, unknown>, ctx())?.[property]
    const target = tag && (node.localName === tag ? node : node.querySelector(tag))
    if (path && target) {
      target.addEventListener(`${property}change`, (event) => {
        store.set(path, (event as CustomEvent<{ value: unknown }>).detail.value)
      })
      syncs.push(() => {
        void customElements.whenDefined(tag).then(() => {
          const live = target as unknown as Record<string, unknown>
          const value = store.get(path)
          if (value !== undefined && live[property] !== value) live[property] = value
        })
      })
    }
  }

  const sync = () => {
    for (const fn of syncs) fn()
  }
  store.subscribe(sync)
  sync()
  return store
}

/** Static pages: spec-html.ts embeds the Spec only when the page has state, actions or bindings. */
export function hydrateDocument() {
  const script = document.getElementById("json-render-spec")
  if (script?.textContent) hydrate(document, JSON.parse(script.textContent) as Spec)
}
