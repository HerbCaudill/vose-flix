import { Button } from "@/components/ui/button"
import type { Showtime } from "@/types"

interface ShowtimeButtonProps {
  showtime: Showtime
  size?: "sm" | "default"
}

export function ShowtimeButton({ showtime, size = "default" }: ShowtimeButtonProps) {
  const sizeClasses = size === "sm" ? "h-6 px-2 text-xs gap-1" : "gap-2"

  return (
    <a
      href={showtime.bookingUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={e => e.stopPropagation()}
      className="w-fit"
    >
      <Button variant="outline" size="sm" className={sizeClasses}>
        <span className="font-semibold">{showtime.time}</span>
        <span className="text-muted-foreground">{showtime.cinema.name}</span>
      </Button>
    </a>
  )
}
