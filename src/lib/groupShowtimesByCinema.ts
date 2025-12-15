import type { Showtime } from "@/types"

export function groupShowtimesByCinema(showtimes: Showtime[]) {
  const byCinema = new Map<string, Showtime[]>()

  for (const showtime of showtimes) {
    if (!byCinema.has(showtime.cinema.id)) {
      byCinema.set(showtime.cinema.id, [])
    }
    byCinema.get(showtime.cinema.id)!.push(showtime)
  }

  return Array.from(byCinema.entries())
    .sort(([, a], [, b]) => a[0].cinema.name.localeCompare(b[0].cinema.name))
    .map(([, times]) => ({
      cinema: times[0].cinema,
      times: times.sort((a, b) => a.time.localeCompare(b.time)),
    }))
}
