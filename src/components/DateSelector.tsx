import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { formatDateLabel } from "@/lib/formatDateLabel"

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
      <span className="text-center font-medium">
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
