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
  try {
    return JSON.parse(readFileSync(SETTINGS_PATH, 'utf-8'));
  } catch {
    return {};
  }
}

function writeSettings(settings: ClaudeSettings) {
  mkdirSync(CLAUDE_DIR, { recursive: true });
  writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2), 'utf-8');
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

export function unregisterStudio(studioName: string): boolean {
  const mcpServerKey = `${studioName}-patterns`;
  const settings = readSettings();

  if (!settings.mcpServers?.[mcpServerKey]) return false;

  delete settings.mcpServers[mcpServerKey];
  writeSettings(settings);
  return true;
}

export function listRegisteredStudios(): string[] {
  const settings = readSettings();
  const servers = settings.mcpServers ?? {};
  return Object.keys(servers).filter(k => k.endsWith('-patterns'));
}
