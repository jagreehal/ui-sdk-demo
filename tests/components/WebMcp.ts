import type { Page } from "@playwright/test"

export type WebMcpTool = { name: string; description: string; inputSchema: string }

/**
 * Bundled Chromium has no `document.modelContext`, so the default lane installs this double before any page
 * script runs. It follows Chrome: `inputSchema` comes back as a JSON string, input goes in as JSON, and a
 * handler that throws surfaces as `UnknownError`.
 */
export async function installWebMcpDouble(page: Page) {
  await page.addInitScript(() => {
    type Tool = { name: string; description: string; inputSchema?: unknown; execute(input: unknown): unknown }
    const registry = new Map<string, Tool>()
    const fail = (name: string, message: string): never => {
      const error = new Error(message)
      error.name = name
      throw error
    }
    Object.defineProperty(document, "modelContext", {
      configurable: true,
      value: {
        async registerTool(tool: Tool, options?: { signal?: AbortSignal }) {
          if (registry.has(tool.name)) fail("InvalidStateError", `Duplicate: ${tool.name}`)
          registry.set(tool.name, tool)
          options?.signal?.addEventListener("abort", () => registry.delete(tool.name))
        },
        async getTools() {
          return [...registry.values()]
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((tool) => ({ name: tool.name, description: tool.description, inputSchema: JSON.stringify(tool.inputSchema ?? {}) }))
        },
        async executeTool(tool: { name: string }, inputJson: string) {
          if (typeof inputJson !== "string") fail("UnknownError", "Failed to parse input arguments")
          try {
            const result = await registry.get(tool.name)!.execute(JSON.parse(inputJson))
            return typeof result === "string" ? result : String(JSON.stringify(result))
          } catch {
            return fail("UnknownError", "Tool was executed but the invocation failed. For example, the script function threw an error")
          }
        },
      },
    })
  })
}

/** What a browser agent sees and calls through WebMCP. */
export class WebMcp {
  constructor(private readonly page: Page) {}

  async tools(): Promise<WebMcpTool[]> {
    return this.page.evaluate(() => (document as unknown as { modelContext: { getTools(): Promise<WebMcpTool[]> } }).modelContext.getTools())
  }

  async call(name: string, input: unknown): Promise<unknown> {
    const text = await this.page.evaluate(
      async ({ name, input }) => {
        const context = (document as unknown as {
          modelContext: { getTools(): Promise<{ name: string }[]>; executeTool(tool: { name: string }, input: string): Promise<string> }
        }).modelContext
        const tool = (await context.getTools()).find((t) => t.name === name)
        if (!tool) throw new Error(`No WebMCP tool "${name}"`)
        return context.executeTool(tool, JSON.stringify(input))
      },
      { name, input },
    )
    return JSON.parse(text)
  }
}
