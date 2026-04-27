// Supabase 클라이언트 초기화 — 앱 전체에서 이 인스턴스 하나를 공유해서 사용
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('.env 파일에 Supabase URL과 ANON KEY를 입력해주세요.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
