import { createRoot } from 'react-dom/client'
import { KeelShell, useKeel } from '@goldenlabs/keel/renderer'
import './main.css'

function Sidebar() {
  const keel = useKeel()
  return (
    <nav className="p-2 text-sm">
      <button className="w-full rounded px-2 py-1 text-left hover:bg-left-sidebar-accent" onClick={() => keel.openWeb({ url: 'https://example.com/', title: 'Example' })}>Example</button>
    </nav>
  )
}

createRoot(document.getElementById('root')!).render(
  <KeelShell sidebar={<Sidebar />} onReady={(keel, restored) => { if (!restored) keel.openWeb({ url: 'https://example.com/', title: 'Example' }) }} />
)
