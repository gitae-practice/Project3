# 🎬 무비로그 (MovieLog)

영화와 드라마를 검색하고, 찜 목록과 시청 기록을 관리하는 트래커 앱입니다.

---

## 주요 기능

- 영화 · 드라마 통합 검색 및 상세 정보 조회
- 찜하기 / 시청 중 / 시청 완료 상태 관리
- 별점 평가 및 개인 시청 기록 보관
- 로그인 기반 개인화 데이터 저장

## 기술 스택

| 구분 | 사용 기술 |
|---|---|
| 프레임워크 | React + TypeScript (Vite) |
| 스타일 | Tailwind CSS v4 |
| 애니메이션 | Framer Motion |
| 데이터 패칭 | TanStack Query (React Query) |
| 백엔드 / DB | Supabase (PostgreSQL + Auth) |
| 영화 데이터 | TMDB API |
| 라우팅 | React Router v6 |

## 로컬 실행 방법

```bash
# 1. 의존성 설치
npm install

# 2. 환경변수 설정 (.env 파일 생성 후 아래 내용 입력)
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_TMDB_API_KEY=...

# 3. 개발 서버 실행
npm run dev
```

## 환경변수

| 변수명 | 설명 |
|---|---|
| `VITE_SUPABASE_URL` | Supabase 프로젝트 URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon public key |
| `VITE_TMDB_API_KEY` | TMDB API 키 |
