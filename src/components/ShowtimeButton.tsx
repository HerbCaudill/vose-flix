import { Button } from "@/components/ui/button"
import type { Showtime } from "@/types"

const GOTO_URL = "https://englishcinemabarcelona.com/goto"

interface ShowtimeButtonProps {
  showtime: Showtime
  size?: "sm" | "default"
}

export function ShowtimeButton({ showtime, size = "default" }: ShowtimeButtonProps) {
  const sizeClasses = size === "sm" ? "h-6 px-2 text-xs gap-1" : "gap-2"

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()

    // If we have the showtime ID, submit a form to get direct booking redirect
    if (showtime.showtimeId && showtime.movieSlug) {
      e.preventDefault()

      // Create and submit a form to the /goto/ endpoint
      const form = document.createElement("form")
      form.method = "POST"
      form.action = `${GOTO_URL}/${showtime.cinema.slug}/${showtime.showtimeId}`
      form.target = "_blank"

      const fields = {
        showtimeId: showtime.showtimeId,
        cinemaslug: showtime.cinema.slug,
        movieslug: showtime.movieSlug,
      }

      for (const [name, value] of Object.entries(fields)) {
        const input = document.createElement("input")
        input.type = "hidden"
        input.name = name
        input.value = value
        form.appendChild(input)
      }

      document.body.appendChild(form)
      form.submit()
      document.body.removeChild(form)
    }
    // Otherwise, fall back to the regular link behavior
  }

  return (
    <a
      href={showtime.bookingUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className="w-fit"
    >
      <Button variant="outline" size="sm" className={sizeClasses}>
        <span className="font-semibold">{showtime.time}</span>
        <span className="text-muted-foreground">{showtime.cinema.name}</span>
      </Button>
    </a>
  )
}
