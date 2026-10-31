import type { Cinema } from "@/types"

/** Works out which cinemas to remember as off after the selection changes. */
export function getDeselectedCinemas(
  /** The cinemas now selected. */
  selected: Set<string>,
  /** The cinemas that currently have films. */
  cinemas: Cinema[],
  /** The cinemas previously off, which may include some with no films right now. */
  previous: Set<string>,
): Set<string> {
  const known = new Set(cinemas.map(cinema => cinema.id))
  return new Set([
    ...[...previous].filter(id => !known.has(id)),
    ...[...known].filter(id => !selected.has(id)),
  ])
}
