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

interface FilterMenuProps {
  minScore: number | null
  onMinScoreChange: (value: number | null) => void
  cinemas: Cinema[]
  selectedCinemas: Set<string>
  onSelectedCinemasChange: (cinemas: Set<string>) => void
}

export function FilterMenu({
  minScore,
  onMinScoreChange,
  cinemas,
  selectedCinemas,
  onSelectedCinemasChange,
}: FilterMenuProps) {
  const activeFilterCount =
    (minScore !== null ? 1 : 0) +
    (selectedCinemas.size < cinemas.length && selectedCinemas.size > 0 ? 1 : 0)

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
  const noneSelected = selectedCinemas.size === 0

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
