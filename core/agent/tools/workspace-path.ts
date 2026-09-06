import path from 'node:path';

/**
 * Kiểm tra một đường dẫn tương đối có nằm an toàn trong workspaceRoot hay
 * không — dùng lại đúng nguyên tắc resolve+startsWith như trong
 * core/security/zip-guard.ts. KHÔNG match chuỗi thô, luôn resolve trước.
 */
export function resolveSafe(workspaceRoot: string, relativePath: string): string {
  const root = path.resolve(workspaceRoot);
  const target = path.resolve(root, relativePath);
  const boundary = root.endsWith(path.sep) ? root : root + path.sep;
  if (target !== root && !target.startsWith(boundary)) {
    throw new Error(`Đường dẫn "${relativePath}" nằm ngoài workspace cho phép.`);
  }
  return target;
}
