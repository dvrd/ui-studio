import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const CLAUDE_DIR = join(homedir(), '.claude');
const SETTINGS_PATH = join(CLAUDE_DIR, 'settings.json');

interface ClaudeSettings {
  mcpServers?: Record<string, unknown>;
  hooks?: Record<string, unknown>;
  [key: string]: unknown;
}

function readSettings(): ClaudeSettings {
  if (!existsSync(SETTINGS_PATH)) return {};
  const raw = readFileSync(SETTINGS_PATH, 'utf-8');
  try {
    return JSON.parse(raw);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`❌ ~/.claude/settings.json contains invalid JSON — aborting to avoid data loss.\n   Fix the file manually, then retry.\n   Error: ${msg}`);
    process.exit(1);
  }
}

function writeSettings(settings: ClaudeSettings) {
  try {
    mkdirSync(CLAUDE_DIR, { recursive: true });
    writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2), 'utf-8');
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`❌ Failed to write ~/.claude/settings.json: ${msg}`);
    process.exit(1);
  }
}

export interface InstallResult {
  studioPath: string;
  mcpServerKey: string;
  settingsUpdated: boolean;
  alreadyRegistered: boolean;
}

export function registerStudio(studioName: string, studioPath: string): InstallResult {
  const mcpServerKey = `${studioName}-patterns`;
  const settings = readSettings();

  settings.mcpServers ??= {};

  const alreadyRegistered = mcpServerKey in settings.mcpServers;

  settings.mcpServers[mcpServerKey] = {
    command: 'bun',
    args: [`${studioPath}/mcp/index.ts`],
  };

  writeSettings(settings);

  return {
    studioPath,
    mcpServerKey,
    settingsUpdated: true,
    alreadyRegistered,
  };
}

export function unregisterStudio(studioName: string): { found: boolean; studioPath: string | null } {
  const mcpServerKey = `${studioName}-patterns`;
  const settings = readSettings();

  if (!settings.mcpServers?.[mcpServerKey]) return { found: false, studioPath: null };

  // Extract the actual install path from the registered args before deleting
  const entry = settings.mcpServers[mcpServerKey] as { args?: string[] } | undefined;
  const mcpIndexPath = entry?.args?.[0] ?? null;
  // args[0] is "<studioPath>/mcp/index.ts" — strip the "/mcp/index.ts" suffix
  const studioPath = mcpIndexPath ? mcpIndexPath.replace(/\/mcp\/index\.ts$/, '') : null;

  delete settings.mcpServers[mcpServerKey];
  writeSettings(settings);
  return { found: true, studioPath };
}

export function listRegisteredStudios(): string[] {
  const settings = readSettings();
  const servers = settings.mcpServers ?? {};
  return Object.keys(servers).filter(k => k.endsWith('-patterns'));
}
