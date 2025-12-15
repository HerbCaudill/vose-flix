import { CORS_PROXY } from "./constants"
import { getCachedHtml, setCachedHtml } from "./htmlCache"

export async function fetchHtml(url: string): Promise<string> {
  // Check cache first
  const cached = getCachedHtml(url)
  if (cached) {
    return cached
  }

  console.log(`[fetch] ${url}`)
  const response = await fetch(CORS_PROXY + encodeURIComponent(url))
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`)
  }
  const html = await response.text()

  // Cache the response
  setCachedHtml(url, html)

  return html
}
