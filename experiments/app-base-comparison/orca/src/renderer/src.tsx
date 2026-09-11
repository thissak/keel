import { useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { FileText, Plus, Save, Search, X } from 'lucide-react';
import {
  DockviewReact,
  themeDark,
  type DockviewApi,
  type IDockviewHeaderActionsProps,
  type IDockviewPanelProps
} from 'dockview-react';
import notes from '../../../shared/notes.json';
import 'dockview-react/dist/styles/dockview.css';
import './style.css';

type Note = (typeof notes)[number];

function openNote(dock: DockviewApi, note: Note) {
  const existing = dock.getPanel(note.id);
  if (existing) {
    existing.api.setActive();
    return;
  }
  dock.addPanel({ id: note.id, component: 'note', title: note.title, params: note });
}

function AddTabAction({ containerApi }: IDockviewHeaderActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectNote = (note: Note) => {
    openNote(containerApi, note);
    setIsOpen(false);
  };

  return <div
    className="tab-add"
    onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setIsOpen(false); }}
    onKeyDown={event => { if (event.key === 'Escape') setIsOpen(false); }}
  >
    <button
      className="icon-button add-tab"
      aria-expanded={isOpen}
      aria-haspopup="menu"
      aria-label="새 탭 메뉴"
      title="새 탭"
      onClick={() => setIsOpen(open => !open)}
    ><Plus aria-hidden="true" size={18} strokeWidth={1.8} /></button>
    {isOpen ? <div className="tab-add-menu" role="menu" aria-label="열 노트 선택">
      <p>노트 열기</p>
      {notes.map(note => <button role="menuitem" key={note.id} onClick={() => selectNote(note)}>
        <FileText aria-hidden="true" size={15} />
        <span>{note.title}</span>
      </button>)}
    </div> : null}
  </div>;
}

const components = {
  note: ({ params }: IDockviewPanelProps<Note>) => (
    <article><p className="eyebrow">KEEL / SAMPLE NOTE</p><h1>{params.title}</h1><p>{params.body}</p></article>
  )
};
const storageKey = 'keel-comparison-layout-v1';

function App() {
  const api = useRef<DockviewApi | null>(null);
  const [active, setActive] = useState<Note | undefined>();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('샘플 노트 2개 · 서버 연결 없음');
  const normalizedQuery = query.trim().toLocaleLowerCase('ko');
  const filteredNotes = normalizedQuery
    ? notes.filter(note => `${note.title} ${note.body}`.toLocaleLowerCase('ko').includes(normalizedQuery))
    : notes;
  const showNote = (note: Note) => {
    const dock = api.current;
    if (!dock) return;
    openNote(dock, note);
  };
  return <main>
    <header><strong>Keel</strong><span>Orca 구성 · 노트 읽기 실험</span>
      <button className="save-layout" onClick={() => { if (api.current) { localStorage.setItem(storageKey, JSON.stringify(api.current.toJSON())); setStatus('레이아웃 저장 완료'); } }}>
        <Save aria-hidden="true" size={15} />
        <span>레이아웃 저장</span>
      </button>
    </header>
    <div className="workspace">
      <nav aria-label="노트 목록">
        <h2>노트</h2>
        <form role="search" onSubmit={event => { event.preventDefault(); if (filteredNotes[0]) showNote(filteredNotes[0]); }}>
          <div className="search-box">
            <Search aria-hidden="true" size={16} strokeWidth={1.8} />
            <input
              aria-label="노트 검색"
              placeholder="검색"
              type="search"
              value={query}
              onChange={event => setQuery(event.currentTarget.value)}
            />
            {query ? <button className="clear-search" type="button" aria-label="검색어 지우기" onClick={() => setQuery('')}>
              <X aria-hidden="true" size={14} />
            </button> : null}
          </div>
        </form>
        <div className="note-list">
          {filteredNotes.length > 0
            ? filteredNotes.map(note => <button key={note.id} onClick={() => showNote(note)}>
              <FileText aria-hidden="true" size={15} />
              <span>{note.title}</span>
            </button>)
            : <p className="empty-search">일치하는 노트가 없습니다.</p>}
        </div>
      </nav>
      <section aria-label="노트 탭"><DockviewReact components={components} rightHeaderActionsComponent={AddTabAction} theme={themeDark} onReady={({ api: dock }) => {
        api.current = dock;
        dock.onDidActivePanelChange(({ panel }) => setActive(notes.find(note => note.id === panel?.id)));
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          try { dock.fromJSON(JSON.parse(saved)); }
          catch { localStorage.removeItem(storageKey); setStatus('저장된 레이아웃을 읽지 못해 기본 화면으로 열었습니다'); openNote(dock, notes[0]); }
        } else openNote(dock, notes[0]);
      }} /></section>
      <aside aria-label="노트 정보"><h2>노트 정보</h2><p>{active?.detail ?? '노트를 선택하세요.'}</p></aside>
    </div>
    <footer role="status">{status}</footer>
  </main>;
}

createRoot(document.getElementById('root')!).render(<App />);
