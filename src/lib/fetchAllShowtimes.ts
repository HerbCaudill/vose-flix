import * as cheerio from "cheerio"
import type { Showtime, Cinema } from "@/types"
import { BASE_URL } from "./constants"
import { fetchHtml } from "./fetchHtml"

export type ShowtimesByMovie = Map<string, Showtime[]>

/**
 * Fetches all showtimes for all movies from the 7-day overview page.
 * This is more efficient than fetching each movie's detail page separately,
 * and ensures we get all future showtimes (not just the ones shown on detail pages).
 */
export async function fetchAllShowtimes(): Promise<ShowtimesByMovie> {
  const url = `${BASE_URL}/7-day-overview`
  const html = await fetchHtml(url)
  const $ = cheerio.load(html)

  const showtimesByMovie: ShowtimesByMovie = new Map()
  const cinemas = new Map<string, Cinema>()

  // Extract dates from table headers
  // Format: "Wed, 17 Dec" or "Thu, 18 Dec"
  const dates: string[] = []
  $("thead th.table-header").each((i, th) => {
    if (i === 0) return // Skip "Movie/Date" header
    const headerText = $(th).text().trim()
    const dateMatch = headerText.match(/(\w{3}),?\s*(\d{1,2})\s+(\w{3})/)
    if (dateMatch) {
      const [, , day, month] = dateMatch
      const date = parseDate(parseInt(day), month)
      dates.push(date)
    }
  })

  // Process each movie row
  $("tbody tr").each((_, row) => {
    const $row = $(row)
    const cells = $row.find("td")

    // First cell contains the movie link
    const movieCell = cells.first()
    const movieLink = movieCell.find('a[href*="/m/"]').first()
    const href = movieLink.attr("href") || ""
    const slugMatch = href.match(/\/m\/([^/]+)\//)
    if (!slugMatch) return

    const movieSlug = slugMatch[1]
    const movieShowtimes: Showtime[] = []
    const seenShowtimes = new Set<string>()

    // Process each day column (skip first cell which is the movie info)
    cells.each((cellIndex, cell) => {
      if (cellIndex === 0) return // Skip movie info cell
      const dateIndex = cellIndex - 1
      if (dateIndex >= dates.length) return

      const date = dates[dateIndex]
      const $cell = $(cell)

      // Find all showtime links in this cell
      $cell.find('a[href*="/r/"]').each((_, link) => {
        const $link = $(link)
        const linkHref = $link.attr("href") || ""
        const linkText = $link.text().trim()
        const tooltip = $link.attr("title") || ""

        // Extract time (HH:MM pattern)
        const timeMatch = linkText.match(/(\d{1,2}:\d{2})/)
        if (!timeMatch) return
        const time = timeMatch[1]

        // Extract cinema slug from URL: /r/{cinema}/{movie}/{id}
        const cinemaMatch = linkHref.match(/\/r\/([^/]+)\//)
        if (!cinemaMatch) return
        const cinemaSlug = cinemaMatch[1]

        // Extract showtime ID (last segment of the URL)
        const idMatch = linkHref.match(/\/(\d+)$/)
        const showtimeId = idMatch ? idMatch[1] : undefined

        // Create unique key to avoid duplicates
        const showtimeKey = `${cinemaSlug}|${date}|${time}`
        if (seenShowtimes.has(showtimeKey)) return
        seenShowtimes.add(showtimeKey)

        // Extract full cinema name from tooltip: "11:45 at Yelmo Westfield La Maquinista"
        let cinemaName = ""
        const tooltipMatch = tooltip.match(/at\s+(.+)$/)
        if (tooltipMatch) {
          cinemaName = tooltipMatch[1]
        } else {
          // Fallback: format cinema slug
          cinemaName = cinemaSlug
            .split("-")
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ")
        }

        // Cache cinema info
        if (!cinemas.has(cinemaSlug)) {
          cinemas.set(cinemaSlug, {
            id: cinemaSlug,
            name: cinemaName,
            slug: cinemaSlug,
          })
        }

        movieShowtimes.push({
          cinema: cinemas.get(cinemaSlug)!,
          date,
          time,
          bookingUrl: BASE_URL + linkHref,
          showtimeId,
          movieSlug,
        })
      })
    })

    if (movieShowtimes.length > 0) {
      showtimesByMovie.set(movieSlug, movieShowtimes)
    }
  })

  return showtimesByMovie
}

/**
 * Parse a date from day number and month abbreviation
 */
function parseDate(day: number, monthAbbr: string): string {
  const months: Record<string, number> = {
    Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
    Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
  }

  const month = months[monthAbbr]
  if (month === undefined) return ""

  const now = new Date()
  let year = now.getFullYear()

  // Handle year rollover: if the month is before the current month,
  // and we're in late year (Nov/Dec), assume it's next year
  if (month < now.getMonth() && now.getMonth() >= 10) {
    year++
  }

  const date = new Date(year, month, day)
  return date.toISOString().split("T")[0]
}
