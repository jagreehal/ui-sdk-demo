import "./styles.css"

import "@ui-sdk-demo/ui/accordion"
import "@ui-sdk-demo/ui/checkbox"
import "@ui-sdk-demo/ui/dialog"
import "@ui-sdk-demo/ui/field"
import "@ui-sdk-demo/ui/input"
import "@ui-sdk-demo/ui/menu"
import "@ui-sdk-demo/ui/popover"
import "@ui-sdk-demo/ui/select"
import "@ui-sdk-demo/ui/slider"
import "@ui-sdk-demo/ui/switch"
import "@ui-sdk-demo/ui/tabs"
import "@ui-sdk-demo/ui/toggle"
import "@ui-sdk-demo/ui/tooltip"

const log = document.querySelector("#event-log")

function note(message) {
  if (!log) return
  const time = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
  const line = document.createElement("p")
  line.className = "font-mono text-xs text-ink-soft"
  line.textContent = `${time}  ${message}`
  log.prepend(line)
  while (log.children.length > 6) log.lastElementChild?.remove()
}

document.querySelector("#formatting")?.addEventListener(
  "pressedchange",
  (event) => {
    if (!(event instanceof CustomEvent) || !(event.target instanceof HTMLElement))
      return
    note(`Toggle “${event.target.textContent?.trim()}” → ${event.detail.value}`)
  },
  { capture: true },
)

document.querySelector("#notify")?.addEventListener("checkedchange", (event) => {
  if (!(event instanceof CustomEvent)) return
  note(`Notifications → ${event.detail.value ? "on" : "off"}`)
})

document.querySelector("#role")?.addEventListener("valuechange", (event) => {
  if (!(event instanceof CustomEvent)) return
  note(`Role → ${event.detail.value}`)
})

document.querySelector("#file-menu")?.addEventListener("action", (event) => {
  if (!(event instanceof CustomEvent)) return
  note(`Menu → ${event.detail.value}`)
})

document.querySelector("#volume")?.addEventListener("valuechange", (event) => {
  if (!(event instanceof CustomEvent)) return
  note(`Volume → ${event.detail.value}`)
})
