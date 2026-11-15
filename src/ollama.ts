/** Browser helpers for Ollama model suggestions (generation goes through /api/generate). */

const baseURL =
  typeof window !== "undefined" ? "/ollama" : "http://127.0.0.1:11434"

export async function listOllamaModels(): Promise<string[]> {
  const response = await fetch(`${baseURL}/api/tags`)
  if (!response.ok) throw new Error(`Ollama tags failed: ${response.status}`)
  const data = (await response.json()) as {
    models?: { name: string }[]
  }
  return (data.models ?? [])
    .map((model) => model.name)
    .filter((name) => !/embed|rerank/i.test(name))
    .map((name) => `ollama/${name}`)
}
