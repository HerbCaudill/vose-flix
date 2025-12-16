import { TMDB_API_KEY } from "./constants"

interface TmdbSearchResult {
  results: Array<{
    id: number
    title: string
    release_date: string
  }>
}

interface TmdbVideosResult {
  results: Array<{
    key: string
    site: string
    type: string
    official: boolean
  }>
}

export async function fetchTmdbTrailer(title: string, year?: number): Promise<string | null> {
  try {
    // Search for the movie
    const searchParams = new URLSearchParams({
      api_key: TMDB_API_KEY,
      query: title,
      ...(year && { year: year.toString() }),
    })

    const searchUrl = `https://api.themoviedb.org/3/search/movie?${searchParams}`
    const searchResponse = await fetch(searchUrl)
    const searchData: TmdbSearchResult = await searchResponse.json()
    console.log(searchData)

    if (!searchData.results || searchData.results.length === 0) {
      return null
    }

    // Get the first result's ID
    const movieId = searchData.results[0].id

    // Fetch videos for this movie
    const videosUrl = `https://api.themoviedb.org/3/movie/${movieId}/videos?api_key=${TMDB_API_KEY}`
    const videosResponse = await fetch(videosUrl)
    const videosData: TmdbVideosResult = await videosResponse.json()

    if (!videosData.results || videosData.results.length === 0) {
      return null
    }

    // Find the best trailer (prefer official YouTube trailers)
    const youtubeVideos = videosData.results.filter(v => v.site === "YouTube")

    // Priority: Official Trailer > Trailer > Teaser > any video
    const officialTrailer = youtubeVideos.find(v => v.type === "Trailer" && v.official)
    if (officialTrailer) return officialTrailer.key

    const trailer = youtubeVideos.find(v => v.type === "Trailer")
    if (trailer) return trailer.key

    const teaser = youtubeVideos.find(v => v.type === "Teaser")
    if (teaser) return teaser.key

    // Return any YouTube video if no trailer found
    if (youtubeVideos.length > 0) {
      return youtubeVideos[0].key
    }

    return null
  } catch (error) {
    console.error("Failed to fetch TMDB trailer:", error)
    return null
  }
}
