import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { getCachedMovies, setCachedMovies } from "./moviesCache"
import type { Movie } from "@/types"

const movies = [{ id: "1" }] as Movie[]

describe("moviesCache", () => {
  beforeEach(() => {
    const store = new Map<string, string>()
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, value),
      removeItem: (key: string) => store.delete(key),
    })
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it("treats movies as expired after 8 hours", () => {
    setCachedMovies(movies)
    vi.advanceTimersByTime(8 * 60 * 60 * 1000)
    expect(getCachedMovies()).toBeNull()
  })

  it("can still return expired movies as a fallback", () => {
    setCachedMovies(movies)
    vi.advanceTimersByTime(8 * 60 * 60 * 1000)
    expect(getCachedMovies(Infinity)).toEqual(movies)
  })
})
