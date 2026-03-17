#!/usr/bin/env bun

import {
  createCliRenderer,
  BoxRenderable,
  TextRenderable,
  InputRenderable,
  InputRenderableEvents,
  SelectRenderable,
  SelectRenderableEvents,
  RenderableEvents,
  type CliRenderer,
  type SelectOption,
  t,
  bold,
  fg,
  dim,
} from '@opentui/core';
import { existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { detectStack, type StackInfo } from './lib/detector';
import { inferPatterns, type InferredPattern } from './lib/inferrer';
import { assembleStudio } from './lib/assembler';
import { registerStudio } from './lib/installer';

// ─── Colors ───────────────────────────────────────────────────────────────────

const C = {
  bg:       '#0d1117',
  surface:  '#161b22',
  border:   '#30363d',
  accent:   '#3b82f6',
  green:    '#22c55e',
  yellow:   '#eab308',
  red:      '#ef4444',
  muted:    '#6e7681',
  text:     '#e6edf3',
  subtext:  '#8b949e',
};

// ─── State machine ────────────────────────────────────────────────────────────

type Step =
  | 'name'
  | 'path'
  | 'stack-desc'
  | 'confirm'
  | 'generating'
  | 'done'
  | 'error';

interface WizardState {
  step: Step;
  studioName: string;
  projectPath: string;
  stackDesc: string;
  stack: StackInfo | null;
  patterns: InferredPattern[];
  errorMsg: string;
  resultPath: string;
}

const state: WizardState = {
  step: 'name',
  studioName: '',
  projectPath: '',
  stackDesc: '',
  stack: null,
  patterns: [],
  errorMsg: '',
  resultPath: '',
};

// ─── Layout ───────────────────────────────────────────────────────────────────

interface Layout {
  renderer: CliRenderer;
  // Header
  headerText: TextRenderable;
  // Content
  contentBox: BoxRenderable;
  titleText: TextRenderable;
  bodyText: TextRenderable;
  statusText: TextRenderable;
  // Input
  inputBox: BoxRenderable;
  input: InputRenderable;
  // Confirm select
  confirmBox: BoxRenderable;
  confirmSelect: SelectRenderable;
  // Footer
  footerText: TextRenderable;
}

// ─── Build UI ─────────────────────────────────────────────────────────────────

async function buildUI(): Promise<Layout> {
  const renderer = await createCliRenderer({ exitOnCtrlC: true });
  renderer.setBackgroundColor(C.bg);

  // ── Header ──
  const headerBox = new BoxRenderable(renderer, {
    id: 'header',
    zIndex: 1, width: 'auto', height: 3,
    flexGrow: 0, flexShrink: 0,
    border: true, borderStyle: 'single', borderColor: C.accent,
    backgroundColor: C.surface,
  });
  const headerText = new TextRenderable(renderer, {
    id: 'header-text',
    content: bold(fg(C.accent)('ui-studio')) + ' ' + fg(C.text)('generator'),
    zIndex: 2, flexGrow: 1, flexShrink: 1,
  });
  headerBox.add(headerText);

  // ── Content ──
  const contentBox = new BoxRenderable(renderer, {
    id: 'content',
    zIndex: 1, width: 'auto', height: 'auto',
    flexGrow: 1, flexShrink: 1,
    flexDirection: 'column',
    border: true, borderStyle: 'rounded', borderColor: C.border,
    backgroundColor: C.bg,
    padding: 1,
  });

  const titleText = new TextRenderable(renderer, {
    id: 'title',
    content: '',
    zIndex: 2, flexGrow: 0, flexShrink: 0,
  });

  const bodyText = new TextRenderable(renderer, {
    id: 'body',
    content: '',
    zIndex: 2, flexGrow: 0, flexShrink: 0,
    marginTop: 1,
  });

  // ── Input field ──
  const inputBox = new BoxRenderable(renderer, {
    id: 'input-box',
    zIndex: 2, width: 'auto', height: 3,
    flexGrow: 0, flexShrink: 0,
    border: true, borderStyle: 'single',
    borderColor: C.border, focusedBorderColor: C.accent,
    backgroundColor: C.surface,
    marginTop: 1,
  });

  const input = new InputRenderable(renderer, {
    id: 'main-input',
    zIndex: 3, width: 'auto', height: 1,
    flexGrow: 1, flexShrink: 1,
    backgroundColor: C.surface,
    focusedBackgroundColor: C.surface,
    textColor: C.text,
    focusedTextColor: C.text,
    placeholderColor: C.muted,
    cursorColor: C.accent,
    maxLength: 300,
  });
  inputBox.add(input);

  // ── Confirm select ──
  const confirmBox = new BoxRenderable(renderer, {
    id: 'confirm-box',
    zIndex: 2, width: 40, height: 6,
    flexGrow: 0, flexShrink: 0,
    border: true, borderStyle: 'rounded',
    borderColor: C.border, focusedBorderColor: C.accent,
    backgroundColor: C.surface,
    marginTop: 1,
  });

  const confirmSelect = new SelectRenderable(renderer, {
    id: 'confirm-select',
    zIndex: 3, width: 'auto', height: 'auto',
    flexGrow: 1, flexShrink: 1,
    options: [
      { name: 'Generate studio', description: 'Create the studio and register it', value: 'yes' },
      { name: 'Cancel', description: 'Exit without generating', value: 'no' },
    ] as SelectOption[],
    backgroundColor: C.surface,
    focusedBackgroundColor: C.surface,
    textColor: C.text,
    focusedTextColor: C.text,
    selectedBackgroundColor: C.accent,
    selectedTextColor: '#ffffff',
    descriptionColor: C.subtext,
    selectedDescriptionColor: C.text,
    showDescription: true,
    wrapSelection: true,
  });
  confirmBox.add(confirmSelect);

  // ── Status ──
  const statusText = new TextRenderable(renderer, {
    id: 'status',
    content: '',
    zIndex: 2, flexGrow: 0, flexShrink: 0,
    marginTop: 1,
  });

  contentBox.add(titleText);
  contentBox.add(bodyText);
  contentBox.add(inputBox);
  contentBox.add(statusText);

  // ── Footer ──
  const footerBox = new BoxRenderable(renderer, {
    id: 'footer',
    zIndex: 1, width: 'auto', height: 3,
    flexGrow: 0, flexShrink: 0,
    border: true, borderStyle: 'single', borderColor: C.border,
    backgroundColor: C.surface,
  });

  const footerText = new TextRenderable(renderer, {
    id: 'footer-text',
    content: '',
    zIndex: 2, flexGrow: 1, flexShrink: 1,
    fg: C.muted,
  });
  footerBox.add(footerText);

  renderer.root.add(headerBox);
  renderer.root.add(contentBox);
  renderer.root.add(footerBox);

  return {
    renderer, headerText, contentBox,
    titleText, bodyText, statusText,
    inputBox, input,
    confirmBox, confirmSelect,
    footerText,
  };
}

// ─── Step renderers ───────────────────────────────────────────────────────────

const STEPS: Record<string, { index: number; total: number }> = {
  name:       { index: 1, total: 4 },
  path:       { index: 2, total: 4 },
  'stack-desc': { index: 3, total: 4 },
  confirm:    { index: 3, total: 4 },
  generating: { index: 4, total: 4 },
  done:       { index: 4, total: 4 },
  error:      { index: 4, total: 4 },
};

function stepLabel(step: Step): string {
  const s = STEPS[step];
  return s ? fg(C.muted)(`Step ${s.index}/${s.total}  `) : '';
}

function renderStep(ui: Layout) {
  const { step } = state;

  // Hide confirm box by default
  try { ui.contentBox.remove('confirm-box'); } catch {}

  switch (step) {
    case 'name': {
      ui.titleText.content = stepLabel(step) + bold(fg(C.text)('Studio name'));
      ui.bodyText.content = fg(C.subtext)('Choose a slug for your studio (e.g. ') + fg(C.yellow)('"nextjs-studio"') + fg(C.subtext)(')');
      ui.input.value = state.studioName;
      ui.input.placeholder = 'my-app-studio';
      ui.statusText.content = '';
      ui.footerText.content = fg(C.muted)('Enter: next  │  Ctrl+C: quit');
      ui.input.focus();
      break;
    }

    case 'path': {
      ui.titleText.content = stepLabel(step) + bold(fg(C.text)('Project path'));
      ui.bodyText.content = fg(C.subtext)('Path to existing project to infer patterns from.\n') + fg(C.muted)('Leave empty to define conventions manually.');
      ui.input.value = state.projectPath;
      ui.input.placeholder = '/path/to/your/project  (or leave empty)';
      ui.statusText.content = '';
      ui.footerText.content = fg(C.muted)('Enter: next  │  Backspace: go back  │  Ctrl+C: quit');
      ui.input.focus();
      break;
    }

    case 'stack-desc': {
      ui.titleText.content = stepLabel(step) + bold(fg(C.text)('Stack description'));
      ui.bodyText.content =
        fg(C.subtext)('No code found. Describe your stack:\n') +
        fg(C.muted)('e.g. "Next.js 14 + Drizzle ORM + Stripe + Clerk auth"');
      ui.input.value = state.stackDesc;
      ui.input.placeholder = 'Next.js 14 + Drizzle + Stripe';
      ui.statusText.content = '';
      ui.footerText.content = fg(C.muted)('Enter: next  │  Backspace: go back  │  Ctrl+C: quit');
      ui.input.focus();
      break;
    }

    case 'confirm': {
      const { stack, patterns } = state;
      const patternList = patterns.length > 0
        ? patterns.map(p => fg(C.green)('  ✓ ') + fg(C.text)(p.title)).join('\n')
        : fg(C.yellow)('  ⚠ No patterns inferred — you can add them manually');

      ui.titleText.content = stepLabel(step) + bold(fg(C.text)('Confirm'));
      ui.bodyText.content = t`
${bold(fg(C.text)('Studio:'))}  ${fg(C.accent)(state.studioName)}
${bold(fg(C.text)('Stack:'))}   ${fg(C.text)(stack?.name ?? state.stackDesc)}
${bold(fg(C.text)('Patterns inferred:'))}
${patternList}
${bold(fg(C.text)('Install path:'))}  ${fg(C.muted)(join(homedir(), '.claude', 'plugins', state.studioName))}`;

      // Swap input box for confirm select
      try { ui.contentBox.remove('input-box'); } catch {}
      ui.contentBox.add(ui.confirmBox);
      ui.statusText.content = '';
      ui.footerText.content = fg(C.muted)('↑↓: select  │  Enter: confirm  │  Backspace: go back  │  Ctrl+C: quit');
      ui.confirmSelect.focus();
      break;
    }

    case 'generating': {
      try { ui.contentBox.remove('input-box'); } catch {}
      try { ui.contentBox.remove('confirm-box'); } catch {}
      ui.titleText.content = bold(fg(C.accent)('Generating studio…'));
      ui.bodyText.content = fg(C.subtext)('Creating files and registering MCP server…');
      ui.statusText.content = '';
      ui.footerText.content = fg(C.muted)('Please wait…');
      break;
    }

    case 'done': {
      try { ui.contentBox.remove('input-box'); } catch {}
      try { ui.contentBox.remove('confirm-box'); } catch {}
      ui.titleText.content = bold(fg(C.green)('✓ Studio created'));
      ui.bodyText.content = t`
${bold(fg(C.text)('Installed at:'))}
${fg(C.muted)(state.resultPath)}

${bold(fg(C.text)('Next steps:'))}
${fg(C.green)('1.')} Restart Claude Code to activate the studio
${fg(C.green)('2.')} The MCP server ${fg(C.accent)(state.studioName + '-patterns')} will be available
${fg(C.green)('3.')} ${state.patterns.length > 0 ? 'Patterns are ready — call list_resources to see them' : 'Add patterns to: ' + state.resultPath + '/mcp/resources/patterns/'}`;
      ui.statusText.content = '';
      ui.footerText.content = fg(C.muted)('Ctrl+C: quit');
      break;
    }

    case 'error': {
      try { ui.contentBox.remove('input-box'); } catch {}
      try { ui.contentBox.remove('confirm-box'); } catch {}
      ui.titleText.content = bold(fg(C.red)('✗ Error'));
      ui.bodyText.content = fg(C.text)(state.errorMsg);
      ui.statusText.content = fg(C.muted)('Press Ctrl+C to quit or Backspace to go back');
      ui.footerText.content = fg(C.muted)('Backspace: go back  │  Ctrl+C: quit');
      break;
    }
  }
}

// ─── Step transitions ─────────────────────────────────────────────────────────

async function advance(ui: Layout) {
  const { step } = state;

  if (step === 'name') {
    const name = ui.input.value.trim();
    if (!name) {
      ui.statusText.content = fg(C.red)('⚠ Studio name cannot be empty');
      return;
    }
    if (!/^[a-z0-9-]+$/.test(name)) {
      ui.statusText.content = fg(C.red)('⚠ Use only lowercase letters, numbers, and hyphens');
      return;
    }
    state.studioName = name;
    state.step = 'path';
    renderStep(ui);
    return;
  }

  if (step === 'path') {
    const rawPath = ui.input.value.trim();
    state.projectPath = rawPath;

    if (rawPath) {
      if (!existsSync(rawPath)) {
        ui.statusText.content = fg(C.red)('⚠ Path does not exist');
        return;
      }
      // Try to detect stack
      const detected = detectStack(rawPath);
      if (detected) {
        state.stack = detected;
        state.patterns = inferPatterns(rawPath, detected);
        state.step = 'confirm';
      } else {
        state.stack = null;
        state.patterns = [];
        state.step = 'stack-desc';
        ui.statusText.content = fg(C.yellow)('⚠ No stack detected — describe it manually');
      }
    } else {
      // No path → ask for stack description
      state.stack = null;
      state.patterns = [];
      state.step = 'stack-desc';
    }

    renderStep(ui);
    return;
  }

  if (step === 'stack-desc') {
    const desc = ui.input.value.trim();
    if (!desc) {
      ui.statusText.content = fg(C.red)('⚠ Please describe your stack');
      return;
    }
    state.stackDesc = desc;
    state.step = 'confirm';
    renderStep(ui);
    return;
  }
}

function goBack(ui: Layout) {
  const { step } = state;
  if (step === 'path') { state.step = 'name'; renderStep(ui); }
  else if (step === 'stack-desc') { state.step = 'path'; renderStep(ui); }
  else if (step === 'confirm') {
    state.step = state.projectPath && state.stack ? 'path' : 'stack-desc';
    renderStep(ui);
  }
  else if (step === 'error') {
    state.step = 'confirm';
    renderStep(ui);
  }
}

async function generate(ui: Layout) {
  state.step = 'generating';
  renderStep(ui);

  // Give the renderer a tick to update
  await new Promise(r => setTimeout(r, 50));

  try {
    const stack = state.stack ?? {
      name: state.stackDesc,
      id: state.studioName.replace(/-studio$/, ''),
      language: 'unknown',
      framework: 'unknown',
      features: [],
      sourceExts: [],
    };

    const installPath = join(homedir(), '.claude', 'plugins', state.studioName);

    const studioPath = assembleStudio({
      name: state.studioName,
      stack,
      patterns: state.patterns,
      installPath,
    });

    registerStudio(state.studioName, studioPath);

    // Install MCP deps
    const proc = Bun.spawnSync(['bun', 'install'], {
      cwd: join(studioPath, 'mcp'),
      stdout: 'pipe',
      stderr: 'pipe',
    });

    state.resultPath = studioPath;
    state.step = 'done';
  } catch (err) {
    state.errorMsg = err instanceof Error ? err.message : String(err);
    state.step = 'error';
  }

  renderStep(ui);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const ui = await buildUI();

  renderStep(ui);

  // ── Input: Enter key ──
  ui.input.on(InputRenderableEvents.SUBMIT, async () => {
    await advance(ui);
  });

  // ── Confirm select: item selected ──
  ui.confirmSelect.on(SelectRenderableEvents.ITEM_SELECTED, async (_idx: number, option: SelectOption) => {
    if (option.value === 'yes') {
      await generate(ui);
    } else {
      process.exit(0);
    }
  });

  // ── Global keyboard handler ──
  ui.renderer.keyInput.on('keypress', async (key: any) => {
    const { step } = state;

    // Backspace navigation (only when input is not focused or empty)
    if (key.name === 'backspace' && !key.ctrl) {
      const focused = ui.input.focused;
      if (!focused || ui.input.value === '') {
        goBack(ui);
      }
      return;
    }

    // Esc: go back
    if (key.name === 'escape') {
      goBack(ui);
      return;
    }

    // Enter on confirm step goes to generate (handled by select)
    // Enter on input steps handled by SUBMIT event above

    // Tab: re-focus active input
    if (key.name === 'tab' && (step === 'name' || step === 'path' || step === 'stack-desc')) {
      ui.input.focus();
      return;
    }
  });

  ui.renderer.start();
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
