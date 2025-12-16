import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface ScoreFilterProps {
  value: number | null
  onChange: (value: number | null) => void
}

const SCORE_OPTIONS = [
  { value: null, label: "Any score" },
  { value: 50, label: "50+" },
  { value: 60, label: "60+" },
  { value: 70, label: "70+" },
  { value: 80, label: "80+" },
  { value: 90, label: "90+" },
]

export function ScoreFilter({ value, onChange }: ScoreFilterProps) {
  return (
    <Select
      value={value?.toString() ?? "any"}
      onValueChange={v => onChange(v === "any" ? null : parseInt(v))}
    >
      <SelectTrigger className="w-32">
        <SelectValue placeholder="Min score" />
      </SelectTrigger>
      <SelectContent>
        {SCORE_OPTIONS.map(option => (
          <SelectItem
            key={option.value ?? "any"}
            value={option.value?.toString() ?? "any"}
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
