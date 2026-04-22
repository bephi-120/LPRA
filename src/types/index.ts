// ============================================
// LPRA - TypeScript Types
// Matchean exactamente el schema de Supabase
// ============================================

// ---- Database row types ----

export type Profile = {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export type Album = {
  youtube_id: string
  title: string
  artist: string
  cover_url: string | null
  release_year: number | null
  genre: string | null
  total_tracks: number | null
  created_at: string
  updated_at: string
}

export type Song = {
  youtube_id: string
  album_youtube_id: string
  track_number: number
  title: string
  duration_seconds: number | null
  created_at: string
}

export type SongRating = {
  id: string
  user_id: string
  song_youtube_id: string
  album_youtube_id: string
  rating: number        // 0.0 – 10.0
  review_text: string | null
  created_at: string
  updated_at: string
}

export type AlbumReview = {
  id: string
  user_id: string
  album_youtube_id: string
  review_text: string | null
  created_at: string
  updated_at: string
}

// ---- View types ----

export type AlbumStats = {
  album_youtube_id: string
  title: string
  artist: string
  total_raters: number
  average_rating: number | null
  total_reviews: number
}

export type UserAlbumRating = {
  user_id: string
  album_youtube_id: string
  album_title: string
  artist: string
  calculated_rating: number | null
  songs_rated: number
  total_tracks: number | null
}

// ---- Compound types (joins) ----

export type SongWithRating = Song & {
  my_rating: SongRating | null
}

export type AlbumWithSongs = Album & {
  songs: SongWithRating[]
  my_review: AlbumReview | null
  stats: AlbumStats | null
}

// ---- ytmusic-api result types ----

export type YTMusicSearchResult = {
  type: 'ALBUM' | 'SINGLE' | 'EP'
  browseId: string        // → albums.youtube_id
  title: string
  artist: string
  year: string | null
  thumbnails: YTMusicThumbnail[]
}

export type YTMusicAlbum = {
  browseId: string
  title: string
  artist: string
  year: string | null
  thumbnails: YTMusicThumbnail[]
  tracks: YTMusicTrack[]
}

export type YTMusicTrack = {
  videoId: string         // → songs.youtube_id
  title: string
  duration: number | null // segundos
  trackNumber: number
}

export type YTMusicThumbnail = {
  url: string
  width: number
  height: number
}

// ---- Utility types ----

export type RatingInput = {
  song_youtube_id: string
  album_youtube_id: string
  rating: number
  review_text?: string
}

export type Supabase_Database = {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Omit<Profile, 'created_at' | 'updated_at'>; Update: Partial<Profile> }
      albums: { Row: Album; Insert: Omit<Album, 'created_at' | 'updated_at'>; Update: Partial<Album> }
      songs: { Row: Song; Insert: Omit<Song, 'created_at'>; Update: Partial<Song> }
      song_ratings: { Row: SongRating; Insert: Omit<SongRating, 'id' | 'created_at' | 'updated_at'>; Update: Partial<SongRating> }
      album_reviews: { Row: AlbumReview; Insert: Omit<AlbumReview, 'id' | 'created_at' | 'updated_at'>; Update: Partial<AlbumReview> }
    }
    Views: {
      album_stats: { Row: AlbumStats }
      user_album_ratings: { Row: UserAlbumRating }
    }
  }
}
