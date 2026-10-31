import { describe, expect, it } from "vitest"
import { calculateNormalizedScore } from "./calculateNormalizedScore"

describe("calculateNormalizedScore", () => {
  it("averages the review sites and ignores Sensacine when they have a score", () => {
    expect(calculateNormalizedScore({ metacritic: 80, rottenTomatoes: { critics: 90 }, sensacinePress: 10 })).toBe(85)
  })

  it("falls back to Sensacine's press score", () => {
    expect(calculateNormalizedScore({ sensacinePress: 86 })).toBe(86)
  })

  it("has no score without any ratings", () => {
    expect(calculateNormalizedScore({})).toBeNull()
  })
})
