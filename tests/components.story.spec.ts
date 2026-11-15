import { story } from "executable-stories-playwright"
import { expect, test } from "./fixtures"

story.feature({
  title: "Hand-written markup, one script tag",
  narrative: "docs/components.html uses every themed component through the CDN loader, with no build step. Every ui-* tag must upgrade.",
  tags: ["loader", "components"],
})

test("every ui-* tag on the components page is upgraded", async ({ showcasePage }, testInfo) => {
  story.init(testInfo)
  story.given("the components showcase, which loads only ui/loader.js")
  await showcasePage.goto()
  await expect(showcasePage.heading).toBeVisible()
  story.then("the loader upgrades every ui-* element on the page")
  await expect.poll(() => showcasePage.undefinedUiTags()).toEqual([])
  await story.screenshot({ page: showcasePage.page, alt: "Components showcase", fullPage: true })
})
