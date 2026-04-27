// TMDB API 호출 모음 — 영화/드라마 데이터를 가져오는 함수들
// TMDB API 문서: https://developer.themoviedb.org/docs

const API_KEY = import.meta.env.VITE_TMDB_API_KEY
const BASE_URL = 'https://api.themoviedb.org/3'

// 이미지 URL 생성 헬퍼 — size는 w300, w500, w780, original 등 사용 가능
export const getImageUrl = (path: string | null, size = 'w500') =>
  path ? `https://image.tmdb.org/t/p/${size}${path}` : null

// API 공통 fetch 함수 — 에러 처리 포함
async function tmdbFetch<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${BASE_URL}${endpoint}`)
  url.searchParams.set('api_key', API_KEY)
  url.searchParams.set('language', 'ko-KR') // 한국어 응답 요청
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value))

  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`TMDB API 오류: ${res.status}`)
  return res.json()
}

// 인기 영화 목록 — 메인 페이지 트렌딩 섹션에 사용
export const getPopularMovies = (page = '1') =>
  tmdbFetch<TmdbListResponse>('/movie/popular', { page })

// 인기 드라마 목록 (글로벌)
export const getPopularTV = (page = '1') =>
  tmdbFetch<TmdbListResponse>('/tv/popular', { page })

// 한국 드라마 목록 — with_original_language=ko로 한국어 작품만 필터
export const getKoreanTV = (page = '1') =>
  tmdbFetch<TmdbListResponse>('/discover/tv', {
    with_original_language: 'ko',
    sort_by: 'popularity.desc',
    page,
  })

// 현재 상영 중인 영화 (트렌딩 배너용)
export const getTrendingMovies = () =>
  tmdbFetch<TmdbListResponse>('/trending/movie/week')

// 현재 방영 중인 드라마
export const getTrendingTV = () =>
  tmdbFetch<TmdbListResponse>('/trending/tv/week')

// 영화 상세 정보
export const getMovieDetail = (id: number) =>
  tmdbFetch<TmdbMovieDetail>(`/movie/${id}`, { append_to_response: 'credits' })

// 드라마 상세 정보
export const getTVDetail = (id: number) =>
  tmdbFetch<TmdbTVDetail>(`/tv/${id}`, { append_to_response: 'credits' })

// 검색 — 영화+드라마 통합 검색
export const searchMulti = (query: string, page = '1') =>
  tmdbFetch<TmdbListResponse>('/search/multi', { query, page })

// ─── 타입 정의 ───────────────────────────────────────────────

export interface TmdbMedia {
  id: number
  title?: string        // 영화는 title
  name?: string         // 드라마는 name
  poster_path: string | null
  backdrop_path: string | null
  overview: string
  vote_average: number
  release_date?: string  // 영화
  first_air_date?: string // 드라마
  media_type?: 'movie' | 'tv' | 'person'
  genre_ids?: number[]
}

export interface TmdbListResponse {
  results: TmdbMedia[]
  total_pages: number
  total_results: number
  page: number
}

export interface TmdbMovieDetail extends TmdbMedia {
  genres: { id: number; name: string }[]
  runtime: number
  credits: { cast: CastMember[] }
}

export interface TmdbTVDetail extends TmdbMedia {
  genres: { id: number; name: string }[]
  episode_run_time: number[]
  number_of_seasons: number
  credits: { cast: CastMember[] }
}

export interface CastMember {
  id: number
  name: string
  character: string
  profile_path: string | null
}
