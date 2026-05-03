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

// 2페이지를 병렬 fetch하여 최대 24개 반환 — 6열 그리드 4줄 꽉 채우기
async function tmdbFetch24(endpoint: string, params: Record<string, string> = {}): Promise<TmdbListResponse> {
  const [p1, p2] = await Promise.all([
    tmdbFetch<TmdbListResponse>(endpoint, { ...params, page: '1' }),
    tmdbFetch<TmdbListResponse>(endpoint, { ...params, page: '2' }),
  ])
  return { ...p1, results: [...p1.results, ...p2.results].slice(0, 24) }
}

// 인기 영화 목록 — 2페이지 병렬 fetch, 24개 반환
export const getPopularMovies = () => tmdbFetch24('/movie/popular')

// 인기 드라마 목록 (글로벌) — 24개 반환
export const getPopularTV = () => tmdbFetch24('/tv/popular')

// 한국 드라마 목록 — with_original_language=ko 필터, 24개 반환
export const getKoreanTV = () =>
  tmdbFetch24('/discover/tv', {
    with_original_language: 'ko',
    sort_by: 'popularity.desc',
  })

// 무한 스크롤용 — 단일 페이지 fetch
export const getPopularMoviesPaged = (page: number) =>
  tmdbFetch<TmdbListResponse>('/movie/popular', { page: String(page) })

export const getPopularTVPaged = (page: number) =>
  tmdbFetch<TmdbListResponse>('/tv/popular', { page: String(page) })

export const getKoreanTVPaged = (page: number) =>
  tmdbFetch<TmdbListResponse>('/discover/tv', {
    with_original_language: 'ko',
    sort_by: 'popularity.desc',
    page: String(page),
  })

export const discoverByGenrePaged = (mediaType: 'movie' | 'tv', genreId: number, page: number) =>
  tmdbFetch<TmdbListResponse>(`/discover/${mediaType}`, {
    with_genres: String(genreId),
    sort_by: 'popularity.desc',
    page: String(page),
  })

// 트렌딩 영화 (주간) — 24개 반환
export const getTrendingMovies = () => tmdbFetch24('/trending/movie/week')

// 트렌딩 드라마 (주간) — 24개 반환
export const getTrendingTV = () => tmdbFetch24('/trending/tv/week')

// 영화 상세 정보 — credits(출연진) + videos(트레일러) 함께 요청
export const getMovieDetail = (id: number) =>
  tmdbFetch<TmdbMovieDetail>(`/movie/${id}`, { append_to_response: 'credits,videos' })

// 드라마 상세 정보
export const getTVDetail = (id: number) =>
  tmdbFetch<TmdbTVDetail>(`/tv/${id}`, { append_to_response: 'credits,videos' })

// 비슷한 작품 — 상세 페이지 하단 추천용
export const getSimilar = (mediaType: 'movie' | 'tv', id: number) =>
  tmdbFetch<TmdbListResponse>(`/${mediaType}/${id}/similar`)

// 검색 — 영화+드라마 통합 검색
export const searchMulti = (query: string, page = '1') =>
  tmdbFetch<TmdbListResponse>('/search/multi', { query, page })

// 장르 목록
export const getMovieGenres = () =>
  tmdbFetch<TmdbGenreResponse>('/genre/movie/list')

export const getTVGenres = () =>
  tmdbFetch<TmdbGenreResponse>('/genre/tv/list')

// 장르 ID로 필터링된 결과 — 24개 반환
export const discoverByGenre = (mediaType: 'movie' | 'tv', genreId: number) =>
  tmdbFetch24(`/discover/${mediaType}`, {
    with_genres: String(genreId),
    sort_by: 'popularity.desc',
  })

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

export interface TmdbVideo {
  id: string
  key: string      // YouTube 영상 ID
  name: string
  site: string     // 'YouTube'
  type: string     // 'Trailer' | 'Teaser' | 'Clip' 등
  official: boolean
}

export interface TmdbMovieDetail extends TmdbMedia {
  genres: { id: number; name: string }[]
  runtime: number
  credits: { cast: CastMember[] }
  videos: { results: TmdbVideo[] }
}

export interface TmdbTVDetail extends TmdbMedia {
  genres: { id: number; name: string }[]
  episode_run_time: number[]
  number_of_seasons: number
  credits: { cast: CastMember[] }
  videos: { results: TmdbVideo[] }
}

export interface CastMember {
  id: number
  name: string
  character: string
  profile_path: string | null
}

export interface TmdbGenre {
  id: number
  name: string
}

export interface TmdbGenreResponse {
  genres: TmdbGenre[]
}
