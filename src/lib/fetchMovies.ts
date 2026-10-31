import type { Cinema, Movie, Showtime } from "@/types"
import { SOURCE_PROXY_PATH, SOURCE_URL } from "./constants"
import { getToday } from "./getToday"

/** Loads every original-version film showing in Barcelona over the coming week. */
export async function fetchMovies(): Promise<Movie[]> {
  const requests = CINEMAS.flatMap(cinema => getUpcomingDates().map(date => ({ cinema, date })))
  const movies = new Map<string, Movie>()
  let firstError: unknown
  let successes = 0

  // Limit concurrent requests to avoid overwhelming the source site
  for (let i = 0; i < requests.length; i += BATCH_SIZE) {
    const batch = requests.slice(i, i + BATCH_SIZE)
    const results = await Promise.allSettled(batch.map(({ cinema, date }) => fetchListings(cinema, date)))

    results.forEach((result, j) => {
      // Cinemas close and change IDs, so one failure shouldn't hide the others
      if (result.status === "rejected") {
        firstError ??= result.reason
        return
      }
      successes++
      for (const listing of result.value) addListing(movies, listing, batch[j].cinema)
    })
  }

  if (successes === 0) throw firstError

  return [...movies.values()].map(movie => ({
    ...movie,
    showtimes: movie.showtimes.sort((a, b) =>
      `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`),
    ),
  }))
}

/** Gets the next week of dates, starting today. */
function getUpcomingDates(): string[] {
  const start = new Date(`${getToday()}T00:00:00Z`).getTime()
  return Array.from({ length: DAYS_AHEAD }, (_, i) =>
    new Date(start + i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  )
}

/** Fetches all pages of one cinema's listings for one date. */
async function fetchListings(cinema: Cinema, date: string): Promise<Listing[]> {
  const first = await fetchPage(cinema, date, 1)
  const pageCount = first.pagination?.totalPages ?? 1
  const rest = await Promise.all(
    Array.from({ length: Math.max(pageCount - 1, 0) }, (_, i) => fetchPage(cinema, date, i + 2)),
  )
  return [first, ...rest].flatMap(page => page.results ?? [])
}

/** Fetches one page of listings through the app's same-origin rewrite, which adds the trailing slash Sensacine requires. */
async function fetchPage(cinema: Cinema, date: string, page: number): Promise<ListingsPage> {
  const path = `/_/showtimes/theater-${cinema.id}/d-${date}/p-${page}`
  const response = await fetch(SOURCE_PROXY_PATH + path)
  if (!response.ok) throw new Error(`Failed to fetch ${path}: ${response.status}`)
  return response.json()
}

/** Adds a listing's original-version showtimes to its film, creating the film if needed. */
function addListing(movies: Map<string, Movie>, { movie, showtimes }: Listing, cinema: Cinema) {
  if (!movie) return

  const screenings = ORIGINAL_VERSIONS.flatMap(version => showtimes?.[version] ?? [])
  if (screenings.length === 0) return

  const id = String(movie.internalId)
  if (!movies.has(id)) movies.set(id, toMovie(id, movie))
  movies.get(id)!.showtimes.push(...screenings.map(screening => toShowtime(screening, cinema)))
}

/** Converts a Sensacine film to a movie with no showtimes yet. */
function toMovie(id: string, movie: SourceMovie): Movie {
  return {
    id,
    slug: id,
    title: movie.originalTitle || movie.title,
    posterUrl: movie.poster?.url ?? "",
    duration: parseRuntime(movie.runtime),
    genres: (movie.genres ?? []).map(genre => toTitleCase(genre.tag)),
    year: movie.data?.productionYear ?? undefined,
    language: movie.languages?.map(toTitleCase).join(", ") || undefined,
    country: movie.countries?.map(country => country.name).join(", ") || undefined,
    plot: movie.synopsis || undefined,
    ratings: {},
    showtimes: [],
  }
}

/** Converts a Sensacine screening, whose local start time looks like "2026-11-01T16:10:00". */
function toShowtime({ startsAt, data }: SourceShowtime, cinema: Cinema): Showtime {
  return {
    cinema,
    date: startsAt.slice(0, 10),
    time: startsAt.slice(11, 16),
    bookingUrl: getBookingUrl(data?.ticketing ?? [], cinema),
  }
}

/** Prefers the cinema's own ticketing page, since relay links can fail to redirect. */
function getBookingUrl(ticketing: SourceTicketing[], cinema: Cinema): string {
  const provider = ticketing.find(t => t.provider === "default") ?? ticketing[0]
  const url = provider?.urls[0]
  // Sensacine fills these placeholders in on its own pages
  return url?.replace(/[?&]\w+=%s/g, "") ?? `${SOURCE_URL}/cines/cine/${cinema.id}/`
}

/** Parses a runtime like "1h 54min" into minutes. */
function parseRuntime(runtime: string | null | undefined): number {
  const hours = parseInt(runtime?.match(/(\d+)h/)?.[1] ?? "0", 10)
  const minutes = parseInt(runtime?.match(/(\d+)\s*min/)?.[1] ?? "0", 10)
  return hours * 60 + minutes
}

/** Formats a tag like "SCIENCE_FICTION" as "Science Fiction". */
function toTitleCase(tag: string): string {
  return tag
    .toLowerCase()
    .split("_")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

const BATCH_SIZE = 6
const DAYS_AHEAD = 7

// Sensacine groups showtimes by version; these are the plain, subtitled and captioned originals
const ORIGINAL_VERSIONS = ["original", "original_st", "original_sme"]

const CINEMAS: Cinema[] = [
  { id: "E0764", name: "Arenas Multicines" },
  { id: "E0091", name: "Aribau Multicines" },
  { id: "E0808", name: "Balmes Multicines" },
  { id: "E0136", name: "Bosque Multicines" },
  { id: "E0747", name: "Cinemes Girona" },
  { id: "E0873", name: "Cinemes Texas" },
  { id: "E0608", name: "Cines Verdi Barcelona" },
  { id: "E0610", name: "Cines Verdi Park" },
  { id: "E0381", name: "Cinesa Diagonal" },
  { id: "E0382", name: "Cinesa Diagonal Mar" },
  { id: "E0388", name: "Cinesa SOM Multiespai" },
  { id: "E0442", name: "Glòries Multicines" },
  { id: "E0447", name: "Gran Sarrià Multicines" },
  { id: "E0682", name: "Maldà Arts Forum" },
  { id: "E0581", name: "Renoir Floridablanca" },
  { id: "E0544", name: "Sala Phenomena Experience" },
  { id: "E0850", name: "Zumzeig Cinema" },
]

interface ListingsPage {
  results?: Listing[]
  pagination?: { totalPages?: number }
}

interface Listing {
  movie: SourceMovie | null
  showtimes?: Record<string, SourceShowtime[]>
}

interface SourceMovie {
  internalId: number
  title: string
  originalTitle?: string | null
  runtime?: string | null
  languages?: string[] | null
  genres?: { tag: string }[] | null
  poster?: { url: string } | null
  synopsis?: string | null
  countries?: { name: string }[] | null
  data?: { productionYear?: number | null } | null
}

interface SourceShowtime {
  startsAt: string
  data?: { ticketing?: SourceTicketing[] | null } | null
}

interface SourceTicketing {
  provider: string
  urls: string[]
}
