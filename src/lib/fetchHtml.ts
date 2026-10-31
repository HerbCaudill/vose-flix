import { SOURCE_PROXY_PATH } from "./constants"
import { getCachedHtml, setCachedHtml } from "./htmlCache"

/** Fetches a page from the source site through the app's same-origin rewrite. */
export async function fetchHtml(path: string): Promise<string> {
  // Check cache first
  const cached = getCachedHtml(path)
  if (cached) {
    return cached
  }

  const response = await fetch(SOURCE_PROXY_PATH + path)
  if (!response.ok) {
    throw new Error(`Failed to fetch ${path}: ${response.status}`)
  }
  const html = await response.text()

  // Cache the response
  setCachedHtml(path, html)
  return html
}
