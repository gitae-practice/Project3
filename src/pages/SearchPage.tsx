import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  searchMulti,
  getPopularMovies,
  getPopularTV,
  getPopularMoviesPaged,
  getPopularTVPaged,
  getKoreanTVPaged,
  getMovieGenres,
  getTVGenres,
  discoverByGenrePaged,
  type TmdbListResponse,
} from '../api/tmdb'
import MediaCard from '../components/ui/MediaCard'
import Spinner from '../components/ui/Spinner'
import type { MediaType } from '../types'

export default function SearchPage() {
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q') || ''
  const filter = searchParams.get('filter') as MediaType | null
  const [selectedGenre, setSelectedGenre] = useState<number | null>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setSelectedGenre(null) }, [filter])

  // ── 탐색하기(전체) 탭 — 기존 24개 방식 유지 ──────────────────
  const { data: allMoviesData, isLoading: allMoviesLoading } = useQuery<TmdbListResponse>({
    queryKey: ['popular-movies'],
    queryFn: () => getPopularMovies(),
    enabled: !query && !filter && !selectedGenre,
  })
  const { data: allTVData, isLoading: allTVLoading } = useQuery<TmdbListResponse>({
    queryKey: ['popular-tv'],
    queryFn: () => getPopularTV(),
    enabled: !query && !filter && !selectedGenre,
  })

  // ── 검색 무한 스크롤 ──────────────────────────────────────────
  const searchQuery = useInfiniteQuery({
    queryKey: ['search-inf', query],
    queryFn: ({ pageParam }) => searchMulti(query, String(pageParam)),
    initialPageParam: 1,
    getNextPageParam: (last) => last.page < last.total_pages ? last.page + 1 : undefined,
    enabled: !!query,
  })

  // ── 영화 탭 무한 스크롤 ───────────────────────────────────────
  const moviesQuery = useInfiniteQuery({
    queryKey: ['popular-movies-inf'],
    queryFn: ({ pageParam }) => getPopularMoviesPaged(pageParam as number),
    initialPageParam: 1,
    getNextPageParam: (last) => last.page < last.total_pages ? last.page + 1 : undefined,
    enabled: !query && filter === 'movie' && !selectedGenre,
  })

  // ── TV 탭 무한 스크롤 (1페이지 = 글로벌+한국 혼합) ───────────
  const tvQuery = useInfiniteQuery({
    queryKey: ['popular-tv-inf'],
    queryFn: async ({ pageParam }) => {
      const page = pageParam as number
      if (page === 1) {
        const [popular, korean] = await Promise.all([
          getPopularTVPaged(1),
          getKoreanTVPaged(1),
        ])
        const mixed = [...popular.results, ...korean.results]
          .filter((item, idx, arr) => arr.findIndex(i => i.id === item.id) === idx)
          .slice(0, 20)
        return { ...popular, results: mixed }
      }
      return getPopularTVPaged(page)
    },
    initialPageParam: 1,
    getNextPageParam: (last) => last.page < last.total_pages ? last.page + 1 : undefined,
    enabled: !query && filter === 'tv' && !selectedGenre,
  })

  // ── 장르 필터 무한 스크롤 ─────────────────────────────────────
  const genreQuery = useInfiniteQuery({
    queryKey: ['discover-inf', filter, selectedGenre],
    queryFn: ({ pageParam }) =>
      discoverByGenrePaged(filter as 'movie' | 'tv', selectedGenre!, pageParam as number),
    initialPageParam: 1,
    getNextPageParam: (last) => last.page < last.total_pages ? last.page + 1 : undefined,
    enabled: !!selectedGenre && (filter === 'movie' || filter === 'tv') && !query,
  })

  // ── 장르 목록 ─────────────────────────────────────────────────
  const { data: genreData } = useQuery({
    queryKey: ['genres', filter],
    queryFn: () => (filter === 'movie' ? getMovieGenres() : getTVGenres()),
    enabled: (filter === 'movie' || filter === 'tv') && !query,
  })

  // ── 활성 무한 쿼리 결정 ───────────────────────────────────────
  const activeInfQuery = query
    ? searchQuery
    : selectedGenre
    ? genreQuery
    : filter === 'movie'
    ? moviesQuery
    : filter === 'tv'
    ? tvQuery
    : null

  // ── 결과 계산 ─────────────────────────────────────────────────
  const isAllTab = !query && !filter
  const infResults = activeInfQuery?.data?.pages.flatMap(p => p.results) ?? []
  const filteredInfResults = query ? infResults.filter(i => i.media_type !== 'person') : infResults

  const allTabResults = isAllTab
    ? [...(allMoviesData?.results ?? []), ...(allTVData?.results ?? [])].slice(0, 24)
    : []

  const results = isAllTab ? allTabResults : filteredInfResults

  // ── 로딩/페이징 상태 ──────────────────────────────────────────
  const isLoading = isAllTab
    ? allMoviesLoading || allTVLoading
    : (activeInfQuery?.isLoading ?? false)

  const isFetchingNextPage = activeInfQuery?.isFetchingNextPage ?? false
  const hasNextPage = activeInfQuery?.hasNextPage ?? false
  const fetchNextPage = activeInfQuery?.fetchNextPage

  // ── IntersectionObserver — 센티넬이 보이면 다음 페이지 로드 ──
  useEffect(() => {
    const el = sentinelRef.current
    if (!el || !fetchNextPage) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { rootMargin: '300px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  // ── 타이틀 ────────────────────────────────────────────────────
  const pageTitle = query
    ? `"${query}" 검색 결과`
    : filter === 'movie'
    ? '인기 영화'
    : filter === 'tv'
    ? '인기 드라마'
    : '탐색하기'

  const genres = genreData?.genres ?? []

  return (
    <div style={{ padding: '40px 80px' }}>
      <motion.h1
        className="text-xl font-bold mb-6"
        style={{ color: '#f1f1f1' }}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {pageTitle}
      </motion.h1>

      {/* 장르 칩 */}
      {(filter === 'movie' || filter === 'tv') && !query && genres.length > 0 && (
        <div
          className="flex gap-2 mb-8"
          style={{ overflowX: 'auto', paddingBottom: 8, scrollbarWidth: 'none' }}
        >
          <button
            onClick={() => setSelectedGenre(null)}
            className="shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors"
            style={
              selectedGenre === null
                ? { backgroundColor: '#d4a843', color: '#0f0f0f' }
                : { backgroundColor: '#1c1c1c', color: '#888', border: '1px solid #2a2a2a' }
            }
          >
            전체
          </button>
          {genres.map(genre => (
            <button
              key={genre.id}
              onClick={() => setSelectedGenre(selectedGenre === genre.id ? null : genre.id)}
              className="shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors"
              style={
                selectedGenre === genre.id
                  ? { backgroundColor: '#d4a843', color: '#0f0f0f' }
                  : { backgroundColor: '#1c1c1c', color: '#888', border: '1px solid #2a2a2a' }
              }
              onMouseEnter={e => {
                if (selectedGenre !== genre.id) e.currentTarget.style.borderColor = '#d4a843'
              }}
              onMouseLeave={e => {
                if (selectedGenre !== genre.id) e.currentTarget.style.borderColor = '#2a2a2a'
              }}
            >
              {genre.name}
            </button>
          ))}
        </div>
      )}

      {/* 초기 로딩 */}
      {isLoading && <Spinner size="lg" />}

      {/* 결과 없음 */}
      {!isLoading && results.length === 0 && (
        <div className="text-center py-24" style={{ color: '#555' }}>
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-sm">
            {query ? '검색 결과가 없습니다.' : '콘텐츠를 불러오는 중입니다.'}
          </p>
        </div>
      )}

      {/* 결과 그리드 */}
      {!isLoading && results.length > 0 && (
        <motion.div
          key={selectedGenre ?? filter ?? 'all'}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
          initial="hidden"
          animate="visible"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.04 } } }}
        >
          {results.map(item => {
            const mediaType: MediaType =
              item.media_type === 'tv' ? 'tv'
              : item.media_type === 'movie' ? 'movie'
              : filter === 'tv' ? 'tv'
              : 'movie'
            return (
              <motion.div
                key={`${mediaType}-${item.id}`}
                variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
              >
                <MediaCard item={item} mediaType={mediaType} />
              </motion.div>
            )
          })}
        </motion.div>
      )}

      {/* 다음 페이지 로딩 스피너 */}
      {isFetchingNextPage && (
        <div className="flex justify-center mt-8">
          <Spinner size="md" />
        </div>
      )}

      {/* 무한 스크롤 감지 센티넬 */}
      <div ref={sentinelRef} style={{ height: 1 }} />

      <div className="h-16" />
    </div>
  )
}
