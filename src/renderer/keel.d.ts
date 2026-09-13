import type { KeelBridge } from '../shared/ipc.js'
declare global { interface Window { keel: KeelBridge } }
declare namespace React.JSX { interface IntrinsicElements { webview: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & { src?: string; partition?: string; allowpopups?: boolean }, HTMLElement> } }
export {}
