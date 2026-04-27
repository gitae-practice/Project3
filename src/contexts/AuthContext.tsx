import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { User } from '../types'

// 로그인 상태와 인증 함수들을 담는 Context 타입
interface AuthContextType {
  user: User | null          // 로그인한 사용자 (null이면 비로그인)
  loading: boolean           // 초기 세션 확인 중 여부
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
}

// Context 생성 — 기본값은 null, 반드시 Provider 안에서만 사용
const AuthContext = createContext<AuthContextType | null>(null)

// Provider: main.tsx에서 앱 전체를 감싸서 어디서든 useAuth() 사용 가능하게 함
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 앱 시작 시 저장된 세션이 있으면 자동 로그인 복원
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ? { id: session.user.id, email: session.user.email! } : null)
      setLoading(false)
    })

    // 로그인/로그아웃 이벤트를 실시간으로 감지해서 상태 동기화
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? { id: session.user.id, email: session.user.email! } : null)
    })

    // 컴포넌트 언마운트 시 이벤트 구독 해제 (메모리 누수 방지)
    return () => subscription.unsubscribe()
  }, [])

  // 이메일/비밀번호 로그인
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  // 회원가입
  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password })
    return { error }
  }

  // 로그아웃
  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

// 커스텀 훅 — Provider 밖에서 쓰면 에러를 던져서 실수 방지
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth는 AuthProvider 안에서만 사용할 수 있습니다.')
  return ctx
}
