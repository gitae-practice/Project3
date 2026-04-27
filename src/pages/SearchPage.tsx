import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  searchMulti,
  getPopularMovies,
  getPopularTV,
} from '../api/tmdb'
import MediaCard from '../components/ui/MediaCard'
import Spinner from '../components/ui/Spinner'
import type { MediaType } from '../types'

export default function SearchPage() {
  // URL 파라미터 읽기 — ?q=검색어 또는 ?filter=movie|tv
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q') || ''
  const filter = searchParams.get('filter') as MediaType | null

  // 검색 결과 fetch — query가 있을 때만 실행
  const { data: searchData, isLoading: searchLoading } = useQuery({
    queryKey: ['search', query],
    queryFn: () => searchMulti(query),
    enabled: !!query, // 검색어 없으면 비활성화
  })

  // 영화 목록 fetch — filter=movie 이거나 기본 탐색용
  const { data: moviesData, isLoading: moviesLoading } = useQuery({
    queryKey: ['popular-movies'],
    queryFn: () => getPopularMovies(),
    enabled: !query && filter !== 'tv', // 검색어 없을 때만
  })

  // 드라마 목록 fetch
  const { data: tvData, isLoading: tvLoading } = useQuery({
    queryKey: ['popular-tv'],
    queryFn: () => getPopularTV(),
    enabled: !query && filter !== 'movie',
  })

  // 표시할 데이터 결정
  const isLoading = searchLoading || moviesLoading || tvLoading

  // 검색 결과에서 person(인물) 제외 — 영화/드라마만 표시
  const searchResults = searchData?.results.filter(
    item => item.media_type !== 'person',
  ) || []

  // 필터에 따라 적절한 데이터 선택
  const browseResults =
    filter === 'tv'
      ? tvData?.results || []
      : filter === 'movie'
      ? moviesData?.results || []
      : [...(moviesData?.results || []), ...(tvData?.results || [])]

  const results = query ? searchResults : browseResults

  // 페이지 제목 결정
  const pageTitle = query
    ? `"${query}" 검색 결과 ${results.length}개`
    : filter === 'movie'
    ? '인기 영화'
    : filter === 'tv'
    ? '인기 드라마'
    : '탐색하기'

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      {/* 페이지 제목 */}
      <motion.h1
        className="text-xl font-bold mb-8"
        style={{ color: '#f1f1f1' }}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {pageTitle}
      </motion.h1>

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
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
          initial="hidden"
          animate="visible"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.04 } } }}
        >
          {results.map(item => {
            // 검색 결과는 media_type 포함, 필터 탐색은 filter 값 사용
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
