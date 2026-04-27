import { Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import HomePage from './pages/HomePage'
import SearchPage from './pages/SearchPage'
import DetailPage from './pages/DetailPage'
import WatchlistPage from './pages/WatchlistPage'
import AuthPage from './pages/AuthPage'

// 앱 전체 라우트 구조
// Layout이 Navbar를 포함한 껍데기이고, 각 페이지가 그 안에 렌더링됨
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        {/* 메인 홈 */}
        <Route index element={<HomePage />} />
        {/* 검색 결과: /search?q=검색어 */}
        <Route path="search" element={<SearchPage />} />
        {/* 상세 페이지: /movie/12345 또는 /tv/67890 */}
        <Route path=":type/:id" element={<DetailPage />} />
        {/* 내 찜 목록 (로그인 필요) */}
        <Route path="watchlist" element={<WatchlistPage />} />
        {/* 로그인/회원가입 */}
        <Route path="auth" element={<AuthPage />} />
      </Route>
    </Routes>
  )
}
