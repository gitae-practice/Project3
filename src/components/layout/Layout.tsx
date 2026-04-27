import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'

// 모든 페이지의 공통 껍데기 — Navbar + 페이지 콘텐츠
// Outlet은 현재 URL에 맞는 페이지 컴포넌트로 교체됨
export default function Layout() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0f0f0f' }}>
      <Navbar />
      {/* Navbar 높이(64px)만큼 상단 여백 */}
      <main className="pt-16">
        <Outlet />
      </main>
    </div>
  )
}
