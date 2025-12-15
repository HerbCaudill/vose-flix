export interface Movie {
  id: string
  title: string
  slug: string
  posterUrl: string
  duration: number // minutes
  genres: string[]
  year?: number
  ratings: Ratings
  showtimes: Showtime[]
  // OMDB fields
  rated?: string // e.g., "PG-13", "R"
  released?: string // e.g., "25 Dec 2024"
  director?: string
  writer?: string
  actors?: string
  plot?: string
  language?: string
  country?: string
  awards?: string
  boxOffice?: string
  imdbId?: string
}

export interface Ratings {
  rottenTomatoes?: {
    critics: number // percentage
    audience?: number // percentage
  }
  metacritic?: number // 0-100
  imdb?: {
    score: number // 0-10
    votes: number
  }
}

export interface Showtime {
  cinema: Cinema
  date: string // ISO date string YYYY-MM-DD
  time: string // HH:MM
  bookingUrl: string
}

export interface Cinema {
  id: string
  name: string
  slug: string
}

export interface MovieListItem {
  title: string
  slug: string
  posterUrl: string
  duration: number
  genres: string[]
  ratings: Ratings
}
