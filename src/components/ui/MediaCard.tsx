import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Check, Plus } from 'lucide-react'
import { getImageUrl, type TmdbMedia } from '../../api/tmdb'
import { useAuth } from '../../contexts/AuthContext'
import { useWatchlistItem, useUpsertWatchlist } from '../../hooks/useWatchlist'
import type { MediaType, WatchStatus } from '../../types'

interface MediaCardProps {
  item: TmdbMedia
  mediaType: MediaType  // 'movie' | 'tv'
}

// 시청 상태를 한국어 라벨 + 색상으로 매핑
const STATUS_MAP: Record<WatchStatus, { label: string; color: string }> = {
  want: { label: '보고싶어요', color: '#d4a843' },
  watching: { label: '시청중', color: '#60a5fa' },
  done: { label: '완료', color: '#4ade80' },
}

export default function MediaCard({ item, mediaType }: MediaCardProps) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const upsert = useUpsertWatchlist()

  // 이 카드가 내 찜 목록에 있는지 확인 — 로그인한 경우에만 fetch
  const { data: watchlistItem } = useWatchlistItem(user?.id, item.id, mediaType)

  // 영화는 title, 드라마는 name 사용
  const title = item.title || item.name || ''
  // 개봉연도 추출 (날짜 문자열에서 앞 4자리)
  const year = (item.release_date || item.first_air_date || '').slice(0, 4)
  // TMDB 평점은 10점 만점 → 소수점 1자리
  const rating = item.vote_average.toFixed(1)
  const posterUrl = getImageUrl(item.poster_path, 'w342')

  // 카드 클릭 → 상세 페이지로 이동
  const handleCardClick = () => navigate(`/${mediaType}/${item.id}`)

  // 찜하기 버튼 클릭 — 비로그인 시 로그인 페이지로, 로그인 시 보고싶어요 추가
  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation() // 카드 클릭 이벤트와 겹치지 않도록
    if (!user) { navigate('/auth'); return }
    if (watchlistItem) return // 이미 있으면 무시 (상세 페이지에서 변경 가능)
    upsert.mutate({
      user_id: user.id,
      media_id: item.id,
      media_type: mediaType,
      title,
      poster_path: item.poster_path,
      status: 'want' as WatchStatus,
      rating: null,
    })
  }

  const statusInfo = watchlistItem ? STATUS_MAP[watchlistItem.status] : null

  return (
    // whileHover로 카드 전체에 hover 상태를 전파 — 자식 variants에서 감지
    // overflow-hidden은 이미지 영역에만 적용 — 하단 텍스트가 radius에 잘리지 않도록
    <motion.div
      className="relative rounded-xl cursor-pointer group"
      whileHover="hover"
      initial="rest"
      animate="rest"
      onClick={handleCardClick}
      style={{ backgroundColor: '#1c1c1c' }}
    >
      {/* 포스터 이미지 — 2:3 비율 고정, overflow-hidden을 여기에만 적용 */}
      <div className="relative rounded-xl overflow-hidden" style={{ aspectRatio: '2/3' }}>
        {posterUrl ? (
          <motion.img
            src={posterUrl}
            alt={title}
            className="w-full h-full object-cover"
            // hover 시 살짝 확대 — 자연스러운 줌인 효과
            variants={{ rest: { scale: 1 }, hover: { scale: 1.05 } }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            loading="lazy"
          />
        ) : (
          // 포스터 없을 때 대체 화면
          <div
            className="w-full h-full flex items-center justify-center text-[#444] text-sm"
            style={{ backgroundColor: '#1a1a1a' }}
          >
            포스터 없음
          </div>
        )}

        {/* 시청 상태 배지 — 찜 목록에 있을 때만 표시 */}
        {statusInfo && (
          <div
            className="absolute top-2 left-2 text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ backgroundColor: statusInfo.color + '22', color: statusInfo.color, border: `1px solid ${statusInfo.color}55` }}
          >
            {statusInfo.label}
          </div>
        )}

        {/* 호버 오버레이 — 아래에서 위로 슬라이드업 */}
        <motion.div
          className="absolute inset-0 flex flex-col justify-end"
          style={{
            background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)',
          }}
          variants={{ rest: { opacity: 0 }, hover: { opacity: 1 } }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="p-3 space-y-2"
            variants={{ rest: { y: 12, opacity: 0 }, hover: { y: 0, opacity: 1 } }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            {/* 제목 */}
            <p className="text-white text-sm font-semibold leading-snug line-clamp-2">
              {title}
            </p>

            {/* 개봉연도 + 평점 */}
            <div className="flex items-center gap-2 text-xs" style={{ color: '#aaa' }}>
              {year && <span>{year}</span>}
              <span style={{ color: '#d4a843' }}>★ {rating}</span>
              <span
                className="uppercase text-[10px] px-1.5 py-0.5 rounded"
                style={{ backgroundColor: '#2a2a2a', color: '#888' }}
              >
                {mediaType === 'movie' ? '영화' : 'TV'}
              </span>
            </div>

            {/* 찜하기 버튼 */}
            <button
              onClick={handleBookmark}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg w-full justify-center font-medium transition-colors"
              style={
                watchlistItem
                  ? { backgroundColor: '#2a2a2a', color: '#888' }
                  : { backgroundColor: '#d4a843', color: '#0f0f0f' }
              }
            >
              {watchlistItem ? (
                <><Check size={13} /> 목록에 있음</>
              ) : (
                <><Plus size={13} /> 찜하기</>
              )}
            </button>
          </motion.div>
        </motion.div>
      </div>

      {/* 카드 하단 제목 — 평상시에도 보이는 영역 */}
      <div className="px-2.5 py-2">
        <p className="text-xs font-medium truncate" style={{ color: '#bbb' }}>
          {title}
        </p>
        <p className="text-[11px] mt-0.5" style={{ color: '#555' }}>
          {year}
        </p>
      </div>
    </motion.div>
  )
}
