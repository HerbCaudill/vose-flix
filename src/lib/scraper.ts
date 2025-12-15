import * as cheerio from "cheerio"
import type { Movie, MovieListItem, Ratings, Showtime, Cinema } from "@/types"

const BASE_URL = "https://englishcinemabarcelona.com"
const CORS_PROXY = "https://corsproxy.io/?"

async function fetchHtml(url: string): Promise<string> {
  const response = await fetch(CORS_PROXY + encodeURIComponent(url))
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`)
  }
  return response.text()
}

export async function fetchMovieList(): Promise<MovieListItem[]> {
  const html = await fetchHtml(BASE_URL)
  const $ = cheerio.load(html)
  const movies: MovieListItem[] = []

  // Find all movie cards on the homepage
  $('a[href^="/m/"]').each((_, element) => {
    const $el = $(element)
    const href = $el.attr("href")
    if (!href || !href.includes("/in-english-in-barcelona")) return

    const slug = href.split("/m/")[1]?.split("/")[0]
    if (!slug) return

    // Get title from the link text or nearby heading
    const title = $el.find("h2, h3").first().text().trim() || $el.text().trim()
    if (!title || title.length > 100) return // Skip if no valid title

    // Get poster image
    const img = $el.find("img").first()
    const posterUrl = img.attr("src") || ""

    // Get duration (look for pattern like "195m" or "2h 15m")
    const durationText = $el.text()
    const durationMatch = durationText.match(/(\d+)\s*m(?:in)?/i)
    const duration = durationMatch ? parseInt(durationMatch[1], 10) : 0

    // Skip duplicates
    if (movies.some(m => m.slug === slug)) return

    movies.push({
      title,
      slug,
      posterUrl,
      duration,
      genres: [],
      ratings: {},
    })
  })

  return movies
}

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

  // Resolve booking URLs in parallel (batch of 10)
  const batchSize = 10
  for (let i = 0; i < showtimeData.length; i += batchSize) {
    const batch = showtimeData.slice(i, i + batchSize)
    const resolvedUrls = await Promise.all(
      batch.map(async data => {
        const bookingUrl = await resolveBookingUrl(BASE_URL + data.href)
        return { ...data, bookingUrl }
      })
    )

    for (const data of resolvedUrls) {
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
        bookingUrl: data.bookingUrl,
      })
    }
  }

  return showtimes
}

async function resolveBookingUrl(redirectUrl: string): Promise<string> {
  try {
    const html = await fetchHtml(redirectUrl)
    const $ = cheerio.load(html)

    // Look for the actual booking link - usually a "Buy tickets" or external link
    const bookingLink = $('a[href*="cinesa.es"], a[href*="yelmo.es"], a[href*="moobycines"], a[href*="cinesverdi"], a[href*="arenascinema"], a[href*="entradas"], a[rel="nofollow"]').first().attr("href")

    if (bookingLink) {
      return bookingLink
    }

    // Check for meta refresh redirect
    const metaRefresh = $('meta[http-equiv="refresh"]').attr("content")
    if (metaRefresh) {
      const urlMatch = metaRefresh.match(/url=(.+)/i)
      if (urlMatch) {
        return urlMatch[1]
      }
    }

    // Check for JavaScript redirect
    const scriptText = $("script").text()
    const jsRedirect = scriptText.match(/window\.location\s*=\s*["']([^"']+)["']/) ||
                       scriptText.match(/location\.href\s*=\s*["']([^"']+)["']/)
    if (jsRedirect) {
      return jsRedirect[1]
    }
  } catch (error) {
    console.error("Failed to resolve booking URL:", error)
  }

  // Fall back to the redirect URL if we can't resolve it
  return redirectUrl
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function findDateForShowtime($: cheerio.CheerioAPI, element: any): string | null {
  // Walk up and backwards through the DOM to find a date header
  const $el = $(element)

  // Look for date patterns in preceding headings
  const datePatterns = [
    /(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s*(\d{4})?/i,
    /(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),?\s*(\d{1,2})\s+(Dec|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov)/i,
  ]

  // Check parent sections for date info
  const parentText = $el.parents("section, div, article").first().text()

  for (const pattern of datePatterns) {
    const match = parentText.match(pattern)
    if (match) {
      // Parse and return ISO date
      const dateStr = match[0]
      const parsed = new Date(dateStr + " 2025")
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString().split("T")[0]
      }
    }
  }

  return null
}

// OMDB API for IMDB ratings
const OMDB_API_KEY = "trilogy" // Free demo key - consider getting your own

export interface OmdbData {
  imdb?: { score: number; votes: number }
  posterUrl?: string
}

export async function fetchOmdbData(title: string): Promise<OmdbData> {
  const result: OmdbData = {}
  try {
    const url = `https://www.omdbapi.com/?t=${encodeURIComponent(title)}&apikey=${OMDB_API_KEY}`
    const response = await fetch(url)
    const data = await response.json()

    if (data.Response === "True") {
      if (data.imdbRating && data.imdbRating !== "N/A") {
        result.imdb = {
          score: parseFloat(data.imdbRating),
          votes: parseInt(data.imdbVotes?.replace(/,/g, "") || "0", 10),
        }
      }
      if (data.Poster && data.Poster !== "N/A") {
        result.posterUrl = data.Poster
      }
    }
  } catch (error) {
    console.error("Failed to fetch OMDB data:", error)
  }
  return result
}
