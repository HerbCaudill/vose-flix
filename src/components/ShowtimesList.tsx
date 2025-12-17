import { ShowtimeButton } from "@/components/ShowtimeButton"
import type { Showtime } from "@/types"

interface ShowtimesListProps {
  showtimes: Showtime[]
  size?: "sm" | "default"
  emptyMessage?: string
  orientation?: "vertical" | "horizontal"
}

export function ShowtimesList({
  showtimes,
  size = "default",
  emptyMessage,
  orientation = "vertical",
}: ShowtimesListProps) {
  const sortedShowtimes = [...showtimes].sort((a, b) => a.time.localeCompare(b.time))

  if (sortedShowtimes.length === 0) {
    if (emptyMessage) {
      return <p className="text-muted-foreground">{emptyMessage}</p>
    }
    return null
  }

  const gap = size === "sm" ? "gap-1" : "gap-2"
  const direction = orientation === "horizontal" ? "flex-row flex-wrap" : "flex-col"

  return (
    <div className={`flex ${direction} ${gap}`}>
      {sortedShowtimes.map((showtime, i) => (
        <ShowtimeButton key={i} showtime={showtime} size={size} />
      ))}
    </div>
  )
}
