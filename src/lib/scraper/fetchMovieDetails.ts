import * as cheerio from "cheerio"
import type { Movie, Ratings, Showtime, Cinema } from "@/types"
import { BASE_URL } from "./constants"
import { fetchHtml } from "./fetchHtml"

export async function fetchMovieDetails(slug: string): Promise<Movie | null> {
  const url = `${BASE_URL}/m/${slug}/in-english-in-barcelona`
  const html = await fetchHtml(url)
  const $ = cheerio.load(html)

  // Get title
  const title = $("h1").first().text().trim()
  if (!title) return null

  // Get poster - look for images from their CDN or TMDB
  let posterUrl = $('img[src*="img.englishcinemabarcelona.com"]').first().attr("src") || ""
  if (!posterUrl) {
    posterUrl = $('img[src*="tmdb"], img[src*="poster"]').first().attr("src") || ""
  }
  // Also check for any image in the page with a reasonable size pattern
  if (!posterUrl) {
    $("img").each((_, el) => {
      const src = $(el).attr("src") || ""
      if (src.includes("http") && !posterUrl) {
        posterUrl = src
      }
    })
  }

  // Get duration
  const bodyText = $("body").text()
  const durationMatch = bodyText.match(/(\d+)\s*(?:minutes|mins|m)\b/i)
  const duration = durationMatch ? parseInt(durationMatch[1], 10) : 0

  // Get genres
  const genres: string[] = []
  $('a[href*="/genre/"]').each((_, el) => {
    const genre = $(el).text().trim()
    if (genre && !genres.includes(genre)) {
      genres.push(genre)
    }
  })

  // Extract ratings from text
  const ratings = extractRatings(bodyText)

  // Extract showtimes
  const showtimes = await extractShowtimes($, slug)

  return {
    id: slug,
    title,
    slug,
    posterUrl,
    duration,
    genres,
    ratings,
    showtimes,
  }
}

function extractRatings(text: string): Ratings {
  const ratings: Ratings = {}

  // Rotten Tomatoes - look for percentage
  const rtMatch = text.match(/Rotten\s*Tomatoes[:\s]*(\d+)%/i)
  if (rtMatch) {
    ratings.rottenTomatoes = { critics: parseInt(rtMatch[1], 10) }
  }

  // Metacritic - look for score out of 100
  const mcMatch = text.match(/Metacritic[:\s]*(\d+)(?:\/100)?/i)
  if (mcMatch) {
    ratings.metacritic = parseInt(mcMatch[1], 10)
  }

  return ratings
}

async function extractShowtimes($: cheerio.CheerioAPI, movieSlug: string): Promise<Showtime[]> {
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

    // Extract cinema slug from URL
    const cinemaMatch = href.match(/\/r\/([^/]+)\//)
    if (!cinemaMatch) return

    const cinemaSlug = cinemaMatch[1]

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

    showtimeData.push({ href, time, cinemaSlug, cinemaName, date })
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
    })
  }

  return showtimes
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function findDateForShowtime($: cheerio.CheerioAPI, element: any): string | null {
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
