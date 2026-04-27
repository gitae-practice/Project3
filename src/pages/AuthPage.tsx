import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'

export default function AuthPage() {
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()

  // 로그인/회원가입 모드 전환
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [loading, setLoading] = useState(false)
  // 회원가입 완료 시 안내 메시지 표시용
  const [signupDone, setSignupDone] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setLoading(true)

    if (mode === 'signin') {
      const { error } = await signIn(email, password)
      if (error) {
        setErrorMsg('이메일 또는 비밀번호가 올바르지 않습니다.')
      } else {
        navigate('/') // 로그인 성공 → 홈으로
      }
    } else {
      const { error } = await signUp(email, password)
      if (error) {
        setErrorMsg(error.message)
      } else {
        // Supabase 기본 설정은 이메일 인증 필요 — 안내 메시지 표시
        setSignupDone(true)
      }
    }

    setLoading(false)
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: '#0f0f0f' }}
    >
      <motion.div
        className="w-full max-w-sm rounded-2xl p-8"
        style={{ backgroundColor: '#1c1c1c', border: '1px solid #2a2a2a' }}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* 로고 */}
        <div className="text-center mb-8">
          <span className="text-2xl font-bold" style={{ color: '#d4a843' }}>
            무비로그
          </span>
          <p className="text-sm mt-1" style={{ color: '#666' }}>
            {mode === 'signin' ? '로그인하고 내 목록을 관리하세요' : '무료로 시작하세요'}
          </p>
        </div>

        {/* 회원가입 완료 안내 */}
        {signupDone ? (
          <div className="text-center space-y-4">
            <p className="text-sm" style={{ color: '#aaa' }}>
              입력하신 이메일로 인증 링크가 발송됐어요. <br />
              이메일을 확인한 후 로그인해주세요.
            </p>
            <button
              onClick={() => { setSignupDone(false); setMode('signin') }}
              className="text-sm font-medium"
              style={{ color: '#d4a843' }}
            >
              로그인하러 가기
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 이메일 입력 */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium" style={{ color: '#888' }}>
                이메일
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="example@email.com"
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-colors"
                style={{
                  backgroundColor: '#252525',
                  border: '1px solid #2a2a2a',
                  color: '#f1f1f1',
                }}
                onFocus={e => (e.currentTarget.style.borderColor = '#d4a843')}
                onBlur={e => (e.currentTarget.style.borderColor = '#2a2a2a')}
              />
            </div>

            {/* 비밀번호 입력 */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium" style={{ color: '#888' }}>
                비밀번호
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="6자 이상"
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-colors"
                style={{
                  backgroundColor: '#252525',
                  border: '1px solid #2a2a2a',
                  color: '#f1f1f1',
                }}
                onFocus={e => (e.currentTarget.style.borderColor = '#d4a843')}
                onBlur={e => (e.currentTarget.style.borderColor = '#2a2a2a')}
              />
            </div>

            {/* 에러 메시지 */}
            {errorMsg && (
              <p className="text-xs px-3 py-2 rounded-lg" style={{ color: '#f87171', backgroundColor: '#1f1010' }}>
                {errorMsg}
              </p>
            )}

            {/* 제출 버튼 */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg text-sm font-semibold transition-opacity"
              style={{
                backgroundColor: '#d4a843',
                color: '#0f0f0f',
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? '처리 중...' : mode === 'signin' ? '로그인' : '회원가입'}
            </button>

            {/* 모드 전환 */}
            <p className="text-center text-xs" style={{ color: '#555' }}>
              {mode === 'signin' ? '계정이 없으신가요?' : '이미 계정이 있으신가요?'}{' '}
              <button
                type="button"
                onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setErrorMsg('') }}
                className="font-medium"
                style={{ color: '#d4a843' }}
              >
                {mode === 'signin' ? '회원가입' : '로그인'}
              </button>
            </p>
          </form>
        )}
      </motion.div>
    </div>
  )
}
