import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Trash2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useWatchlist, useRemoveWatchlist, useUpdateWatchlist } from '../hooks/useWatchlist'
import { getImageUrl } from '../api/tmdb'
import StarRating from '../components/ui/StarRating'
import Spinner from '../components/ui/Spinner'
import type { WatchStatus } from '../types'

// 탭 목록 — '전체' + 각 상태
const TABS: { value: WatchStatus | 'all'; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'want', label: '보고싶어요' },
  { value: 'watching', label: '시청중' },
  { value: 'done', label: '시청완료' },
]

export default function WatchlistPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<WatchStatus | 'all'>('all')

  const { data: items = [], isLoading } = useWatchlist(user?.id)
  const remove = useRemoveWatchlist()
  const update = useUpdateWatchlist()

  // 비로그인 시 안내 화면
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-3xl">🔒</p>
        <p className="text-sm" style={{ color: '#666' }}>
          로그인이 필요한 페이지입니다.
        </p>
        <button
          onClick={() => navigate('/auth')}
          className="text-sm px-4 py-2 rounded-xl font-medium"
          style={{ backgroundColor: '#d4a843', color: '#0f0f0f' }}
        >
          로그인하기
        </button>
      </div>
    )
  }

  // 탭에 따라 목록 필터링
  const filtered =
    activeTab === 'all' ? items : items.filter(i => i.status === activeTab)

  return (
    <div style={{ padding: '40px 80px' }}>
      {/* 페이지 제목 */}
      <div className="mb-8">
        <h1 className="text-xl font-bold" style={{ color: '#f1f1f1' }}>
          내 목록
        </h1>
        <p className="text-sm mt-1" style={{ color: '#555' }}>
          총 {items.length}개
        </p>
      </div>

      {/* 상태 탭 */}
      <div className="flex gap-1 mb-8 p-1 rounded-xl w-fit" style={{ backgroundColor: '#1c1c1c' }}>
        {TABS.map(tab => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
            style={
              activeTab === tab.value
                ? { backgroundColor: '#d4a843', color: '#0f0f0f' }
                : { color: '#888' }
            }
            onMouseEnter={e => {
              if (activeTab !== tab.value) e.currentTarget.style.color = '#ccc'
            }}
            onMouseLeave={e => {
              if (activeTab !== tab.value) e.currentTarget.style.color = '#888'
            }}
          >
            {tab.label}
            {/* 각 탭의 아이템 수 표시 */}
            <span
              className="ml-1.5 text-xs"
              style={{ color: activeTab === tab.value ? '#0f0f0f88' : '#444' }}
            >
              {tab.value === 'all'
                ? items.length
                : items.filter(i => i.status === tab.value).length}
            </span>
          </button>
        ))}
      </div>

      {/* 로딩 */}
      {isLoading && <Spinner />}

      {/* 목록 없음 */}
      {!isLoading && filtered.length === 0 && (
        <div className="text-center py-24" style={{ color: '#444' }}>
          <p className="text-4xl mb-3">📭</p>
          <p className="text-sm">
            {activeTab === 'all' ? '아직 추가된 항목이 없습니다.' : '해당 상태의 항목이 없습니다.'}
          </p>
        </div>
      )}

      {/* 아이템 목록 */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
        initial="hidden"
        animate="visible"
        variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.05 } } }}
      >
        {filtered.map(item => {
          const posterUrl = getImageUrl(item.poster_path, 'w342')

          return (
            <motion.div
              key={item.id}
              className="rounded-xl overflow-hidden flex gap-3 p-3"
              style={{ backgroundColor: '#1c1c1c', border: '1px solid #2a2a2a' }}
              variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
            >
              {/* 썸네일 — 클릭 시 상세 페이지 이동 */}
              <div
                className="shrink-0 rounded-lg overflow-hidden cursor-pointer"
                style={{ width: 64, aspectRatio: '2/3' }}
                onClick={() => navigate(`/${item.media_type}/${item.media_id}`)}
              >
                {posterUrl ? (
                  <img
                    src={posterUrl}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center text-xs"
                    style={{ backgroundColor: '#252525', color: '#444' }}
                  >
                    —
                  </div>
                )}
              </div>

              {/* 정보 영역 */}
              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div>
                  {/* 제목 */}
                  <p
                    className="text-sm font-semibold leading-snug line-clamp-2 cursor-pointer mb-1"
                    style={{ color: '#f1f1f1' }}
                    onClick={() => navigate(`/${item.media_type}/${item.media_id}`)}
                  >
                    {item.title}
                  </p>

                  {/* 타입 배지 */}
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded"
                    style={{ backgroundColor: '#2a2a2a', color: '#666' }}
                  >
                    {item.media_type === 'movie' ? '영화' : 'TV'}
                  </span>
                </div>

                {/* 상태 변경 셀렉트 */}
                <div className="space-y-1.5 mt-2">
                  <select
                    value={item.status}
                    onChange={e =>
                      update.mutate({ id: item.id, status: e.target.value as WatchStatus })
                    }
                    className="text-xs px-2 py-1 rounded-lg w-full outline-none"
                    style={{
                      backgroundColor: '#252525',
                      color: '#aaa',
                      border: '1px solid #333',
                    }}
                  >
                    <option value="want">보고싶어요</option>
                    <option value="watching">시청중</option>
                    <option value="done">시청완료</option>
                  </select>

                  {/* 별점 — 시청완료 상태일 때만 활성화 */}
                  <StarRating
                    value={item.rating}
                    onChange={rating => update.mutate({ id: item.id, rating })}
                    readOnly={item.status !== 'done'}
                    size="sm"
                  />
                </div>
              </div>

              {/* 삭제 버튼 */}
              <button
                onClick={() => remove.mutate({ id: item.id, userId: item.user_id })}
                className="self-start p-1 rounded-lg transition-colors shrink-0"
                style={{ color: '#444' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
                onMouseLeave={e => (e.currentTarget.style.color = '#444')}
              >
                <Trash2 size={15} />
              </button>
            </motion.div>
          )
        })}
      </motion.div>

      <div className="h-16" />
    </div>
  )
}
