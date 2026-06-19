import { useEffect } from 'react'

export function useScrollLock() {
  useEffect(() => {
    const scrollY = window.scrollY
    const prevCss = document.body.style.cssText
    // position:fixed prevents iOS WebView from scrolling the underlying page
    document.body.style.cssText = `${prevCss}; overflow: hidden; position: fixed; top: -${scrollY}px; left: 0; right: 0; width: 100%;`
    return () => {
      document.body.style.cssText = prevCss
      window.scrollTo(0, scrollY)
    }
  }, [])
}
