import { Badge } from "@/components/ui/badge"

interface RatingBadgeProps {
  type: "rt" | "mc" | "imdb"
  value: number // normalized 0-100
  label: string
}

export function RatingBadge({ type, value, label }: RatingBadgeProps) {
  const colors = {
    rt: value >= 60 ? "bg-red-600" : "bg-green-600",
    mc:
      value >= 60 ? "bg-black"
      : value >= 40 ? "bg-yellow-500"
      : "bg-red-600",
    imdb:
      value >= 70 ? "bg-amber-600"
      : value >= 50 ? "bg-amber-700"
      : "bg-amber-800",
  }

  return (
    <Badge className={`${colors[type]} text-xs font-bold text-white shadow-md`}>
      {label}
    </Badge>
  )
}
