// 별점 컴포넌트 — 표시용(readOnly)과 입력용 두 가지 모드
interface StarRatingProps {
  value: number | null       // 현재 별점 (1~5)
  onChange?: (v: number) => void  // 입력 모드일 때 별점 변경 핸들러
  readOnly?: boolean         // true면 클릭 불가
  size?: 'sm' | 'md'
}

export default function StarRating({
  value,
  onChange,
  readOnly = false,
  size = 'sm',
}: StarRatingProps) {
  const starSize = size === 'sm' ? 'text-sm' : 'text-lg'

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readOnly}
          onClick={() => onChange?.(star)}
          className={`${starSize} transition-transform ${
            readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-110'
          }`}
          style={{
            // 별점 이하면 골드, 초과면 회색
            color: value && value >= star ? '#d4a843' : '#3a3a3a',
            background: 'none',
            border: 'none',
            padding: '0 1px',
          }}
        >
          ★
        </button>
      ))}
    </div>
  )
}
