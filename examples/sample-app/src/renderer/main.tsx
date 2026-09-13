import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Info } from 'lucide-react'
import { KeelShell, useKeel, type PanelProps } from '@goldenlabs/keel/renderer'
import './main.css'

// Keel preload는 앱 채널을 노출하지 않으므로 시작 값은 renderer.query로 받는다
const params = new URLSearchParams(location.search)
const origin = params.get('origin') ?? ''
const mode = params.get('mode') ?? 'shell'
const notes = [
  { id: 'app-base', title: '앱베이스란', body: '여러 앱이 공유하는 기본 틀이다.' },
  { id: 'versioning', title: '공통 개선 적용', body: '소비 앱은 Keel 버전을 선택한다.' }
]

function NotePanel({ params }: PanelProps<{ title: string; body: string }>) {
  return <article className="p-6"><h1 className="text-lg font-semibold">{params.title}</h1><p className="mt-2 text-sm text-muted-foreground">{params.body}</p></article>
}

function Sidebar() {
  const keel = useKeel()
  const [fetchResult, setFetchResult] = useState('')
  const fetchAsApp = async (path: string) => {
    const r = await keel.fetchAsApp(origin + path)
    // /moved 응답 본문은 "<!doctype html><title>샘플 웹 /second</title>…"이라 제목까지 보이려면 40자가 필요하다
    setFetchResult(`loginRequired:${r.loginRequired} status:${r.status}${path === '/moved' ? ` text:${r.text.slice(0, 40)}` : ''}`)
  }
  const item = 'rounded px-2 py-1 text-left hover:bg-left-sidebar-accent'
  return (
    <nav aria-label="노트 목록" className="flex flex-col gap-1 p-2 text-sm">
      {notes.map(n => <button key={n.id} className={item} onClick={() => keel.openPanel({ kind: 'note', id: n.id, title: n.title, params: n })}>{n.title}</button>)}
      <button className={item} onClick={() => keel.openWeb({ url: `${origin}/`, title: '샘플 웹' })}>샘플 웹</button>
      <button className={item} onClick={() => keel.openWeb({ url: `${origin}/login-cookie`, title: '쿠키 발급' })}>쿠키 발급</button>
      <button className={item} onClick={() => keel.split('horizontal')}>분할</button>
      <button className={item} onClick={() => void fetchAsApp('/protected')}>보호 fetch</button>
      <button className={item} onClick={() => void fetchAsApp('/moved')}>이동 fetch</button>
      <output id="fetch-result" className="px-2 text-xs text-muted-foreground">{fetchResult}</output>
    </nav>
  )
}

const shell = mode === 'web'
  // 사이드바·활동 없이 웹 한 장이 창 전체를 채우는 구성 (tabStrip: 'never')
  ? <KeelShell layout={{ tabStrip: 'never' }} onReady={(k, r) => { if (!r) k.openWeb({ url: origin + '/' }) }} />
  : (
    <KeelShell
      sidebar={<Sidebar />}
      activities={[{ id: 'info', title: '정보', icon: Info, panel: <p className="p-3 text-sm">우측 패널</p> }]}
      panels={{ note: NotePanel }}
      onReady={(keel, restored) => { if (!restored) keel.openPanel({ kind: 'note', id: notes[0].id, title: notes[0].title, params: notes[0] }) }}
    />
  )

createRoot(document.getElementById('root')!).render(shell)
