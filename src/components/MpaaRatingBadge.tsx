import { Badge } from "@/components/ui/badge"

function getMpaaRatingColor(rated: string): string {
  switch (rated) {
    case "G":
      return "bg-green-600"
    case "PG":
      return "bg-blue-500"
    case "PG-13":
      return "bg-yellow-500 text-black"
    case "R":
      return "bg-red-600"
    case "NC-17":
      return "bg-purple-700"
    default:
      return "bg-gray-500"
  }
}

export function MpaaRatingBadge({ rated }: { rated: string }) {
  return (
    <Badge className={`${getMpaaRatingColor(rated)} text-xs font-bold`}>
      {rated}
    </Badge>
  )
}
