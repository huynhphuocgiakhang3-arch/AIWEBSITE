/**
 * core/security/zip-guard.ts
 *
 * Lớp kiểm tra an toàn cho việc giải nén ZIP do người dùng upload — implement
 * trực tiếp nội dung của knowledge entry "sec-zip-slip" và "sec-file-upload-validation".
 *
 * QUAN TRỌNG: module này KHÔNG tự đọc/giải nén file ZIP thật (việc đó cần một
 * thư viện parse ZIP như adm-zip/yauzl ở tầng lib/zip.ts, phụ thuộc npm).
 * Ở đây chỉ chứa các HÀM THUẦN kiểm tra metadata của từng entry — vì vậy có
 * thể test và chạy ngay bằng node --test mà không cần cài đặt gì.
 */

import path from 'node:path';

export interface ZipEntryMeta {
  /** Tên entry như được khai báo trong ZIP, ví dụ "src/../../etc/passwd" */
  name: string;
  /** Kích thước đã giải nén (bytes) theo header khai báo trong ZIP */
  uncompressedSize: number;
  /** Kích thước nén (bytes) — dùng để tính tỉ lệ nén phát hiện zip bomb */
  compressedSize: number;
  /** true nếu entry là symlink (một số định dạng zip hỗ trợ unix symlink) */
  isSymlink?: boolean;
  isDirectory?: boolean;
}

export interface ZipGuardConfig {
  maxEntries: number;
  maxUncompressedEntrySize: number;
  maxTotalUncompressedSize: number;
  /** Tỉ lệ nén tối đa hợp lý trước khi bị coi là khả nghi zip bomb, ví dụ 100 = nén 1 byte thành 100 byte khi giải nén */
  maxCompressionRatio: number;
  allowedExtensions: string[] | null; // null = không giới hạn đuôi file
}

export const DEFAULT_ZIP_GUARD_CONFIG: ZipGuardConfig = {
  maxEntries: 5000,
  maxUncompressedEntrySize: 50 * 1024 * 1024, // 50MB / file
  maxTotalUncompressedSize: 500 * 1024 * 1024, // 500MB tổng
  maxCompressionRatio: 200,
  allowedExtensions: null,
};

export type ZipRejectionReason =
  | 'path_traversal'
  | 'absolute_path'
  | 'symlink_not_allowed'
  | 'entry_too_large'
  | 'total_size_exceeded'
  | 'too_many_entries'
  | 'suspicious_compression_ratio'
  | 'disallowed_extension'
  | 'suspicious_filename';

export interface ZipValidationResult {
  ok: boolean;
  reason?: ZipRejectionReason;
  detail?: string;
  /** Đường dẫn tuyệt đối an toàn để ghi file, chỉ có giá trị khi ok === true */
  safeDestPath?: string;
}

const SUSPICIOUS_FILENAME_PATTERNS = [
  /\.\./,          // chứa ".." ở bất kỳ đâu trong tên (sau khi tách theo path)
  /^[a-zA-Z]:\\/,  // đường dẫn tuyệt đối kiểu Windows "C:\"
  /\0/,            // null byte injection
];

/**
 * Kiểm tra một entry ZIP đơn lẻ có an toàn để giải nén vào targetDir hay không.
 * Đây là hàm THUẦN — không đọc/ghi file thật, chỉ tính toán và trả về quyết định.
 */
export function validateZipEntry(
  entry: ZipEntryMeta,
  targetDir: string,
  config: ZipGuardConfig = DEFAULT_ZIP_GUARD_CONFIG
): ZipValidationResult {
  // 1. Từ chối đường dẫn tuyệt đối khai báo trực tiếp trong tên entry
  if (path.isAbsolute(entry.name)) {
    return { ok: false, reason: 'absolute_path', detail: `Entry có đường dẫn tuyệt đối: ${entry.name}` };
  }

  for (const pattern of SUSPICIOUS_FILENAME_PATTERNS) {
    if (pattern.test(entry.name)) {
      return { ok: false, reason: 'suspicious_filename', detail: `Tên entry khả nghi: ${entry.name}` };
    }
  }

  // 2. Chuẩn hoá đường dẫn đích và kiểm tra nó có thực sự nằm trong targetDir
  //    sau khi resolve — đây là bước bắt buộc, KHÔNG được chỉ kiểm tra chuỗi thô.
  const resolvedTarget = path.resolve(targetDir);
  const resolvedDest = path.resolve(resolvedTarget, entry.name);
  const boundary = resolvedTarget.endsWith(path.sep) ? resolvedTarget : resolvedTarget + path.sep;

  if (resolvedDest !== resolvedTarget && !resolvedDest.startsWith(boundary)) {
    return {
      ok: false,
      reason: 'path_traversal',
      detail: `Entry "${entry.name}" resolve ra ngoài thư mục đích: ${resolvedDest}`,
    };
  }

  // 3. Symlink: mặc định từ chối hoàn toàn (an toàn nhất) — có thể mở rộng sau
  //    để kiểm tra target của symlink cũng nằm trong targetDir nếu thực sự cần hỗ trợ.
  if (entry.isSymlink) {
    return { ok: false, reason: 'symlink_not_allowed', detail: `Entry symlink không được hỗ trợ: ${entry.name}` };
  }

  // 4. Giới hạn kích thước từng entry
  if (entry.uncompressedSize > config.maxUncompressedEntrySize) {
    return {
      ok: false,
      reason: 'entry_too_large',
      detail: `Entry "${entry.name}" (${entry.uncompressedSize} bytes) vượt giới hạn ${config.maxUncompressedEntrySize} bytes`,
    };
  }

  // 5. Phát hiện tỉ lệ nén bất thường (dấu hiệu zip bomb)
  if (entry.compressedSize > 0) {
    const ratio = entry.uncompressedSize / entry.compressedSize;
    if (ratio > config.maxCompressionRatio) {
      return {
        ok: false,
        reason: 'suspicious_compression_ratio',
        detail: `Entry "${entry.name}" có tỉ lệ nén ${ratio.toFixed(1)}x, vượt ngưỡng ${config.maxCompressionRatio}x`,
      };
    }
  }

  // 6. Whitelist đuôi file, nếu được cấu hình
  if (config.allowedExtensions && !entry.isDirectory) {
    const ext = path.extname(entry.name).toLowerCase();
    if (!config.allowedExtensions.includes(ext)) {
      return {
        ok: false,
        reason: 'disallowed_extension',
        detail: `Đuôi file "${ext}" không nằm trong whitelist cho phép`,
      };
    }
  }

  return { ok: true, safeDestPath: resolvedDest };
}

export interface ZipArchiveValidationResult {
  ok: boolean;
  totalUncompressedSize: number;
  entryCount: number;
  /**
   * Rejection ở MỨC ARCHIVE (không gắn với một entry cụ thể nào) — ví dụ
   * quá nhiều entry, hoặc tổng dung lượng vượt giới hạn. Tách riêng khỏi
   * rejectedEntries thay vì ép một entry "đại diện" giả vào đó — tránh
   * lỗi kiểu (entries[0] có thể undefined về mặt type) và đúng bản chất
   * hơn: đây là vấn đề của TOÀN BỘ archive, không phải của MỘT entry.
   */
  archiveLevelRejection?: { reason: ZipRejectionReason; detail: string };
  rejectedEntries: Array<{ entry: ZipEntryMeta; result: ZipValidationResult }>;
  acceptedEntries: Array<{ entry: ZipEntryMeta; result: ZipValidationResult }>;
}

/**
 * Kiểm tra TOÀN BỘ archive. Theo nguyên tắc trong sec-zip-slip: nếu BẤT KỲ
 * entry nào vi phạm, toàn bộ archive bị từ chối — không âm thầm bỏ qua entry
 * xấu rồi vẫn xử lý phần còn lại, vì điều đó có thể để lọt tấn công một phần.
 */
export function validateZipArchive(
  entries: ZipEntryMeta[],
  targetDir: string,
  config: ZipGuardConfig = DEFAULT_ZIP_GUARD_CONFIG
): ZipArchiveValidationResult {
  const rejectedEntries: ZipArchiveValidationResult['rejectedEntries'] = [];
  const acceptedEntries: ZipArchiveValidationResult['acceptedEntries'] = [];

  if (entries.length > config.maxEntries) {
    return {
      ok: false,
      totalUncompressedSize: 0,
      entryCount: entries.length,
      archiveLevelRejection: {
        reason: 'too_many_entries',
        detail: `${entries.length} entries vượt giới hạn ${config.maxEntries}`,
      },
      rejectedEntries: [],
      acceptedEntries: [],
    };
  }

  let totalSize = 0;
  for (const entry of entries) {
    const result = validateZipEntry(entry, targetDir, config);
    if (result.ok) {
      acceptedEntries.push({ entry, result });
      totalSize += entry.uncompressedSize;
    } else {
      rejectedEntries.push({ entry, result });
    }
  }

  if (totalSize > config.maxTotalUncompressedSize) {
    return {
      ok: false,
      totalUncompressedSize: totalSize,
      entryCount: entries.length,
      archiveLevelRejection: {
        reason: 'total_size_exceeded',
        detail: `Tổng dung lượng giải nén ${totalSize} bytes vượt giới hạn ${config.maxTotalUncompressedSize} bytes`,
      },
      rejectedEntries,
      acceptedEntries,
    };
  }

  return {
    ok: rejectedEntries.length === 0,
    totalUncompressedSize: totalSize,
    entryCount: entries.length,
    rejectedEntries,
    acceptedEntries,
  };
}
