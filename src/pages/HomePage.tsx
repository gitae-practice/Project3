import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { Info } from 'lucide-react'
import {
  getTrendingMovies,
  getTrendingTV,
  getKoreanTV,
  getImageUrl,
  type TmdbMedia,
  type TmdbListResponse,
} from '../api/tmdb'
import MediaCard from '../components/ui/MediaCard'
import Spinner from '../components/ui/Spinner'

// 카드 그리드 stagger 애니메이션
const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04 } },
}
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
}

// 공통 섹션 패딩 — 모든 섹션이 동일한 좌우 여백 사용
const SECTION_PADDING = '0 80px'

export default function HomePage() {
  const { data: movies, isLoading: moviesLoading } = useQuery({
    queryKey: ['trending-movies'],
    queryFn: getTrendingMovies,
  })

  const { data: tvShows, isLoading: tvLoading } = useQuery({
    queryKey: ['trending-tv'],
    queryFn: getTrendingTV,
  })

  // 한국 드라마 별도 fetch — 명시적 타입 지정으로 TypeScript 추론 오류 방지
  const { data: koreanTV, isLoading: koreanLoading } = useQuery<TmdbListResponse>({
    queryKey: ['korean-tv'],
    queryFn: () => getKoreanTV(),
  })

  const heroItem = movies?.results?.[0]

  return (
    <div>
      {heroItem && <HeroBanner item={heroItem} />}

      {/* ─── 트렌딩 영화 ─── */}
      <section style={{ padding: '40px 80px' }}>
        <SectionHeader title="트렌딩 영화" linkTo="/search?filter=movie" />
        {moviesLoading ? (
          <Spinner />
        ) : (
          <motion.div
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* TMDB 기본 응답은 20개 — 24개 채우려면 2페이지도 필요하지만 1페이지에서 20개 표시 */}
            {movies?.results.slice(0, 20).map(item => (
              <motion.div key={item.id} variants={cardVariants}>
                <MediaCard item={item} mediaType="movie" />
              </motion.div>
            ))}
          </motion.div>
        )}
      </section>

      {/* ─── 글로벌 트렌딩 드라마 ─── */}
      <section style={{ padding: SECTION_PADDING, paddingBottom: '40px' }}>
        <SectionHeader title="트렌딩 드라마" linkTo="/search?filter=tv" />
        {tvLoading ? (
          <Spinner />
        ) : (
          <motion.div
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {tvShows?.results.slice(0, 20).map(item => (
              <motion.div key={item.id} variants={cardVariants}>
                <MediaCard item={item} mediaType="tv" />
              </motion.div>
            ))}
          </motion.div>
        )}
      </section>

      {/* ─── 한국 드라마 ─── */}
      <section style={{ padding: SECTION_PADDING, paddingBottom: '60px' }}>
        <SectionHeader title="한국 드라마" linkTo="/search?filter=tv&lang=ko" />
        {koreanLoading ? (
          <Spinner />
        ) : (
          <motion.div
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {koreanTV?.results.slice(0, 20).map(item => (
              <motion.div key={item.id} variants={cardVariants}>
                <MediaCard item={item} mediaType="tv" />
              </motion.div>
            ))}
          </motion.div>
        )}
      </section>
    </div>
  )
}

// ─── 히어로 배너 ─────────────────────────────────────────────────
function HeroBanner({ item }: { item: TmdbMedia }) {
  const navigate = useNavigate()
  const backdropUrl = getImageUrl(item.backdrop_path, 'original')
  const posterUrl = getImageUrl(item.poster_path, 'w500')
  const title = item.title || item.name || ''
  const year = (item.release_date || item.first_air_date || '').slice(0, 4)
  const mediaType = item.media_type === 'tv' ? 'tv' : 'movie'

  return (
    <div className="relative w-full overflow-hidden" style={{ height: '68vh', minHeight: 420 }}>
      {/* 배경 이미지 — 블러 처리 */}
      {backdropUrl && (
        <img
          src={backdropUrl}
          alt={title}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: 'blur(6px) brightness(0.25)', transform: 'scale(1.06)' }}
        />
      )}

      {/* 오버레이 */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to bottom, rgba(15,15,15,0.2) 0%, rgba(15,15,15,0.5) 60%, rgba(15,15,15,1) 100%)',
        }}
      />

      {/* 2컬럼 콘텐츠 — 좌우 패딩을 카드 섹션과 동일하게 80px 고정 */}
      <div className="absolute inset-0 flex items-center" style={{ padding: '0 80px' }}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center w-full">

          {/* 왼쪽: 텍스트 */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <span
                className="text-xs px-2.5 py-1 rounded-full font-semibold"
                style={{ backgroundColor: '#d4a843', color: '#0f0f0f' }}
              >
                이번 주 인기
              </span>
              {year && <span className="text-xs" style={{ color: '#888' }}>{year}</span>}
              <span className="text-xs" style={{ color: '#d4a843' }}>
                ★ {item.vote_average.toFixed(1)}
              </span>
            </div>

            <h1
              className="text-4xl md:text-5xl font-bold leading-tight mb-4"
              style={{ color: '#f1f1f1' }}
            >
              {title}
            </h1>

            <p
              className="text-sm md:text-base leading-relaxed mb-8 line-clamp-3"
              style={{ color: '#aaa', maxWidth: '480px' }}
            >
              {item.overview || '줄거리 정보가 없습니다.'}
            </p>

            <button
              onClick={() => navigate(`/${mediaType}/${item.id}`)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-colors"
              style={{ backgroundColor: '#d4a843', color: '#0f0f0f' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#c49a35')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#d4a843')}
            >
              <Info size={16} /> 상세보기
            </button>
          </motion.div>

          {/* 오른쪽: 포스터 (md 이상에서만) */}
          <motion.div
            className="hidden md:flex justify-end"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            {posterUrl && (
              <img
                src={posterUrl}
                alt={title}
                className="rounded-2xl"
                style={{
                  height: '52vh',
                  maxHeight: 380,
                  objectFit: 'cover',
                  border: '1px solid rgba(255,255,255,0.08)',
                  boxShadow: '0 32px 64px rgba(0,0,0,0.6)',
                }}
              />
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}

// ─── 섹션 헤더 ───────────────────────────────────────────────────
function SectionHeader({ title, linkTo }: { title: string; linkTo: string }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-lg font-bold" style={{ color: '#f1f1f1' }}>
        {title}
      </h2>
      <Link
        to={linkTo}
        className="text-xs transition-colors"
        style={{ color: '#555' }}
        onMouseEnter={e => (e.currentTarget.style.color = '#d4a843')}
        onMouseLeave={e => (e.currentTarget.style.color = '#555')}
      >
        더보기 →
      </Link>
    </div>
  )
}
