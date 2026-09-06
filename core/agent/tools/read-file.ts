import fs from 'node:fs/promises';
import type { AgentTool } from '../types.ts';
import { resolveSafe } from './workspace-path.ts';

/**
 * Tool đọc file — giới hạn nghiêm ngặt trong workspaceRoot của MỘT project,
 * agent không bao giờ có quyền đọc file ngoài phạm vi đó.
 */
export function createReadFileTool(workspaceRoot: string): AgentTool {
  return {
    name: 'read_file',
    description: 'Đọc nội dung một file trong project workspace (đường dẫn tương đối).',
    run: async (relativePath: string) => {
      try {
        const target = resolveSafe(workspaceRoot, relativePath);
        return await fs.readFile(target, 'utf-8');
      } catch (err) {
        return `Lỗi khi đọc file: ${err instanceof Error ? err.message : String(err)}`;
      }
    },
  };
}
