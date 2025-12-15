interface RatingDisplayProps {
  label: string
  icon: string
  value: string
  subtext?: string
  color: string
}

export function RatingDisplay({ label, icon, value, subtext, color }: RatingDisplayProps) {
  return (
    <div className="flex items-center gap-2">
      <span className={`text-2xl ${color}`}>{icon}</span>
      <div>
        <div className="font-bold">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
        {subtext && <div className="text-xs text-muted-foreground">{subtext}</div>}
      </div>
    </div>
  )
}
