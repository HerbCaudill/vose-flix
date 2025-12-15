interface RatingDisplayProps {
  label: string
  value: string
  subtext?: string
}

export function RatingDisplay({ label, value, subtext }: RatingDisplayProps) {
  return (
    <div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
      {subtext && <div className="text-xs text-muted-foreground">{subtext}</div>}
    </div>
  )
}
