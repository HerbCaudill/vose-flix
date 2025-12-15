import * as cheerio from "cheerio"
import type { MovieListItem } from "@/types"
import { BASE_URL } from "./constants"
import { fetchHtml } from "./fetchHtml"

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
