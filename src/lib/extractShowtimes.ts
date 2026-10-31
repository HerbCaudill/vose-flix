import type * as cheerio from "cheerio"
import type { Showtime, Cinema } from "@/types"
import { BASE_URL } from "./constants"
import { parseShowtimeDate } from "./parseShowtimeDate"

export function extractShowtimes($: cheerio.CheerioAPI, movieSlug: string): Showtime[] {
  const showtimes: Showtime[] = []
  const cinemas = new Map<string, Cinema>()
  const seenShowtimes = new Set<string>()

  // Find all showtime links - pattern: /r/cinema-slug/movie-slug/id
  $(`a[href*="/r/"][href*="/${movieSlug}/"]`).each((_, element) => {
    const $el = $(element)
    const href = $el.attr("href") || ""

    // Extract date and time from the label, formatted like "Sat 31 Oct 19:45"
    const label = $el.attr("data-showtime-label") || ""
    const date = parseShowtimeDate(label)
    const time = label.match(/(\d{1,2}:\d{2})/)?.[1]
    if (!date || !time) return

    // Extract cinema slug and showtime ID from URL: /r/{cinema}/{movie}/{id}
    const cinemaSlug = href.match(/\/r\/([^/]+)\//)?.[1]
    const showtimeId = href.match(/\/(\d+)$/)?.[1]
    if (!cinemaSlug || !showtimeId) return

    // Create a unique key for cinema + date + time to deduplicate
    const showtimeKey = `${cinemaSlug}|${date}|${time}`
    if (seenShowtimes.has(showtimeKey)) return
    seenShowtimes.add(showtimeKey)

    if (!cinemas.has(cinemaSlug)) {
      cinemas.set(cinemaSlug, {
        id: cinemaSlug,
        name: $el.closest(".cinema-block").find(".cinema-block-name").text().trim(),
        slug: cinemaSlug,
      })
    }

    showtimes.push({
      cinema: cinemas.get(cinemaSlug)!,
      date,
      time,
      bookingUrl: BASE_URL + href,
      showtimeId,
      movieSlug,
    })
  })

  return showtimes.sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))
}
