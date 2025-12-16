import type * as cheerio from "cheerio"
import type { Showtime, Cinema } from "@/types"
import { BASE_URL } from "./constants"
import { findDateForShowtime } from "./findDateForShowtime"

export function extractShowtimes($: cheerio.CheerioAPI, movieSlug: string): Showtime[] {
  const showtimes: Showtime[] = []
  const cinemas = new Map<string, Cinema>()
  const seenShowtimes = new Set<string>()

  // Collect all showtime data first
  const showtimeData: Array<{
    href: string
    time: string
    cinemaSlug: string
    cinemaName: string
    date: string
    showtimeId: string
  }> = []

  // Find all showtime links - pattern: /r/cinema-slug/movie-slug/id
  $(`a[href*="/r/"][href*="/${movieSlug}/"]`).each((_, element) => {
    const $el = $(element)
    const href = $el.attr("href") || ""
    const linkText = $el.text().trim()

    // Extract time (HH:MM pattern)
    const timeMatch = linkText.match(/(\d{1,2}:\d{2})/)
    if (!timeMatch) return

    const time = timeMatch[1]

    // Extract cinema slug and showtime ID from URL: /r/{cinema}/{movie}/{id}
    const cinemaMatch = href.match(/\/r\/([^/]+)\//)
    if (!cinemaMatch) return

    const cinemaSlug = cinemaMatch[1]

    // Extract showtime ID (last segment of the URL)
    const idMatch = href.match(/\/(\d+)$/)
    if (!idMatch) return

    const showtimeId = idMatch[1]

    // Try to determine the date from context
    const date = findDateForShowtime($, element) || new Date().toISOString().split("T")[0]

    // Create a unique key for cinema + date + time to deduplicate
    const showtimeKey = `${cinemaSlug}|${date}|${time}`
    if (seenShowtimes.has(showtimeKey)) return
    seenShowtimes.add(showtimeKey)

    // Extract cinema name from the link text (after the time)
    let cinemaName = linkText.replace(timeMatch[0], "").trim()
    cinemaName = cinemaName.replace(/\*\*/g, "").trim()

    if (!cinemaName) {
      cinemaName = cinemaSlug
        .split("-")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    }

    showtimeData.push({ href, time, cinemaSlug, cinemaName, date, showtimeId })
  })

  // Use the redirect URLs directly - they'll redirect to the actual booking page when clicked
  for (const data of showtimeData) {
    if (!cinemas.has(data.cinemaSlug)) {
      cinemas.set(data.cinemaSlug, {
        id: data.cinemaSlug,
        name: data.cinemaName,
        slug: data.cinemaSlug,
      })
    }

    showtimes.push({
      cinema: cinemas.get(data.cinemaSlug)!,
      date: data.date,
      time: data.time,
      bookingUrl: BASE_URL + data.href,
      showtimeId: data.showtimeId,
      movieSlug,
    })
  }

  return showtimes
}
