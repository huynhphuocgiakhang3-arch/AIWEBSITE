/**
 * lib/zip.ts
 *
 * ⚠️ CHƯA ĐƯỢC CHẠY/KIỂM CHỨNG TRONG SANDBOX PHÁT TRIỂN — module này phụ
 * thuộc gói "adm-zip" từ npm, và môi trường tạo ra source này không có
 * network access để chạy `npm install`. Logic được viết đúng theo API
 * chính thức của adm-zip và đã tái sử dụng core/security/zip-guard.ts
 * (module ĐÃ được test 13/13 pass thật), nhưng bản thân file này cần bạn
 * chạy `npm install && npm test` ở máy có mạng để xác nhận trước khi tin
 * tưởng đưa vào production. Xem docs/verification-status.md.
 *
 * Luồng xử lý đúng theo mục 17 spec gốc:
 * VALIDATE → SECURITY CHECK → SAFE EXTRACT → FILE TREE → STACK DETECTION
 */

import path from 'node:path';
import fs from 'node:fs/promises';
import AdmZip from 'adm-zip';
import { validateZipArchive, DEFAULT_ZIP_GUARD_CONFIG, type ZipEntryMeta, type ZipGuardConfig } from '../core/security/zip-guard.ts';
import { detectStack, type ProjectFile } from '../core/diagnostics/stack-detection.ts';

export interface ZipAnalysisResult {
  ok: boolean;
  rejectionSummary?: string;
  extractedFiles: string[];
  detectedStack: ReturnType<typeof detectStack>;
  totalUncompressedSize: number;
  extractDir: string;
}

/**
 * Đọc metadata TOÀN BỘ entry của một file ZIP mà KHÔNG giải nén — dùng để
 * validate trước (đúng nguyên tắc trong sec-zip-slip: kiểm tra central
 * directory trước, rẻ hơn giải nén rồi mới phát hiện vấn đề).
 */
function readZipEntryMetas(zip: AdmZip): ZipEntryMeta[] {
  return zip.getEntries().map((e) => ({
    name: e.entryName,
    uncompressedSize: e.header.size,
    compressedSize: e.header.compressedSize,
    isDirectory: e.isDirectory,
    // adm-zip không expose cờ symlink trực tiếp qua API ổn định ở mọi version —
    // coi entry có unix mode bit symlink (0xA000 trong high 16 bit) là symlink.
    isSymlink: ((e.header.attr >>> 16) & 0xa000) === 0xa000,
  }));
}

export async function analyzeAndExtractZip(
  zipBuffer: Buffer,
  extractDir: string,
  config: ZipGuardConfig = DEFAULT_ZIP_GUARD_CONFIG
): Promise<ZipAnalysisResult> {
  const zip = new AdmZip(zipBuffer);
  const entryMetas = readZipEntryMetas(zip);

  const validation = validateZipArchive(entryMetas, extractDir, config);
  if (!validation.ok) {
    const reasons = [
      validation.archiveLevelRejection
        ? `[archive] ${validation.archiveLevelRejection.detail}`
        : null,
      ...validation.rejectedEntries.map((r) => `${r.entry.name}: ${r.result.detail}`),
    ]
      .filter((r): r is string => r !== null)
      .join('; ');
    return {
      ok: false,
      rejectionSummary: `ZIP bị từ chối. Chi tiết: ${reasons}`,
      extractedFiles: [],
      detectedStack: [],
      totalUncompressedSize: 0,
      extractDir,
    };
  }

  await fs.mkdir(extractDir, { recursive: true });

  const extractedFiles: string[] = [];
  const projectFiles: ProjectFile[] = [];

  for (const zipEntry of zip.getEntries()) {
    if (zipEntry.isDirectory) continue;
    const destPath = path.resolve(extractDir, zipEntry.entryName);
    await fs.mkdir(path.dirname(destPath), { recursive: true });
    const content = zipEntry.getData();
    await fs.writeFile(destPath, content);
    extractedFiles.push(zipEntry.entryName);

    // Chỉ đọc nội dung dạng text cho các file nhỏ, cần thiết cho stack detection
    // (package.json, requirements.txt...) — tránh load toàn bộ binary vào bộ nhớ.
    const isSmallTextFile =
      content.length < 200_000 &&
      /\.(json|txt|py|toml|md)$/i.test(zipEntry.entryName);
    if (isSmallTextFile) {
      projectFiles.push({ path: zipEntry.entryName, content: content.toString('utf-8') });
    } else {
      projectFiles.push({ path: zipEntry.entryName });
    }
  }

  return {
    ok: true,
    extractedFiles,
    detectedStack: detectStack(projectFiles),
    totalUncompressedSize: validation.totalUncompressedSize,
    extractDir,
  };
}
