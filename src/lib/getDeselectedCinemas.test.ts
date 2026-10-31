import { describe, expect, it } from "vitest"
import { getDeselectedCinemas } from "./getDeselectedCinemas"

const cinemas = [
  { id: "a", name: "A" },
  { id: "b", name: "B" },
]

describe("getDeselectedCinemas", () => {
  it("records the known cinemas that aren't selected", () => {
    expect(getDeselectedCinemas(new Set(["a"]), cinemas, new Set())).toEqual(new Set(["b"]))
  })

  it("forgets a cinema once it's selected again", () => {
    expect(getDeselectedCinemas(new Set(["a", "b"]), cinemas, new Set(["b"]))).toEqual(new Set())
  })

  it("remembers deselected cinemas with no films right now", () => {
    expect(getDeselectedCinemas(new Set(["a", "b"]), cinemas, new Set(["c"]))).toEqual(new Set(["c"]))
  })
})
