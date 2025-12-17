import { getToday } from "./getToday"

export function getStateFromUrl(): { movieSlug: string | null; date: string } {
  const path = window.location.pathname

  // URL format: /{date}/{movie-slug}
  const movieMatch = path.match(/^\/(\d{4}-\d{2}-\d{2})\/(.+)$/)
  if (movieMatch) {
    return {
      date: movieMatch[1],
      movieSlug: decodeURIComponent(movieMatch[2]),
    }
  }

  // URL format: /{date}
  const dateMatch = path.match(/^\/(\d{4}-\d{2}-\d{2})\/?$/)
  if (dateMatch) {
    return {
      date: dateMatch[1],
      movieSlug: null,
    }
  }

  // Default to today
  return { movieSlug: null, date: getToday() }
}
