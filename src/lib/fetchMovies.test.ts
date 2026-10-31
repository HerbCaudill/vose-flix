import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { fetchMovies } from "./fetchMovies"
import { mergeOmdbData } from "@/hooks/useMovies"
import type { Movie } from "@/types"

const showtime = (
  startsAt: string,
  urls: { provider: string; url: string }[] = [],
  tags: string[] = [],
) => ({
  startsAt,
  tags,
  data: { ticketing: urls.map(({ provider, url }) => ({ provider, urls: [url] })) },
})

const AMOR = {
  internalId: 123,
  title: "Un amor posible",
  originalTitle: "Ganeunghan Salang",
  runtime: "1h 54min",
  languages: ["KOREAN", "ENGLISH"],
  genres: [{ tag: "SCIENCE_FICTION" }, { tag: "DRAMA" }],
  poster: { url: "https://img/amor.jpg" },
  synopsis: "Una historia",
  countries: [{ name: "South Korea" }],
  data: { productionYear: 2026 },
}

const DUBBED_ONLY = { ...AMOR, internalId: 456, title: "Doblada", originalTitle: "Dubbed" }

/** Serves canned pages keyed by "cinema/date/page"; anything else is an empty page. */
const stubFetch = (pages: Record<string, { results: unknown[]; totalPages?: number }>) => {
  const fetchMock = vi.fn(async (url: string) => {
    const [, cinema, date, page] = url.match(/theater-(\w+)\/d-([\d-]+)\/p-(\d+)/)!
    const body = pages[`${cinema}/${date}/${page}`] ?? { results: [] }
    return Response.json({ results: body.results, pagination: { totalPages: body.totalPages ?? 1 } })
  })
  vi.stubGlobal("fetch", fetchMock)
  return fetchMock
}

describe("loading movies from Sensacine", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] })
    vi.setSystemTime(new Date("2026-11-01T12:00:00Z"))
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it("reads film details under their original title", async () => {
    stubFetch({
      "E0608/2026-11-01/1": {
        results: [{ movie: AMOR, showtimes: { original: [showtime("2026-11-01T19:45:00")] } }],
      },
    })

    const movies = await fetchMovies()

    expect(movies).toMatchObject([
      {
        id: "123",
        slug: "123",
        title: "Ganeunghan Salang",
        posterUrl: "https://img/amor.jpg",
        duration: 114,
        year: 2026,
        genres: ["Science Fiction", "Drama"],
        language: "Korean, English",
        country: "South Korea",
        plot: "Una historia",
      },
    ])
  })

  it("keeps only original-version screenings", async () => {
    stubFetch({
      "E0608/2026-11-01/1": {
        results: [
          { movie: DUBBED_ONLY, showtimes: { dubbed: [showtime("2026-11-01T17:00:00")] } },
          {
            movie: AMOR,
            showtimes: {
              dubbed: [showtime("2026-11-01T16:00:00")],
              original: [showtime("2026-11-01T22:00:00")],
              original_st: [showtime("2026-11-01T19:45:00")],
            },
          },
        ],
      },
    })

    const movies = await fetchMovies()

    expect(movies.map(movie => movie.title)).toEqual(["Ganeunghan Salang"])
    expect(movies[0].showtimes.map(s => s.time)).toEqual(["19:45", "22:00"])
  })

  it("keeps screenings in a film's own language whatever their version", async () => {
    const CATALAN = ["Localization.Language.Catalan"]
    const SPANISH = ["Localization.Language.Spanish"]
    const inSpanish = { ...AMOR, internalId: 789, originalTitle: "La Bola Negra", languages: ["SPANISH"] }
    const mostlyEnglish = {
      ...AMOR,
      internalId: 790,
      originalTitle: "Gilda",
      languages: ["ENGLISH", "SPANISH"],
    }
    stubFetch({
      "E0608/2026-11-01/1": {
        results: [
          {
            movie: inSpanish,
            showtimes: {
              local: [showtime("2026-11-01T16:00:00", [], SPANISH)],
              dubbed: [
                showtime("2026-11-01T18:00:00"),
                showtime("2026-11-01T20:00:00", [], CATALAN),
              ],
            },
          },
          { movie: mostlyEnglish, showtimes: { dubbed: [showtime("2026-11-01T17:00:00", [], SPANISH)] } },
        ],
      },
    })

    const movies = await fetchMovies()

    expect(movies.map(movie => movie.title)).toEqual(["La Bola Negra"])
    expect(movies[0].showtimes.map(s => s.time)).toEqual(["16:00", "18:00"])
  })

  it("lists a screening once when it appears under two versions", async () => {
    stubFetch({
      "E0608/2026-11-01/1": {
        results: [
          {
            movie: { ...AMOR, languages: ["SPANISH"] },
            showtimes: { local: [showtime("2026-11-01T16:00:00")], dubbed: [showtime("2026-11-01T16:00:00")] },
          },
        ],
      },
    })

    const [movie] = await fetchMovies()

    expect(movie.showtimes).toHaveLength(1)
  })

  it("combines a film's showtimes across cinemas, dates and pages", async () => {
    const entry = (startsAt: string) => ({ movie: AMOR, showtimes: { original: [showtime(startsAt)] } })
    const fetchMock = stubFetch({
      "E0608/2026-11-01/1": { results: [], totalPages: 2 },
      "E0608/2026-11-01/2": { results: [entry("2026-11-01T19:45:00")] },
      "E0608/2026-11-07/1": { results: [entry("2026-11-07T18:00:00")] },
      "E0581/2026-11-02/1": { results: [entry("2026-11-02T20:00:00")] },
    })

    const movies = await fetchMovies()

    expect(fetchMock).toHaveBeenCalledWith("/source/_/showtimes/theater-E0608/d-2026-11-01/p-2")
    expect(movies).toHaveLength(1)
    expect(movies[0].showtimes).toMatchObject([
      { date: "2026-11-01", time: "19:45", cinema: { id: "E0608", name: "Cines Verdi Barcelona" } },
      { date: "2026-11-02", time: "20:00", cinema: { id: "E0581", name: "Renoir Floridablanca" } },
      { date: "2026-11-07", time: "18:00", cinema: { id: "E0608" } },
    ])
  })

  it("links to the cinema's own ticketing page, falling back to Sensacine", async () => {
    stubFetch({
      "E0808/2026-11-01/1": {
        results: [
          {
            movie: AMOR,
            showtimes: {
              original: [
                showtime("2026-11-01T16:00:00", [
                  { provider: "relay", url: "https://relay/ticket" },
                  { provider: "default", url: "https://cinema/?p=tickets&perfCode=1&language=%s&theatre=%s" },
                ]),
                showtime("2026-11-01T18:00:00", [{ provider: "relay", url: "https://relay/ticket" }]),
                showtime("2026-11-01T20:00:00"),
              ],
            },
          },
        ],
      },
    })

    const [movie] = await fetchMovies()

    expect(movie.showtimes.map(s => s.bookingUrl)).toEqual([
      "https://cinema/?p=tickets&perfCode=1",
      "https://relay/ticket",
      "https://www.sensacine.com/cines/cine/E0808/",
    ])
  })

  it("skips entries with no film and cinemas that fail", async () => {
    const pages = vi.fn(async (url: string) => {
      if (url.includes("E0608")) return new Response("", { status: 404 })
      if (url.includes("E0581/d-2026-11-01"))
        return Response.json({
          results: [
            { movie: null, showtimes: { original: [showtime("2026-11-01T12:00:00")] } },
            { movie: AMOR, showtimes: { original: [showtime("2026-11-01T19:45:00")] } },
          ],
        })
      return Response.json({ results: [] })
    })
    vi.stubGlobal("fetch", pages)

    const movies = await fetchMovies()

    expect(movies.map(movie => movie.title)).toEqual(["Ganeunghan Salang"])
  })

  it("stops at the first rate-limited request instead of returning a partial list", async () => {
    const fetchMock = vi.fn(async (url: string) =>
      url.includes("E0764/d-2026-11-01") ?
        Response.json({
          results: [{ movie: AMOR, showtimes: { original: [showtime("2026-11-01T19:45:00")] } }],
        })
      : new Response("", { status: 429 }),
    )
    vi.stubGlobal("fetch", fetchMock)

    await expect(fetchMovies()).rejects.toThrow("Sensacine is temporarily blocking requests")
    expect(fetchMock.mock.calls.length).toBeLessThanOrEqual(6)
  })

  it("reports an error when every request fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("", { status: 403 })),
    )

    await expect(fetchMovies()).rejects.toThrow("403")
  })

  it("keeps the source's poster and language over OMDB's", () => {
    const movie = { posterUrl: "https://source/poster.jpg", language: "Korean", ratings: {} } as Movie

    const merged = mergeOmdbData(movie, { posterUrl: "https://omdb/poster.jpg", language: "English" })

    expect(merged.posterUrl).toBe("https://source/poster.jpg")
    expect(merged.language).toBe("Korean")
  })
})
