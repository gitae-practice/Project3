// 로딩 중일 때 보여주는 스피너 컴포넌트
// size: 'sm' | 'md' | 'lg' — 기본값 'md'
export default function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-3',
  }[size]

  return (
    <div className="flex justify-center items-center py-8">
      <div
        className={`${sizeClass} rounded-full animate-spin`}
        style={{
          borderColor: '#2a2a2a',
          borderTopColor: '#d4a843', // 골드 액센트로 스피너 표시
        }}
      />
    </div>
  )
}
