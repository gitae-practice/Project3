import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { ArrowLeft, BookmarkPlus, BookmarkCheck } from 'lucide-react'
import {
  getMovieDetail,
  getTVDetail,
  getImageUrl,
  type TmdbMovieDetail,
  type TmdbTVDetail,
  type CastMember,
} from '../api/tmdb'
import { useAuth } from '../contexts/AuthContext'
import {
  useWatchlistItem,
  useUpsertWatchlist,
  useUpdateWatchlist,
  useRemoveWatchlist,
} from '../hooks/useWatchlist'
import StarRating from '../components/ui/StarRating'
import Spinner from '../components/ui/Spinner'
import type { MediaType, WatchStatus } from '../types'

// 시청 상태 선택지 목록
const STATUS_OPTIONS: { value: WatchStatus; label: string }[] = [
  { value: 'want', label: '보고싶어요' },
  { value: 'watching', label: '시청중' },
  { value: 'done', label: '시청완료' },
]

export default function DetailPage() {
  // URL에서 type(movie|tv)과 id 추출
  const { type, id } = useParams<{ type: string; id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const mediaType = type as MediaType
  const mediaId = Number(id)

  // 상세 정보 fetch — 명시적으로 반환 타입을 지정해야 TypeScript가 union을 올바르게 추론
  const { data, isLoading, isError } = useQuery<TmdbMovieDetail | TmdbTVDetail>({
    queryKey: ['detail', mediaType, mediaId],
    queryFn: (): Promise<TmdbMovieDetail | TmdbTVDetail> =>
      mediaType === 'movie' ? getMovieDetail(mediaId) : getTVDetail(mediaId),
    enabled: !!mediaId,
  })

  // 내 찜 목록에서 이 항목 상태 조회
  const { data: watchlistItem } = useWatchlistItem(user?.id, mediaId, mediaType)
  const upsert = useUpsertWatchlist()
  const update = useUpdateWatchlist()
  const remove = useRemoveWatchlist()

  // 상태 변경 드롭다운 열림 여부
  const [statusOpen, setStatusOpen] = useState(false)

  if (isLoading) return <div className="pt-24"><Spinner size="lg" /></div>
  if (isError || !data) {
    return (
      <div className="pt-24 text-center" style={{ color: '#666' }}>
        정보를 불러오지 못했습니다.
      </div>
    )
  }

  // 영화/드라마 공통 필드 추출 — 각 타입으로 캐스팅해서 접근
  const movieData = data as TmdbMovieDetail
  const tvData = data as TmdbTVDetail
  const title = movieData.title || tvData.name || ''
  const year = (movieData.release_date || tvData.first_air_date || '').slice(0, 4)
  const runtime = movieData.runtime || tvData.episode_run_time?.[0]
  // genres와 credits는 두 타입 모두 동일한 구조로 존재
  const genres = data.genres || []
  const cast: CastMember[] = data.credits?.cast?.slice(0, 8) || [] // 출연진 최대 8명
  const backdropUrl = getImageUrl(data.backdrop_path, 'original')
  const posterUrl = getImageUrl(data.poster_path, 'w500')

  // 찜하기 — 기존 항목 없으면 새로 추가
  const handleAddToWatchlist = (status: WatchStatus) => {
    if (!user) { navigate('/auth'); return }
    upsert.mutate({
      user_id: user.id,
      media_id: mediaId,
      media_type: mediaType,
      title,
      poster_path: data.poster_path ?? null,
      status,
      rating: null,
    })
    setStatusOpen(false)
  }

  // 상태 변경 (이미 목록에 있을 때)
  const handleStatusChange = (status: WatchStatus) => {
    if (!watchlistItem) return
    update.mutate({ id: watchlistItem.id, status })
    setStatusOpen(false)
  }

  // 별점 변경
  const handleRating = (rating: number) => {
    if (!watchlistItem) return
    update.mutate({ id: watchlistItem.id, rating })
  }

  // 목록에서 제거
  const handleRemove = () => {
    if (!watchlistItem || !user) return
    remove.mutate({ id: watchlistItem.id, userId: user.id })
  }

  return (
    <div style={{ backgroundColor: '#0f0f0f', minHeight: '100vh' }}>
      {/* ─── 배경 배너 ─── */}
      <div
        className="relative w-full overflow-hidden"
        style={{ height: '45vh', minHeight: 280 }}
      >
        {backdropUrl && (
          <img
            src={backdropUrl}
            alt={title}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ filter: 'brightness(0.35)' }}
          />
        )}
        {/* 아래로 페이드 — 콘텐츠 영역과 자연스럽게 연결 */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to bottom, transparent 40%, #0f0f0f 100%)',
          }}
        />
        {/* 뒤로가기 버튼 */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-6 left-6 flex items-center gap-2 text-sm transition-colors"
          style={{ color: '#aaa' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
          onMouseLeave={e => (e.currentTarget.style.color = '#aaa')}
        >
          <ArrowLeft size={18} /> 뒤로
        </button>
      </div>

      {/* ─── 상세 콘텐츠 ─── */}
      <motion.div
        className="-mt-24 relative z-10" style={{ padding: '0 80px' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col md:flex-row gap-8">
          {/* 포스터 */}
          <div className="shrink-0">
            {posterUrl ? (
              <img
                src={posterUrl}
                alt={title}
                className="w-48 md:w-56 rounded-xl shadow-2xl"
                style={{ border: '1px solid #2a2a2a' }}
              />
            ) : (
              <div
                className="w-48 md:w-56 rounded-xl flex items-center justify-center text-sm"
                style={{
                  aspectRatio: '2/3',
                  backgroundColor: '#1c1c1c',
                  color: '#444',
                  border: '1px solid #2a2a2a',
                }}
              >
                포스터 없음
              </div>
            )}
          </div>

          {/* 정보 영역 */}
          <div className="flex-1 space-y-4 pt-2">
            {/* 제목 */}
            <div>
              <h1 className="text-2xl md:text-3xl font-bold" style={{ color: '#f1f1f1' }}>
                {title}
              </h1>
              <div
                className="flex flex-wrap items-center gap-3 mt-2 text-sm"
                style={{ color: '#888' }}
              >
                {year && <span>{year}</span>}
                {runtime && <span>{runtime}분</span>}
                <span style={{ color: '#d4a843' }}>★ {data.vote_average.toFixed(1)}</span>
                <span
                  className="text-xs px-2 py-0.5 rounded"
                  style={{ backgroundColor: '#2a2a2a', color: '#888' }}
                >
                  {mediaType === 'movie' ? '영화' : 'TV'}
                </span>
              </div>
            </div>

            {/* 장르 태그 */}
            {genres.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {genres.map(g => (
                  <span
                    key={g.id}
                    className="text-xs px-3 py-1 rounded-full"
                    style={{
                      backgroundColor: '#1c1c1c',
                      color: '#aaa',
                      border: '1px solid #2a2a2a',
                    }}
                  >
                    {g.name}
                  </span>
                ))}
              </div>
            )}

            {/* ─── 찜하기 / 상태 변경 영역 ─── */}
            <div className="flex flex-wrap items-center gap-3">
              {watchlistItem ? (
                <>
                  {/* 현재 상태 표시 + 변경 드롭다운 */}
                  <div className="relative">
                    <button
                      onClick={() => setStatusOpen(prev => !prev)}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                      style={{ backgroundColor: '#d4a843', color: '#0f0f0f' }}
                    >
                      <BookmarkCheck size={16} />
                      {STATUS_OPTIONS.find(s => s.value === watchlistItem.status)?.label}
                      ▾
                    </button>

                    {/* 상태 선택 드롭다운 */}
                    <AnimatePresence>
                      {statusOpen && (
                        <motion.div
                          className="absolute top-full left-0 mt-1 rounded-xl overflow-hidden z-20 w-36"
                          style={{ backgroundColor: '#252525', border: '1px solid #333' }}
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                        >
                          {STATUS_OPTIONS.map(opt => (
                            <button
                              key={opt.value}
                              onClick={() => handleStatusChange(opt.value)}
                              className="w-full text-left px-4 py-2 text-sm transition-colors"
                              style={{ color: watchlistItem.status === opt.value ? '#d4a843' : '#aaa' }}
                              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#333')}
                              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* 목록에서 제거 버튼 */}
                  <button
                    onClick={handleRemove}
                    className="text-xs px-3 py-2 rounded-xl transition-colors"
                    style={{ color: '#888', border: '1px solid #2a2a2a' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#888')}
                  >
                    목록에서 제거
                  </button>
                </>
              ) : (
                /* 찜하기 드롭다운 */
                <div className="relative">
                  <button
                    onClick={() => setStatusOpen(prev => !prev)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                    style={{ backgroundColor: '#1c1c1c', color: '#f1f1f1', border: '1px solid #2a2a2a' }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = '#d4a843')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = '#2a2a2a')}
                  >
                    <BookmarkPlus size={16} /> 내 목록에 추가 ▾
                  </button>

                  <AnimatePresence>
                    {statusOpen && (
                      <motion.div
                        className="absolute top-full left-0 mt-1 rounded-xl overflow-hidden z-20 w-36"
                        style={{ backgroundColor: '#252525', border: '1px solid #333' }}
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                      >
                        {STATUS_OPTIONS.map(opt => (
                          <button
                            key={opt.value}
                            onClick={() => handleAddToWatchlist(opt.value)}
                            className="w-full text-left px-4 py-2 text-sm transition-colors"
                            style={{ color: '#aaa' }}
                            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#333')}
                            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* 별점 — 목록에 있고 시청완료인 경우만 활성화 */}
              {watchlistItem && (
                <div className="flex items-center gap-2">
                  <StarRating
                    value={watchlistItem.rating}
                    onChange={handleRating}
                    readOnly={watchlistItem.status !== 'done'}
                    size="md"
                  />
                  {watchlistItem.status !== 'done' && (
                    <span className="text-xs" style={{ color: '#555' }}>
                      (시청완료 후 별점 가능)
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* 줄거리 */}
            {data.overview && (
              <div>
                <h3 className="text-sm font-semibold mb-2" style={{ color: '#888' }}>
                  줄거리
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: '#bbb' }}>
                  {data.overview}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ─── 출연진 ─── */}
        {cast.length > 0 && (
          <div className="mt-12 mb-16">
            <h2 className="text-base font-bold mb-4" style={{ color: '#f1f1f1' }}>
              출연진
            </h2>
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
              {cast.map(member => {
                const profileUrl = getImageUrl(member.profile_path, 'w185')
                return (
                  <div key={member.id} className="text-center">
                    {/* 배우 프로필 이미지 */}
                    <div
                      className="w-full rounded-xl overflow-hidden mb-1.5"
                      style={{ aspectRatio: '1/1' }}
                    >
                      {profileUrl ? (
                        <img
                          src={profileUrl}
                          alt={member.name}
                          className="w-full h-full object-cover object-top"
                        />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center text-lg"
                          style={{ backgroundColor: '#1c1c1c', color: '#444' }}
                        >
                          👤
                        </div>
                      )}
                    </div>
                    <p className="text-[11px] font-medium truncate" style={{ color: '#ccc' }}>
                      {member.name}
                    </p>
                    <p className="text-[10px] truncate" style={{ color: '#555' }}>
                      {member.character}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}
