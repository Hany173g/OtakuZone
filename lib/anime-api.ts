// Integration with Jikan API for anime data
// This is optional and can be used to fetch anime information

const JIKAN_API_URL = process.env.JIKAN_API_URL || 'https://api.jikan.moe/v4'

export interface AnimeData {
  mal_id: number
  title: string
  title_english?: string
  title_japanese?: string
  images: {
    jpg: {
      image_url: string
      large_image_url: string
    }
  }
  synopsis?: string
  score?: number
  scored_by?: number
  rank?: number
  popularity?: number
  members?: number
  favorites?: number
  type?: string
  episodes?: number
  status?: string
  aired?: {
    from: string
    to: string
  }
  genres?: Array<{
    mal_id: number
    name: string
  }>
}

export async function searchAnime(query: string): Promise<AnimeData[]> {
  try {
    const response = await fetch(`${JIKAN_API_URL}/anime?q=${encodeURIComponent(query)}&limit=10`)
    const data = await response.json()
    return data.data || []
  } catch (error) {
    console.error('Error fetching anime data:', error)
    return []
  }
}

export async function getAnimeById(id: number): Promise<AnimeData | null> {
  try {
    const response = await fetch(`${JIKAN_API_URL}/anime/${id}/full`)
    const data = await response.json()
    return data.data || null
  } catch (error) {
    console.error('Error fetching anime data:', error)
    return null
  }
}

export async function getTopAnime(limit: number = 10): Promise<AnimeData[]> {
  try {
    const response = await fetch(`${JIKAN_API_URL}/top/anime?limit=${limit}`)
    const data = await response.json()
    return data.data || []
  } catch (error) {
    console.error('Error fetching top anime:', error)
    return []
  }
}

