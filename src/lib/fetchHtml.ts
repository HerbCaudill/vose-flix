import { CORS_PROXIES } from "./constants"
import { getCachedHtml, setCachedHtml } from "./htmlCache"

export async function fetchHtml(url: string): Promise<string> {
  // Check cache first
  const cached = getCachedHtml(url)
  if (cached) {
    return cached
  }

  const errors: string[] = []

  for (const proxy of CORS_PROXIES) {
    try {
      const response = await fetch(proxy + encodeURIComponent(url))
      if (!response.ok) {
        errors.push(`${proxy}: ${response.status}`)
        continue
      }
      const html = await response.text()

      // Validate we got actual HTML content
      if (!html || html.length < 100) {
        errors.push(`${proxy}: empty or too-short response`)
        continue
      }

      // Cache the response
      setCachedHtml(url, html)
      return html
    } catch (err) {
      errors.push(`${proxy}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  throw new Error(
    `Failed to fetch ${url} (all proxies failed):\n${errors.join("\n")}`
  )
}
