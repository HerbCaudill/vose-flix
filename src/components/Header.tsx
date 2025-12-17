import { Button } from "@/components/ui/button"
import { DateSelector } from "@/components/DateSelector"
import { FilterMenu } from "@/components/FilterMenu"
import type { Cinema } from "@/types"
import { Film, RefreshCw } from "lucide-react"

interface HeaderProps {
  availableDates: string[]
  selectedDate: string
  onDateChange: (date: string) => void
  minScore: number | null
  onMinScoreChange: (value: number | null) => void
  cinemas: Cinema[]
  selectedCinemas: Set<string>
  onSelectedCinemasChange: (cinemas: Set<string>) => void
  timeRange: [number, number]
  onTimeRangeChange: (value: [number, number]) => void
  loading: boolean
  onRefresh: () => void
  onLogoClick?: () => void
}

export function Header({
  availableDates,
  selectedDate,
  onDateChange,
  minScore,
  onMinScoreChange,
  cinemas,
  selectedCinemas,
  onSelectedCinemasChange,
  timeRange,
  onTimeRangeChange,
  loading,
  onRefresh,
  onLogoClick,
}: HeaderProps) {
  return (
    <header className="bg-background/95 sticky top-0 z-10 backdrop-blur md:border-b">
      <div className="flex flex-wrap items-center gap-x-4 px-4 py-3 md:py-4">
        <button
          onClick={onLogoClick}
          className="flex items-center gap-2 transition-opacity hover:opacity-80"
        >
          <Film className="text-primary h-6 w-6" />
          <h1 className="text-xl font-bold">VOSEflix</h1>
          <span className="text-muted-foreground hidden text-sm md:inline">
            Barcelona movies with original audio
          </span>
        </button>
        <div className="order-last mt-3 flex w-full items-center justify-between gap-4 border-t pt-3 md:order-0 md:m-0 md:ml-auto md:w-auto md:justify-start md:border-0 md:p-0">
          <DateSelector
            availableDates={availableDates}
            selectedDate={selectedDate}
            onDateChange={onDateChange}
          />
          <FilterMenu
            minScore={minScore}
            onMinScoreChange={onMinScoreChange}
            cinemas={cinemas}
            selectedCinemas={selectedCinemas}
            onSelectedCinemasChange={onSelectedCinemasChange}
            timeRange={timeRange}
            onTimeRangeChange={onTimeRangeChange}
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={loading}
          className="ml-auto gap-2 md:ml-0"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          <span className="hidden md:inline">Refresh</span>
        </Button>
      </div>
    </header>
  )
}
