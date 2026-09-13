// 구조는 stablyai/orca (MIT) src/renderer/src/components/tab-group/TabGroupSplitLayout.tsx @ cf7ce058를 따르되 dnd 제외
import { useRef, type ReactNode } from 'react'
import type { LayoutNode } from '../../shared/tab-model.js'
import { MAX_RATIO, MIN_RATIO } from '../../shared/tab-model.js'

interface Props { node: LayoutNode; path: number[]; renderGroup(groupId: string): ReactNode; onRatio(path: number[], ratio: number): void }

export function SplitLayout({ node, path, renderGroup, onRatio }: Props) {
  if (node.type === 'leaf') return <div className="flex flex-1 min-w-0 min-h-0">{renderGroup(node.groupId)}</div>
  const horizontal = node.direction === 'horizontal'
  return (
    <div className={horizontal ? 'flex flex-row flex-1 min-w-0 min-h-0' : 'flex flex-col flex-1 min-w-0 min-h-0'}>
      <div data-split-first className="flex min-w-0 min-h-0" style={{ flex: `${node.ratio} 1 0%` }}>
        <SplitLayout node={node.first} path={[...path, 0]} renderGroup={renderGroup} onRatio={onRatio} />
      </div>
      <ResizeHandle horizontal={horizontal} onDrag={ratio => onRatio(path, ratio)} />
      <div className="flex min-w-0 min-h-0" style={{ flex: `${1 - node.ratio} 1 0%` }}>
        <SplitLayout node={node.second} path={[...path, 1]} renderGroup={renderGroup} onRatio={onRatio} />
      </div>
    </div>
  )
}

function ResizeHandle({ horizontal, onDrag }: { horizontal: boolean; onDrag(ratio: number): void }) {
  const ref = useRef<HTMLDivElement>(null)
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const parent = ref.current?.parentElement
    if (!parent) return
    e.preventDefault()
    ref.current!.setPointerCapture(e.pointerId)
    const rect = parent.getBoundingClientRect()
    const move = (ev: PointerEvent) => {
      const raw = horizontal ? (ev.clientX - rect.left) / rect.width : (ev.clientY - rect.top) / rect.height
      onDrag(Math.min(MAX_RATIO, Math.max(MIN_RATIO, raw)))
    }
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up) }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }
  return (
    <div ref={ref} data-split-handle onPointerDown={onPointerDown}
      className={horizontal
        ? 'w-1 shrink-0 cursor-col-resize bg-split-divider hover:bg-split-divider-strong'
        : 'h-1 shrink-0 cursor-row-resize bg-split-divider hover:bg-split-divider-strong'} />
  )
}
