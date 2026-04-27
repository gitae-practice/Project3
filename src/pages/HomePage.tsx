import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { Info } from 'lucide-react'
import {
  getTrendingMovies,
  getTrendingTV,
  getImageUrl,
  type TmdbMedia,
} from '../api/tmdb'
import MediaCard from '../components/ui/MediaCard'
import Spinner from '../components/ui/Spinner'

// 카드 그리드 stagger 애니메이션 — 카드들이 순서대로 나타남
const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
}
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

export default function HomePage() {
  // 트렌딩 영화 주간 순위 fetch
  const { data: movies, isLoading: moviesLoading } = useQuery({
    queryKey: ['trending-movies'],
    queryFn: getTrendingMovies,
  })

  // 트렌딩 드라마 주간 순위 fetch
  const { data: tvShows, isLoading: tvLoading } = useQuery({
    queryKey: ['trending-tv'],
    queryFn: getTrendingTV,
  })

  // 히어로 섹션에 표시할 콘텐츠 — 트렌딩 1위 영화
  const heroItem = movies?.results?.[0]

  return (
    <div>
      {/* ─── 히어로 배너 ─── */}
      {heroItem && <HeroBanner item={heroItem} />}

      {/* ─── 트렌딩 영화 섹션 ─── */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <SectionHeader title="트렌딩 영화" linkTo="/search?filter=movie" />
        {moviesLoading ? (
          <Spinner />
        ) : (
          <motion.div
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* 상위 10개만 표시 */}
            {movies?.results.slice(0, 10).map(item => (
              <motion.div key={item.id} variants={cardVariants}>
                <MediaCard item={item} mediaType="movie" />
              </motion.div>
            ))}
          </motion.div>
        )}
      </section>

      {/* ─── 트렌딩 드라마 섹션 ─── */}
      <section className="max-w-7xl mx-auto px-6 py-12 pt-0">
        <SectionHeader title="트렌딩 드라마" linkTo="/search?filter=tv" />
        {tvLoading ? (
          <Spinner />
        ) : (
          <motion.div
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {tvShows?.results.slice(0, 10).map(item => (
              <motion.div key={item.id} variants={cardVariants}>
                <MediaCard item={item} mediaType="tv" />
              </motion.div>
            ))}
          </motion.div>
        )}
      </section>

      {/* 하단 여백 */}
      <div className="h-16" />
    </div>
  )
}

// ─── 히어로 배너 컴포넌트 ───────────────────────────────────────
function HeroBanner({ item }: { item: TmdbMedia }) {
  const navigate = useNavigate()
  const backdropUrl = getImageUrl(item.backdrop_path, 'original')
  const title = item.title || item.name || ''
  const year = (item.release_date || item.first_air_date || '').slice(0, 4)
  const mediaType = item.media_type === 'tv' ? 'tv' : 'movie'

  return (
    <div className="relative w-full overflow-hidden" style={{ height: '70vh', minHeight: 400 }}>
      {/* 배경 이미지 */}
      {backdropUrl && (
        <img
          src={backdropUrl}
          alt={title}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: 'brightness(0.55)' }}
        />
      )}

      {/* 좌측 → 우측 그라디언트 + 하단 페이드 */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to right, rgba(15,15,15,0.95) 0%, rgba(15,15,15,0.3) 60%, transparent 100%), ' +
            'linear-gradient(to top, rgba(15,15,15,1) 0%, transparent 40%)',
        }}
      />

      {/* 텍스트 콘텐츠 */}
      <motion.div
        className="absolute bottom-0 left-0 px-6 md:px-12 pb-16 max-w-xl"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        {/* 배지 */}
        <div className="flex items-center gap-2 mb-3">
          <span
            className="text-xs px-2 py-0.5 rounded font-medium"
            style={{ backgroundColor: '#d4a843', color: '#0f0f0f' }}
          >
            이번 주 인기
          </span>
          {year && (
            <span className="text-xs" style={{ color: '#888' }}>
              {year}
            </span>
          )}
          <span className="text-xs" style={{ color: '#d4a843' }}>
            ★ {item.vote_average.toFixed(1)}
          </span>
        </div>

        {/* 제목 */}
        <h1
          className="text-3xl md:text-5xl font-bold leading-tight mb-3"
          style={{ color: '#f1f1f1' }}
        >
          {title}
        </h1>

        {/* 줄거리 — 최대 3줄 */}
        <p
          className="text-sm md:text-base leading-relaxed mb-6 line-clamp-3"
          style={{ color: '#aaa' }}
        >
          {item.overview || '줄거리 정보가 없습니다.'}
        </p>

        {/* 버튼 */}
        <div className="flex gap-3">
          <button
            onClick={() => navigate(`/${mediaType}/${item.id}`)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
            style={{ backgroundColor: '#d4a843', color: '#0f0f0f' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#c49a35')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#d4a843')}
          >
            <Info size={16} /> 상세보기
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ─── 섹션 헤더 — 제목 + 더보기 링크 ─────────────────────────────
function SectionHeader({ title, linkTo }: { title: string; linkTo: string }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <h2 className="text-lg font-bold" style={{ color: '#f1f1f1' }}>
        {title}
      </h2>
      <Link
        to={linkTo}
        className="text-xs transition-colors"
        style={{ color: '#666' }}
        onMouseEnter={e => (e.currentTarget.style.color = '#d4a843')}
        onMouseLeave={e => (e.currentTarget.style.color = '#666')}
      >
        더보기 →
      </Link>
    </div>
  )
}
