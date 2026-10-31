import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { fetchMovieDetails } from "./fetchMovieDetails"
import { fetchMovieList } from "./fetchMovieList"

const FILMS_PAGE = `
  <a class="film-card" data-title="The Invite" href="/m/the-invite/in-english-in-barcelona">
    <div class="film-card-poster">
      <img src="https://img.englishcinemabarcelona.com/poster.jpg" alt="The Invite" />
      <span class="film-card-showcount">116 showtimes</span>
    </div>
    <h2 class="film-card-title">The Invite</h2>
    <p class="film-card-next">Next: Tonight 15:50 · Renoir Floridablanca</p>
  </a>`

const DETAIL_PAGE = `
  <img src="https://img.englishcinemabarcelona.com/unrelated-cinema-logo.jpg" />
  <h1 class="hero-title">The Invite</h1>
  <div class="detail-item">
    <span class="detail-label">Year</span>
    <span class="detail-value">2026</span>
  </div>
  <div class="detail-item">
    <span class="detail-label">Runtime</span>
    <span class="detail-value">1h 47m</span>
  </div>
  <div class="detail-item">
    <span class="detail-label">Genre</span>
    <span class="detail-value">Comedy &#xB7; Drama &#xB7; Romance</span>
  </div>
  <div class="detail-item">
    <span class="detail-label">Rotten Tomatoes (Critics)</span>
    <span class="detail-value">96%</span>
  </div>
  <div class="detail-item">
    <span class="detail-label">Metacritic</span>
    <span class="detail-value">82</span>
  </div>
  <div class="cinema-block">
    <h3 class="cinema-block-name">
      <a href="/cinema/mooby-balmes">Mooby Balmes</a>
    </h3>
    <a class="showtime-chip" data-showtime-label="Sat 31 Oct 19:45" href="/r/mooby-balmes/the-invite/941136">
      <span class="showtime-chip-time">19:45</span>
    </a>
    <a class="showtime-chip" data-showtime-label="Tue 5 Jan 21:30" href="/r/mooby-balmes/the-invite/941137">
      <span class="showtime-chip-time">21:30</span>
    </a>
  </div>`

const stubFetch = (html: string) => {
  const fetchMock = vi.fn(async () => new Response(html))
  vi.stubGlobal("fetch", fetchMock)
  return fetchMock
}

describe("loading movies from the source site", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 9, 31, 12))
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it("lists films from the same-origin films page", async () => {
    const fetchMock = stubFetch(FILMS_PAGE)

    const movies = await fetchMovieList()

    expect(fetchMock).toHaveBeenCalledWith("/source/films")
    expect(movies).toMatchObject([
      {
        title: "The Invite",
        slug: "the-invite",
        posterUrl: "https://img.englishcinemabarcelona.com/poster.jpg",
      },
    ])
  })

  it("reads film details from the labeled detail fields", async () => {
    const fetchMock = stubFetch(DETAIL_PAGE)

    const movie = await fetchMovieDetails("the-invite", "https://img.englishcinemabarcelona.com/poster.jpg")

    expect(fetchMock).toHaveBeenCalledWith("/source/m/the-invite/in-english-in-barcelona")
    expect(movie).toMatchObject({
      title: "The Invite",
      posterUrl: "https://img.englishcinemabarcelona.com/poster.jpg",
      year: 2026,
      duration: 107,
      genres: ["Comedy", "Drama", "Romance"],
      ratings: { rottenTomatoes: { critics: 96 }, metacritic: 82 },
    })
  })

  it("dates each showtime from its label and names its cinema", async () => {
    stubFetch(DETAIL_PAGE)

    const movie = await fetchMovieDetails("the-invite", "")

    expect(movie?.showtimes).toMatchObject([
      {
        date: "2026-10-31",
        time: "19:45",
        cinema: { name: "Mooby Balmes", slug: "mooby-balmes" },
        bookingUrl: "https://englishcinemabarcelona.com/r/mooby-balmes/the-invite/941136",
        showtimeId: "941136",
      },
      { date: "2027-01-05", time: "21:30" },
    ])
  })
})
