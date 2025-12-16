import { Slider } from "@/components/ui/slider"

interface ScoreFilterProps {
  value: number | null
  onChange: (value: number | null) => void
}

export function ScoreFilter({ value, onChange }: ScoreFilterProps) {
  const sliderValue = value ?? 0

  return (
    <div className="flex items-center gap-3">
      <span className="text-muted-foreground text-sm whitespace-nowrap">
        {value ? `${value}+` : "Any"}
      </span>
      <Slider
        value={[sliderValue]}
        onValueChange={([v]) => onChange(v === 0 ? null : v)}
        min={0}
        max={90}
        step={10}
        className="w-24"
      />
    </div>
  )
}
