import path from 'node:path';
import fs from 'node:fs/promises';
import type { AgentTool } from '../types.ts';
import { resolveSafe } from './workspace-path.ts';

/**
 * Tool ghi file — cùng giới hạn workspaceRoot như read_file. Input JSON:
 * { "path": "...", "content": "..." }
 */
export function createWriteFileTool(workspaceRoot: string): AgentTool {
  return {
    name: 'write_file',
    description: 'Ghi nội dung vào một file trong project workspace. Input JSON: { "path": "...", "content": "..." }',
    run: async (input: string) => {
      try {
        const parsed = JSON.parse(input) as { path: string; content: string };
        const target = resolveSafe(workspaceRoot, parsed.path);
        await fs.mkdir(path.dirname(target), { recursive: true });
        await fs.writeFile(target, parsed.content, 'utf-8');
        return `Đã ghi ${parsed.content.length} ký tự vào ${parsed.path}`;
      } catch (err) {
        return `Lỗi khi ghi file: ${err instanceof Error ? err.message : String(err)}`;
      }
    },
  };
}
