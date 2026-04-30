import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  searchMulti,
  getPopularMovies,
  getPopularTV,
  getKoreanTV,
  getMovieGenres,
  getTVGenres,
  discoverByGenre,
  type TmdbListResponse,
} from '../api/tmdb'
import MediaCard from '../components/ui/MediaCard'
import Spinner from '../components/ui/Spinner'
import type { MediaType } from '../types'

export default function SearchPage() {
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q') || ''
  const filter = searchParams.get('filter') as MediaType | null

  // 선택된 장르 ID — null이면 전체
  const [selectedGenre, setSelectedGenre] = useState<number | null>(null)

  // 탭(filter) 바뀌면 장르 선택 초기화
  useEffect(() => {
    setSelectedGenre(null)
  }, [filter])

  // 검색
  const { data: searchData, isLoading: searchLoading } = useQuery({
    queryKey: ['search', query],
    queryFn: () => searchMulti(query),
    enabled: !!query,
  })

  // 인기 영화
  const { data: moviesData, isLoading: moviesLoading } = useQuery<TmdbListResponse>({
    queryKey: ['popular-movies'],
    queryFn: () => getPopularMovies(),
    enabled: !query && filter !== 'tv' && !selectedGenre,
  })

  // 인기 드라마 (글로벌)
  const { data: tvData, isLoading: tvLoading } = useQuery<TmdbListResponse>({
    queryKey: ['popular-tv'],
    queryFn: () => getPopularTV(),
    enabled: !query && filter !== 'movie' && !selectedGenre,
  })

  // 한국 드라마 — TV 탭 전체보기일 때만 혼합
  const { data: koreanData, isLoading: koreanLoading } = useQuery<TmdbListResponse>({
    queryKey: ['korean-tv'],
    queryFn: () => getKoreanTV(),
    enabled: !query && filter === 'tv' && !selectedGenre,
  })

  // 장르 목록 — 영화/TV 탭에서만 fetch
  const { data: genreData } = useQuery({
    queryKey: ['genres', filter],
    queryFn: () => (filter === 'movie' ? getMovieGenres() : getTVGenres()),
    enabled: (filter === 'movie' || filter === 'tv') && !query,
  })

  // 장르 선택 시 discover API로 필터링된 결과
  const { data: genreFilteredData, isLoading: genreLoading } = useQuery<TmdbListResponse>({
    queryKey: ['discover', filter, selectedGenre],
    queryFn: () => discoverByGenre(filter as 'movie' | 'tv', selectedGenre!),
    enabled: !!selectedGenre && (filter === 'movie' || filter === 'tv') && !query,
  })

  // TV 탭 전체보기: 글로벌 + 한국 드라마 혼합, 중복 제거
  const mixedTV = [...(tvData?.results || []), ...(koreanData?.results || [])]
    .filter((item, idx, arr) => arr.findIndex(i => i.id === item.id) === idx)
    .slice(0, 24)

  // 표시할 결과 결정
  const browseResults = selectedGenre
    ? genreFilteredData?.results || []
    : filter === 'tv'
    ? mixedTV
    : filter === 'movie'
    ? moviesData?.results || []
    : [...(moviesData?.results || []), ...(tvData?.results || [])]

  const searchResults = searchData?.results.filter(i => i.media_type !== 'person') || []
  const results = query ? searchResults : browseResults

  const isLoading = query
    ? searchLoading
    : selectedGenre
    ? genreLoading
    : moviesLoading || tvLoading || koreanLoading

  const pageTitle = query
    ? `"${query}" 검색 결과 ${results.length}개`
    : filter === 'movie'
    ? '인기 영화'
    : filter === 'tv'
    ? '인기 드라마'
    : '탐색하기'

  const genres = genreData?.genres || []

  return (
    <div style={{ padding: '40px 80px' }}>
      {/* 페이지 제목 */}
      <motion.h1
        className="text-xl font-bold mb-6"
        style={{ color: '#f1f1f1' }}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {pageTitle}
      </motion.h1>

      {/* 장르 칩 — 영화/TV 탭에서 검색 중이 아닐 때만 표시 */}
      {(filter === 'movie' || filter === 'tv') && !query && genres.length > 0 && (
        <div
          className="flex gap-2 mb-8"
          style={{ overflowX: 'auto', paddingBottom: 8, scrollbarWidth: 'none' }}
        >
          {/* 전체 칩 */}
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
                if (selectedGenre !== genre.id)
                  e.currentTarget.style.borderColor = '#d4a843'
              }}
              onMouseLeave={e => {
                if (selectedGenre !== genre.id)
                  e.currentTarget.style.borderColor = '#2a2a2a'
              }}
            >
              {genre.name}
            </button>
          ))}
        </div>
      )}

      {/* 로딩 */}
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
          key={selectedGenre ?? 'all'}
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

      <div className="h-16" />
    </div>
  )
}
