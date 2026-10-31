import { describe, expect, it } from "vitest"
import { meetsMinScore } from "./meetsMinScore"

describe("meetsMinScore", () => {
  it("keeps films with no rating", () => {
    expect(meetsMinScore({}, 70)).toBe(true)
  })

  it("applies the minimum to rated films", () => {
    expect(meetsMinScore({ metacritic: 69 }, 70)).toBe(false)
    expect(meetsMinScore({ metacritic: 70 }, 70)).toBe(true)
  })

  it("keeps everything when no minimum is set", () => {
    expect(meetsMinScore({ metacritic: 10 }, null)).toBe(true)
  })
})
