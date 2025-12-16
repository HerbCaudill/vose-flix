import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Slider } from "@/components/ui/slider"
import { SlidersHorizontal } from "lucide-react"

interface FilterMenuProps {
  minScore: number | null
  onMinScoreChange: (value: number | null) => void
}

export function FilterMenu({ minScore, onMinScoreChange }: FilterMenuProps) {
  const hasActiveFilters = minScore !== null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <SlidersHorizontal className="h-4 w-4" />
          <span className="hidden sm:inline">Filters</span>
          {hasActiveFilters && (
            <span className="bg-primary text-primary-foreground rounded-full px-1.5 text-xs">
              1
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
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
