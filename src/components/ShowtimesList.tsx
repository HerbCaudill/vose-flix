import { ShowtimeButton } from "@/components/ShowtimeButton"
import type { Showtime } from "@/types"

interface ShowtimesListProps {
  showtimes: Showtime[]
  size?: "sm" | "default"
  emptyMessage?: string
}

export function ShowtimesList({ showtimes, size = "default", emptyMessage }: ShowtimesListProps) {
  const sortedShowtimes = [...showtimes].sort((a, b) => a.time.localeCompare(b.time))

  if (sortedShowtimes.length === 0) {
    if (emptyMessage) {
      return <p className="text-muted-foreground">{emptyMessage}</p>
    }
    return null
  }

  const gap = size === "sm" ? "gap-1" : "gap-2"

  return (
    <div className={`flex flex-col ${gap}`}>
      {sortedShowtimes.map((showtime, i) => (
        <ShowtimeButton key={i} showtime={showtime} size={size} />
      ))}
    </div>
  )
}
