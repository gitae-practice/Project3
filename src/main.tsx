import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './contexts/AuthContext'
import './index.css'
import App from './App.tsx'

// React Query 전역 설정
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // API 응답을 5분간 캐시 — 같은 데이터를 계속 요청하지 않도록
      staleTime: 1000 * 60 * 5,
      // 실패 시 1번만 재시도 (기본값 3번에서 줄임)
      retry: 1,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* URL 기반 페이지 전환 제공자 */}
    <BrowserRouter>
      {/* API 캐시 관리 제공자 */}
      <QueryClientProvider client={queryClient}>
        {/* 로그인 상태를 앱 전체에서 공유하는 제공자 */}
        <AuthProvider>
          <App />
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>,
)
