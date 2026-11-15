import type { Page } from "@playwright/test"

/** docs/components.html: every themed component, through the CDN loader. */
export class ShowcasePage {
  constructor(readonly page: Page) {}

  get heading() {
    return this.page.getByRole("heading", { name: "Component showcase" })
  }

  async goto() {
    await this.page.goto("components.html")
  }

  /** ui-* tags on the page that haven't upgraded yet. */
  async undefinedUiTags() {
    return this.page.evaluate(() => [
      ...new Set([...document.querySelectorAll(":not(:defined)")].map((el) => el.localName).filter((tag) => tag.startsWith("ui-"))),
    ])
  }
}
