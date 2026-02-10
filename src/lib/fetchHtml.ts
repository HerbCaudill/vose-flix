import { BASE_URL, CORS_PROXIES } from "./constants"
import { getCachedHtml, setCachedHtml } from "./htmlCache"

export async function fetchHtml(url: string): Promise<string> {
  // Check cache first
  const cached = getCachedHtml(url)
  if (cached) {
    return cached
  }

  const errors: string[] = []

  // Try local proxy first (works in dev via Vite server proxy)
  if (url.startsWith(BASE_URL)) {
    const path = url.slice(BASE_URL.length)
    try {
      const response = await fetch(`/api/proxy${path}`)
      if (response.ok) {
        const html = await response.text()
        if (html && html.length > 100) {
          setCachedHtml(url, html)
          return html
        }
        errors.push(`local proxy: empty or too-short response`)
      } else {
        errors.push(`local proxy: ${response.status}`)
      }
    } catch (err) {
      errors.push(`local proxy: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  // Fall back to third-party CORS proxies
  for (const proxy of CORS_PROXIES) {
    try {
      const response = await fetch(proxy + encodeURIComponent(url))
      if (!response.ok) {
        errors.push(`${proxy}: ${response.status}`)
        continue
      }
      const html = await response.text()

      if (!html || html.length < 100) {
        errors.push(`${proxy}: empty or too-short response`)
        continue
      }

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
