// Adapted from stablyai/orca (MIT) src/renderer/src/app-shell/WindowControls.tsx @ cf7ce058
import { useEffect, useState } from 'react'
import { Copy, Minus, Square, X } from 'lucide-react'

export function WindowControls() {
  const [maximized, setMaximized] = useState(false)
  useEffect(() => window.keel.window.onMaximizedChange(setMaximized), [])
  return (
    <div className="window-controls">
      <button className="window-controls-btn" aria-label="최소화" onClick={() => window.keel.window.minimize()}><Minus size={14} /></button>
      <button className="window-controls-btn" aria-label={maximized ? '이전 크기로' : '최대화'} onClick={() => window.keel.window.maximize()}>{maximized ? <Copy size={12} /> : <Square size={12} />}</button>
      <button className="window-controls-btn window-controls-close" aria-label="닫기" onClick={() => window.keel.window.close()}><X size={14} /></button>
    </div>
  )
}
