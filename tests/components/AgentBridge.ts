import type { Page } from "@playwright/test"

export type AgentStep = { ref: string; action: string; args?: unknown[] }
export type AgentEntry = { component: string; label?: string; ref: string; offPage?: boolean; actions?: string[] }
type ActResult = { ok: boolean; error?: { message: string } }

/** ui-sdk's agent bridge (`createAgent`) that an example exposes on `window[global]` once it is ready. */
export class AgentBridge {
  constructor(
    private readonly page: Page,
    private readonly global: string,
  ) {}

  async ready() {
    await this.page.waitForFunction((name) => name in window, this.global)
  }

  async snapshot(): Promise<AgentEntry[]> {
    await this.ready()
    return this.page.evaluate(
      (name) =>
        (window as unknown as Record<string, { agent: { snapshot(): AgentEntry[] } }>)[name]!.agent.snapshot().filter((entry) => !entry.offPage),
      this.global,
    )
  }

  async act(steps: AgentStep[]): Promise<ActResult> {
    await this.ready()
    return this.page.evaluate(
      ({ name, steps }) => (window as unknown as Record<string, { agent: { act(input: unknown): Promise<ActResult> } }>)[name]!.agent.act({ steps }),
      { name: this.global, steps },
    )
  }
}
