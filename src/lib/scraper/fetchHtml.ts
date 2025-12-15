import { CORS_PROXY } from "./constants"

export async function fetchHtml(url: string): Promise<string> {
  const response = await fetch(CORS_PROXY + encodeURIComponent(url))
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`)
  }
  return response.text()
}
