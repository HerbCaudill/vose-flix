import type * as cheerio from "cheerio"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function findDateForShowtime($: cheerio.CheerioAPI, element: any): string | null {
  const $el = $(element)

  // Date patterns to match
  const datePatterns = [
    /(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),?\s*(\d{1,2})\s+(Dec|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov)/i,
    /(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s*(\d{4})?/i,
  ]

  // Walk backwards through previous siblings and their descendants to find the closest h3 date header
  let current = $el.closest("p, div, li").prev()
  while (current.length > 0) {
    // Check if this element is an h3 or contains an h3
    const h3Text = current.is("h3") ? current.text() : current.find("h3").first().text()

    if (h3Text) {
      for (const pattern of datePatterns) {
        const match = h3Text.match(pattern)
        if (match) {
          const dateStr = match[0]
          // Handle year rollover (if date is in Jan-Feb and we're in Dec, it's next year)
          const now = new Date()
          const currentYear = now.getFullYear()
          let parsed = new Date(dateStr + " " + currentYear)

          // If the parsed date is more than 2 months in the past, assume next year
          if (parsed.getTime() < now.getTime() - 60 * 24 * 60 * 60 * 1000) {
            parsed = new Date(dateStr + " " + (currentYear + 1))
          }

          if (!isNaN(parsed.getTime())) {
            return parsed.toISOString().split("T")[0]
          }
        }
      }
    }
    current = current.prev()
  }

  // Fallback: check all preceding h3 elements in the document up to this point
  const allH3s = $("h3")
  let closestDate: string | null = null

  allH3s.each((_, h3) => {
    const $h3 = $(h3)
    // Only consider h3s that appear before our element in the document
    if ($h3.parents().last().find("*").index($h3) < $el.parents().last().find("*").index($el)) {
      const h3Text = $h3.text()
      for (const pattern of datePatterns) {
        const match = h3Text.match(pattern)
        if (match) {
          const dateStr = match[0]
          const now = new Date()
          const currentYear = now.getFullYear()
          let parsed = new Date(dateStr + " " + currentYear)

          if (parsed.getTime() < now.getTime() - 60 * 24 * 60 * 60 * 1000) {
            parsed = new Date(dateStr + " " + (currentYear + 1))
          }

          if (!isNaN(parsed.getTime())) {
            closestDate = parsed.toISOString().split("T")[0]
          }
        }
      }
    }
  })

  return closestDate
}
