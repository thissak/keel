import { ContainerModule } from '@theia/core/shared/inversify';
import { CommandContribution, CommandRegistry } from '@theia/core/lib/common/command';
import { FrontendApplicationContribution } from '@theia/core/lib/browser/frontend-application-contribution';
import { FrontendApplication } from '@theia/core/lib/browser/frontend-application';
import { ApplicationShell } from '@theia/core/lib/browser/shell/application-shell';
import { ShellLayoutRestorer } from '@theia/core/lib/browser/shell/shell-layout-restorer';
import { BaseWidget } from '@theia/core/lib/browser/widgets/widget';
import { WidgetFactory, WidgetManager } from '@theia/core/lib/browser/widget-manager';
import { MenuContribution, MenuModelRegistry, MAIN_MENU_BAR } from '@theia/core/lib/common/menu';
import notes from './notes.json';

const NOTE = 'keel-note';
const LIST = 'keel-note-list';
const INFO = 'keel-note-info';
const SAVE = 'keel.save-layout';

function button(label: string, action: () => void): HTMLButtonElement {
  const node = document.createElement('button');
  node.textContent = label;
  node.className = 'theia-button';
  node.style.cssText = 'display:block;margin:12px 0;white-space:normal';
  node.onclick = action;
  return node;
}

function widget(id: string, title: string, closable: boolean): BaseWidget {
  const result = new BaseWidget();
  result.id = id;
  result.title.label = title;
  result.title.caption = title;
  result.title.closable = closable;
  result.title.iconClass = 'codicon codicon-book';
  result.node.style.cssText = 'padding:24px;overflow:auto';
  return result;
}

export default new ContainerModule(bind => {
  bind(WidgetFactory).toDynamicValue(context => ({
    id: NOTE,
    createWidget: async ({ noteId }: { noteId: string }) => {
      const note = notes.find(item => item.id === noteId);
      if (!note) throw new Error('Unknown comparison note');
      const result = widget(`${NOTE}:${note.id}`, note.title, true);
      const article = document.createElement('article');
      const title = document.createElement('h1');
      title.textContent = note.title;
      const body = document.createElement('p');
      body.textContent = note.body;
      body.style.cssText = 'line-height:1.9;max-width:720px';
      article.append(title, body);
      result.node.append(article);
      return result;
    }
  })).inSingletonScope();

  bind(WidgetFactory).toDynamicValue(context => ({
    id: LIST,
    createWidget: async () => {
      const result = widget(LIST, '노트', false);
      const commands = context.container.get(CommandRegistry);
      for (const note of notes) result.node.append(button(note.title, () => { void commands.executeCommand(`keel.open.${note.id}`); }));
      result.node.append(button('레이아웃 저장', () => { void commands.executeCommand(SAVE); }));
      return result;
    }
  })).inSingletonScope();

  bind(WidgetFactory).toDynamicValue(() => ({
    id: INFO,
    createWidget: async () => {
      const result = widget(INFO, '노트 정보', false);
      result.node.textContent = '샘플 노트 2개 · 서버 연결 없음. 실제 골든노트 콘텐츠가 아닙니다.';
      return result;
    }
  })).inSingletonScope();

  bind(CommandContribution).toDynamicValue(context => ({
    registerCommands: (commands: CommandRegistry) => {
      for (const note of notes) commands.registerCommand({ id: `keel.open.${note.id}`, label: `노트: ${note.title}` }, {
        execute: async () => {
          const shell = context.container.get(ApplicationShell);
          const result = await context.container.get(WidgetManager).getOrCreateWidget(NOTE, { noteId: note.id });
          if (!result.isAttached) await shell.addWidget(result, { area: 'main' });
          await shell.activateWidget(result.id);
        }
      });
      commands.registerCommand({ id: SAVE, label: '노트: 레이아웃 저장' }, {
        execute: () => context.container.get(ShellLayoutRestorer).storeLayout(context.container.get(FrontendApplication))
      });
    }
  })).inSingletonScope();

  bind(MenuContribution).toConstantValue({
    registerMenus: (menus: MenuModelRegistry) => {
      const path = [...MAIN_MENU_BAR, 'keel-notes'];
      menus.registerSubmenu(path, '노트');
      for (const note of notes) menus.registerMenuAction(path, { commandId: `keel.open.${note.id}` });
      menus.registerMenuAction(path, { commandId: SAVE });
    }
  });

  bind(FrontendApplicationContribution).toDynamicValue(context => ({
    onDidInitializeLayout: async () => {
      const shell = context.container.get(ApplicationShell);
      const manager = context.container.get(WidgetManager);
      const list = await manager.getOrCreateWidget(LIST);
      const info = await manager.getOrCreateWidget(INFO);
      if (!list.isAttached) await shell.addWidget(list, { area: 'left', rank: 0 });
      if (!info.isAttached) await shell.addWidget(info, { area: 'right', rank: 0 });
      await shell.revealWidget(list.id);
      await shell.revealWidget(info.id);
      if (![...shell.mainPanel.widgets()].length) await context.container.get(CommandRegistry).executeCommand(`keel.open.${notes[0].id}`);
    }
  })).inSingletonScope();
});
