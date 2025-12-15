export interface Movie {
  id: string
  title: string
  slug: string
  posterUrl: string
  duration: number // minutes
  genres: string[]
  ratings: Ratings
  showtimes: Showtime[]
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
