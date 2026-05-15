/**
 * @fileoverview SSE hook for live match updates.
 * Connects to /api/live/match/:id/stream and invokes callback on each update.
 */

import { useEffect, useRef } from 'react'

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000/api'

export function useLiveMatchStream(matchId: string | null | undefined, onUpdate: () => void, enabled = true) {
  const cbRef = useRef(onUpdate)
  cbRef.current = onUpdate

  useEffect(() => {
    if (!matchId || !enabled) return
    const url = `${API_BASE_URL.replace(/\/$/, '')}/live/match/${matchId}/stream`
    let es: EventSource | null = null
    try {
      es = new EventSource(url, { withCredentials: false })
    } catch {
      return
    }
    es.onmessage = (e) => {
      try {
        const parsed = JSON.parse(e.data)
        if (parsed?.type === 'update') cbRef.current()
      } catch {
        // ignore malformed messages
      }
    }
    es.onerror = () => {
      // EventSource auto-reconnects; swallow errors silently
    }
    return () => {
      es?.close()
    }
  }, [matchId, enabled])
}
