import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Search, Bookmark, LogOut, LogIn, X } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

export default function Navbar() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // 스크롤 내리면 배경을 불투명하게 전환
  const [scrolled, setScrolled] = useState(false)
  // 검색창 열림/닫힘 상태
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // 페이지 이동 시 검색창 닫기
  useEffect(() => {
    setSearchOpen(false)
    setSearchQuery('')
  }, [location.pathname])

  // 엔터 키로 검색 실행
  const handleSearch = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  // 현재 경로와 일치하는 링크에 활성 스타일 적용
  const isActive = (path: string) => location.pathname === path

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        backgroundColor: scrolled ? 'rgba(15,15,15,0.97)' : 'rgba(15,15,15,0.5)',
        backdropFilter: 'blur(12px)',
        borderBottom: scrolled ? '1px solid #1f1f1f' : 'none',
      }}
    >
      <div className="h-16 flex items-center justify-between gap-6" style={{ padding: '0 80px' }}>

        {/* 로고 */}
        <Link
          to="/"
          className="text-xl font-bold tracking-tight shrink-0"
          style={{ color: '#d4a843' }}
        >
          GitaeMovie
        </Link>

        {/* 가운데 네비게이션 링크 */}
        <nav className="hidden md:flex items-center gap-8">
          {[
            { to: '/', label: '홈' },
            { to: '/search?filter=movie', label: '영화' },
            { to: '/search?filter=tv', label: 'TV' },
          ].map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className="text-sm font-medium transition-colors"
              style={{
                color: isActive(to) ? '#f1f1f1' : '#888',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = '#f1f1f1')}
              onMouseLeave={e =>
                (e.currentTarget.style.color = isActive(to) ? '#f1f1f1' : '#888')
              }
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* 오른쪽 액션 영역 */}
        <div className="flex items-center gap-3">
          {/* 검색창 — searchOpen 상태에 따라 펼침/접힘 */}
          {searchOpen ? (
            <div className="flex items-center gap-2">
              <input
                autoFocus
                type="text"
                placeholder="영화·드라마 검색..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={handleSearch}
                className="text-sm px-3 py-1.5 rounded-lg outline-none w-48"
                style={{
                  backgroundColor: '#1c1c1c',
                  border: '1px solid #2a2a2a',
                  color: '#f1f1f1',
                }}
              />
              <button
                onClick={() => setSearchOpen(false)}
                className="text-[#888] hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setSearchOpen(true)}
              className="transition-colors"
              style={{ color: '#888' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#f1f1f1')}
              onMouseLeave={e => (e.currentTarget.style.color = '#888')}
            >
              <Search size={20} />
            </button>
          )}

          {/* 내 목록 버튼 (로그인 시) */}
          {user && (
            <Link
              to="/watchlist"
              className="transition-colors"
              style={{ color: '#888' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#d4a843')}
              onMouseLeave={e => (e.currentTarget.style.color = '#888')}
            >
              <Bookmark size={20} />
            </Link>
          )}

          {/* 로그인/로그아웃 버튼 */}
          {user ? (
            <button
              onClick={handleSignOut}
              className="text-sm flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors"
              style={{ color: '#888', border: '1px solid #2a2a2a' }}
              onMouseEnter={e => {
                e.currentTarget.style.color = '#f1f1f1'
                e.currentTarget.style.borderColor = '#3a3a3a'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = '#888'
                e.currentTarget.style.borderColor = '#2a2a2a'
              }}
            >
              <LogOut size={15} />
              로그아웃
            </button>
          ) : (
            <Link
              to="/auth"
              className="text-sm flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors font-medium"
              style={{
                backgroundColor: '#d4a843',
                color: '#0f0f0f',
              }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#c49a35')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#d4a843')}
            >
              <LogIn size={15} />
              로그인
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
