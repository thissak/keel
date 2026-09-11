import { copyFileSync } from 'node:fs';
copyFileSync(new URL('./shared/notes.json', import.meta.url), new URL('./theia/note-extension/src/notes.json', import.meta.url));
