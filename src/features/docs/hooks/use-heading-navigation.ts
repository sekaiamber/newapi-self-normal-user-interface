/*
 * [user-ui] 私有文档（本仓库新增文件，非官方代码）。
 * 页内标题跳转与"本页目录"的当前标题高亮。
 */
import { useRouter } from '@tanstack/react-router'
import { useCallback, useEffect, useState } from 'react'

/** Distance from the viewport top below the fixed header, in pixels. */
const ACTIVE_HEADING_OFFSET = 120

/** Scroll to a heading and record it in the URL hash without a new history entry. */
export function useScrollToHeading(): (id: string) => void {
  const router = useRouter()

  return useCallback(
    (id: string) => {
      const element = document.getElementById(id)
      if (!element) return
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      void router.navigate({
        to: '.',
        hash: id,
        replace: true,
        resetScroll: false,
        hashScrollIntoView: false,
      })
    },
    [router]
  )
}

/** Id of the last heading scrolled past the header, for the table of contents. */
export function useActiveHeading(ids: readonly string[]): string | undefined {
  const [activeId, setActiveId] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (ids.length === 0) return undefined

    let frame = 0
    const update = () => {
      frame = 0
      let current = ids[0]
      for (const id of ids) {
        const element = document.getElementById(id)
        if (!element) continue
        if (element.getBoundingClientRect().top > ACTIVE_HEADING_OFFSET) break
        current = id
      }
      setActiveId(current)
    }
    const schedule = () => {
      if (frame === 0) frame = window.requestAnimationFrame(update)
    }

    schedule()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      if (frame !== 0) window.cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [ids])

  return activeId
}
