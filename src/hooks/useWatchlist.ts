import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { WatchlistItem, MediaType, WatchStatus } from '../types'

// ─── 조회 훅 ───────────────────────────────────────────────────

// 내 찜 목록 전체 가져오기 — WatchlistPage에서 사용
export function useWatchlist(userId: string | undefined) {
  return useQuery({
    queryKey: ['watchlist', userId],
    queryFn: async () => {
      if (!userId) return []
      const { data, error } = await supabase
        .from('watchlist')
        .select('*')
        .order('created_at', { ascending: false }) // 최근에 추가한 순
      if (error) throw error
      return data as WatchlistItem[]
    },
    // userId가 없으면(비로그인) 쿼리 실행하지 않음
    enabled: !!userId,
  })
}

// 특정 영화/드라마가 내 목록에 있는지 확인 — 상세 페이지·카드에서 상태 표시용
export function useWatchlistItem(
  userId: string | undefined,
  mediaId: number,
  mediaType: MediaType,
) {
  return useQuery({
    queryKey: ['watchlist-item', userId, mediaId, mediaType],
    queryFn: async () => {
      if (!userId) return null
      const { data } = await supabase
        .from('watchlist')
        .select('*')
        .eq('media_id', mediaId)
        .eq('media_type', mediaType)
        .maybeSingle() // 없으면 null 반환 (single()은 없을 때 에러)
      return data as WatchlistItem | null
    },
    enabled: !!userId,
  })
}

// ─── 추가/수정/삭제 훅 ─────────────────────────────────────────

// 찜 추가 — 이미 있으면 status만 업데이트 (upsert 방식)
export function useUpsertWatchlist() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (
      item: Omit<WatchlistItem, 'id' | 'created_at'>,
    ) => {
      const { data, error } = await supabase
        .from('watchlist')
        // onConflict: user_id + media_id + media_type 조합이 이미 있으면 UPDATE
        .upsert(item, { onConflict: 'user_id,media_id,media_type' })
        .select()
        .single()
      if (error) throw error
      return data as WatchlistItem
    },
    // 성공 시 관련 쿼리 캐시 무효화 → 자동으로 다시 fetch
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['watchlist', data.user_id] })
      queryClient.invalidateQueries({
        queryKey: ['watchlist-item', data.user_id, data.media_id, data.media_type],
      })
    },
  })
}

// 별점 + 상태 업데이트 (시청 완료 후 별점 줄 때 사용)
export function useUpdateWatchlist() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      status,
      rating,
    }: {
      id: string
      status?: WatchStatus
      rating?: number | null
    }) => {
      const { data, error } = await supabase
        .from('watchlist')
        .update({ status, rating })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as WatchlistItem
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['watchlist'] })
      // watchlist-item은 별도 키라 따로 무효화해야 상세 페이지 별점이 즉시 반영됨
      queryClient.invalidateQueries({
        queryKey: ['watchlist-item', data.user_id, data.media_id, data.media_type],
      })
    },
  })
}

// 목록에서 삭제
export function useRemoveWatchlist() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, userId }: { id: string; userId: string }) => {
      const { error } = await supabase.from('watchlist').delete().eq('id', id)
      if (error) throw error
      return userId
    },
    onSuccess: (userId) => {
      queryClient.invalidateQueries({ queryKey: ['watchlist', userId] })
      // watchlist-item 캐시도 전부 무효화
      queryClient.invalidateQueries({ queryKey: ['watchlist-item'] })
    },
  })
}
