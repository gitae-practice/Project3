// 앱 전체에서 공유하는 타입 정의

// 미디어 종류 구분 — 영화(movie) 또는 드라마(tv)
export type MediaType = 'movie' | 'tv'

// 시청 상태 — 찜(want), 시청 중(watching), 시청 완료(done)
export type WatchStatus = 'want' | 'watching' | 'done'

// Supabase watchlist 테이블 행 구조
export interface WatchlistItem {
  id: string
  user_id: string
  media_id: number
  media_type: MediaType
  title: string
  poster_path: string | null
  status: WatchStatus
  rating: number | null   // 별점 (1~5), 시청 완료 시 입력
  created_at: string
}

// 로그인한 사용자 정보 (Supabase Auth 기반)
export interface User {
  id: string
  email: string
}
