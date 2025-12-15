import { Button } from "@/components/ui/button"
import { format, parseISO, isToday, isTomorrow } from "date-fns"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface DateSelectorProps {
  availableDates: string[]
  selectedDate: string
  onDateChange: (date: string) => void
}

export function DateSelector({ availableDates, selectedDate, onDateChange }: DateSelectorProps) {
  const selectedDateIndex = availableDates.indexOf(selectedDate)
  const canGoPrev = selectedDateIndex > 0
  const canGoNext = selectedDateIndex < availableDates.length - 1

  if (availableDates.length === 0) {
    return null
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={() => onDateChange(availableDates[selectedDateIndex - 1])}
        disabled={!canGoPrev}
        className="h-8 w-8"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="min-w-[120px] text-center font-medium">
        {formatDateLabel(selectedDate)}
      </span>
      <Button
        variant="outline"
        size="icon"
        onClick={() => onDateChange(availableDates[selectedDateIndex + 1])}
        disabled={!canGoNext}
        className="h-8 w-8"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}

function formatDateLabel(dateStr: string): string {
  const date = parseISO(dateStr)
  if (isToday(date)) return "Today"
  if (isTomorrow(date)) return "Tomorrow"
  return format(date, "EEE, MMM d")
}
