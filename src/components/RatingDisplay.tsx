interface RatingDisplayProps {
  label: string
  value: string
  score: number
  subtext?: string
}

function getScoreColor(score: number): string {
  if (score >= 70) return "bg-green-600"
  if (score >= 50) return "bg-yellow-500"
  return "bg-red-600"
}

export function RatingDisplay({ label, value, score, subtext }: RatingDisplayProps) {
  return (
    <div>
      <div className="text-muted-foreground flex gap-1 text-xs">
        <span>{label}</span>
        {subtext && <span className="text-muted-foreground text-xs">{subtext}</span>}
      </div>
      <div className="text-xl font-semibold flex items-center gap-2">
        <span className={`h-3 w-3 rounded-full ${getScoreColor(score)}`} />
        {value}
      </div>
    </div>
  )
}
