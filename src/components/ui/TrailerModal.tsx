import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

interface TrailerModalProps {
  videoKey: string
  onClose: () => void
}

export default function TrailerModal({ videoKey, onClose }: TrailerModalProps) {
  // ESC 키로 닫기
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  // 모달 열린 동안 body 스크롤 잠금
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return createPortal(
    <AnimatePresence>
      {/* 어두운 배경 오버레이 — 클릭하면 닫힘 */}
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{ backgroundColor: 'rgba(0,0,0,0.88)', padding: '0 24px' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        {/* 영상 컨테이너 — 클릭 이벤트 버블링 차단 */}
        <motion.div
          className="relative w-full"
          style={{ maxWidth: 960 }}
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.92, opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          onClick={e => e.stopPropagation()}
        >
          {/* 닫기 버튼 */}
          <button
            onClick={onClose}
            className="absolute flex items-center gap-1.5 text-xs transition-colors"
            style={{ color: '#aaa', top: -36, right: 0 }}
            onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
            onMouseLeave={e => (e.currentTarget.style.color = '#aaa')}
          >
            <X size={16} /> 닫기
          </button>

          {/* 16:9 비율 YouTube iframe */}
          <div
            className="w-full rounded-2xl overflow-hidden"
            style={{ aspectRatio: '16/9', boxShadow: '0 40px 80px rgba(0,0,0,0.7)' }}
          >
            <iframe
              src={`https://www.youtube.com/embed/${videoKey}?autoplay=1&rel=0`}
              className="w-full h-full"
              allow="autoplay; encrypted-media; fullscreen"
              allowFullScreen
              title="trailer"
            />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body,
  )
}
