import * as cheerio from "cheerio"
import type { Movie } from "@/types"
import { fetchHtml } from "./fetchHtml"
import { extractRatings } from "./extractRatings"
import { extractShowtimes } from "./extractShowtimes"

export async function fetchMovieDetails(slug: string, posterUrl: string): Promise<Movie | null> {
  const html = await fetchHtml(`/m/${slug}/in-english-in-barcelona`)
  const $ = cheerio.load(html)

  // Get title
  const title = $("h1").first().text().trim()
  if (!title) return null

  // Get a value from the labeled fields in the details section
  const getDetail = (label: string) =>
    $(".detail-item")
      .filter((_, el) => $(el).find(".detail-label").text().trim() === label)
      .find(".detail-value")
      .text()
      .trim()

  // Get duration, formatted like "1h 47m"
  const runtime = getDetail("Runtime")
  const hours = parseInt(runtime.match(/(\d+)h/)?.[1] ?? "0", 10)
  const minutes = parseInt(runtime.match(/(\d+)m/)?.[1] ?? "0", 10)
  const duration = hours * 60 + minutes

  // Get genres, formatted like "Comedy · Drama"
  const genres = getDetail("Genre")
    .split("·")
    .map(genre => genre.trim())
    .filter(Boolean)

  // Extract ratings from text
  const ratings = extractRatings($("body").text())

  // Extract showtimes
  const showtimes = extractShowtimes($, slug)

  return {
    id: slug,
    title,
    slug,
    posterUrl,
    duration,
    genres,
    year: parseInt(getDetail("Year"), 10) || undefined,
    ratings,
    showtimes,
  }
}
