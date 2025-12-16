import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Slider } from "@/components/ui/slider"
import type { Cinema } from "@/types"
import { SlidersHorizontal } from "lucide-react"

// Default time range: 12:00 (720 min) to 24:00 (1440 min)
const DEFAULT_TIME_RANGE: [number, number] = [720, 1440]

function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`
}

interface FilterMenuProps {
  minScore: number | null
  onMinScoreChange: (value: number | null) => void
  cinemas: Cinema[]
  selectedCinemas: Set<string>
  onSelectedCinemasChange: (cinemas: Set<string>) => void
  timeRange: [number, number]
  onTimeRangeChange: (value: [number, number]) => void
}

export function FilterMenu({
  minScore,
  onMinScoreChange,
  cinemas,
  selectedCinemas,
  onSelectedCinemasChange,
  timeRange,
  onTimeRangeChange,
}: FilterMenuProps) {
  const isDefaultTimeRange =
    timeRange[0] === DEFAULT_TIME_RANGE[0] && timeRange[1] === DEFAULT_TIME_RANGE[1]

  const activeFilterCount =
    (minScore !== null ? 1 : 0) +
    (selectedCinemas.size < cinemas.length && selectedCinemas.size > 0 ? 1 : 0) +
    (!isDefaultTimeRange ? 1 : 0)

  const toggleCinema = (cinemaId: string) => {
    const newSelection = new Set(selectedCinemas)
    if (newSelection.has(cinemaId)) {
      newSelection.delete(cinemaId)
    } else {
      newSelection.add(cinemaId)
    }
    onSelectedCinemasChange(newSelection)
  }

  const allSelected = selectedCinemas.size === cinemas.length

  const toggleAll = () => {
    if (allSelected) {
      onSelectedCinemasChange(new Set())
    } else {
      onSelectedCinemasChange(new Set(cinemas.map(c => c.id)))
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <SlidersHorizontal className="h-4 w-4" />
          <span className="hidden sm:inline">Filters</span>
          {activeFilterCount > 0 && (
            <span className="bg-primary text-primary-foreground rounded-full px-1.5 text-xs">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="end">
        <div className="p-3 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Minimum score</span>
            <span className="text-muted-foreground text-sm">
              {minScore ? `${minScore}+` : "Any"}
            </span>
          </div>
          <Slider
            value={[minScore ?? 0]}
            onValueChange={([v]) => onMinScoreChange(v === 0 ? null : v)}
            min={0}
            max={90}
            step={10}
          />
        </div>

        <DropdownMenuSeparator />

        <div className="p-3 space-y-3">
          <div className="space-y-1">
            <span className="text-sm font-medium">Time window</span>
            <div className="text-muted-foreground text-sm">
              Starts by <span className="font-semibold">{formatTime(timeRange[0])}</span>, ends by <span className="font-semibold">{formatTime(timeRange[1])}</span>
            </div>
          </div>
          <Slider
            value={timeRange}
            onValueChange={v => onTimeRangeChange(v as [number, number])}
            min={720}
            max={1440}
            step={30}
          />
        </div>

        <DropdownMenuSeparator />

        <div className="p-3 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Theaters</span>
            <button
              onClick={toggleAll}
              className="text-muted-foreground text-xs hover:text-foreground"
            >
              {allSelected ? "Clear all" : "Select all"}
            </button>
          </div>
          <div className="space-y-2">
            {cinemas.map(cinema => (
              <label
                key={cinema.id}
                className="flex items-center gap-2 cursor-pointer"
              >
                <Checkbox
                  checked={selectedCinemas.has(cinema.id)}
                  onCheckedChange={() => toggleCinema(cinema.id)}
                />
                <span className="text-sm">{cinema.name}</span>
              </label>
            ))}
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
