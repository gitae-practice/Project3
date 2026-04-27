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
  visible: { transition: { staggerChildren: 0.05 } },
}
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
}

export default function HomePage() {
  const { data: movies, isLoading: moviesLoading } = useQuery({
    queryKey: ['trending-movies'],
    queryFn: getTrendingMovies,
  })

  const { data: tvShows, isLoading: tvLoading } = useQuery({
    queryKey: ['trending-tv'],
    queryFn: getTrendingTV,
  })

  const heroItem = movies?.results?.[0]

  return (
    <div>
      {heroItem && <HeroBanner item={heroItem} />}

      {/* ─── 트렌딩 영화 ─── */}
      <section className="px-16 md:px-24 py-10">
        <SectionHeader title="트렌딩 영화" linkTo="/search?filter=movie" />
        {moviesLoading ? (
          <Spinner />
        ) : (
          <motion.div
            // xl(1280px+)에서 6열, lg에서 5열, md에서 4열로 화면을 꽉 채움
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {movies?.results.slice(0, 12).map(item => (
              <motion.div key={item.id} variants={cardVariants}>
                <MediaCard item={item} mediaType="movie" />
              </motion.div>
            ))}
          </motion.div>
        )}
      </section>

      {/* ─── 트렌딩 드라마 ─── */}
      <section className="px-16 md:px-24 py-4 pb-10">
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
            {tvShows?.results.slice(0, 12).map(item => (
              <motion.div key={item.id} variants={cardVariants}>
                <MediaCard item={item} mediaType="tv" />
              </motion.div>
            ))}
          </motion.div>
        )}
      </section>

      <div className="h-16" />
    </div>
  )
}

// ─── 히어로 배너 — 좌(텍스트) + 우(포스터) 2컬럼으로 좌우 균형 맞춤 ──
function HeroBanner({ item }: { item: TmdbMedia }) {
  const navigate = useNavigate()
  const backdropUrl = getImageUrl(item.backdrop_path, 'original')
  // 포스터를 우측에 띄워서 시각적 균형 확보
  const posterUrl = getImageUrl(item.poster_path, 'w500')
  const title = item.title || item.name || ''
  const year = (item.release_date || item.first_air_date || '').slice(0, 4)
  const mediaType = item.media_type === 'tv' ? 'tv' : 'movie'

  return (
    <div className="relative w-full overflow-hidden" style={{ height: '68vh', minHeight: 420 }}>
      {/* 배경 이미지 — 블러 처리해서 포스터와 겹쳐도 자연스럽게 */}
      {backdropUrl && (
        <img
          src={backdropUrl}
          alt={title}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: 'blur(6px) brightness(0.25)', transform: 'scale(1.06)' }}
        />
      )}

      {/* 전체 오버레이 + 하단 페이드 */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to bottom, rgba(15,15,15,0.2) 0%, rgba(15,15,15,0.5) 60%, rgba(15,15,15,1) 100%)',
        }}
      />

      {/* 2컬럼 콘텐츠 — 좌: 텍스트, 우: 포스터 */}
      <div className="absolute inset-0 flex items-center">
        <div className="w-full px-16 md:px-24">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center max-w-6xl mx-auto">

            {/* 왼쪽: 텍스트 영역 */}
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              {/* 배지 */}
              <div className="flex items-center gap-2 mb-4">
                <span
                  className="text-xs px-2.5 py-1 rounded-full font-semibold"
                  style={{ backgroundColor: '#d4a843', color: '#0f0f0f' }}
                >
                  이번 주 인기
                </span>
                {year && (
                  <span className="text-xs" style={{ color: '#888' }}>{year}</span>
                )}
                <span className="text-xs" style={{ color: '#d4a843' }}>
                  ★ {item.vote_average.toFixed(1)}
                </span>
              </div>

              {/* 제목 */}
              <h1
                className="text-4xl md:text-5xl font-bold leading-tight mb-4"
                style={{ color: '#f1f1f1' }}
              >
                {title}
              </h1>

              {/* 줄거리 */}
              <p
                className="text-sm md:text-base leading-relaxed mb-8 line-clamp-3"
                style={{ color: '#aaa', maxWidth: '480px' }}
              >
                {item.overview || '줄거리 정보가 없습니다.'}
              </p>

              {/* 버튼 */}
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

            {/* 오른쪽: 포스터 이미지 (md 이상에서만 노출) */}
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
                  className="rounded-2xl shadow-2xl"
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
