import { useCallback, useEffect, useRef, useState } from "react"
import { errMsg } from "@/services/api"

/** Runs an async loader on mount / when deps change; ignores stale responses. */
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const seq = useRef(0)
  const run = useCallback(() => {
    const id = ++seq.current
    setLoading(true); setError(null)
    fn().then((d) => { if (id === seq.current) setData(d) })
      .catch((e) => { if (id === seq.current) setError(errMsg(e)) })
      .finally(() => { if (id === seq.current) setLoading(false) })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  useEffect(() => { run() }, [run])
  return { data, loading, error, reload: run, setData }
}

export function useDebounced<T>(value: T, ms = 350) {
  const [v, setV] = useState(value)
  useEffect(() => { const t = setTimeout(() => setV(value), ms); return () => clearTimeout(t) }, [value, ms])
  return v
}
