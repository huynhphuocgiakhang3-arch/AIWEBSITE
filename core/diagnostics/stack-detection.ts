/**
 * core/diagnostics/stack-detection.ts
 *
 * Nhận diện công nghệ của một project dựa trên các file đặc trưng và nội
 * dung package.json — heuristic MINH BẠCH (if/else rõ ràng), không phải
 * "AI đoán". Dùng cho tính năng phân tích project sau khi upload ZIP
 * (mục 17 spec gốc).
 */

export interface ProjectFile {
  path: string;
  content?: string;
}

export interface DetectedStack {
  name: string;
  confidence: 'high' | 'medium';
  evidence: string[];
}

interface PackageJsonShape {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

function parsePackageJson(files: ProjectFile[]): PackageJsonShape | null {
  const pkg = files.find((f) => f.path === 'package.json' || f.path.endsWith('/package.json'));
  if (!pkg?.content) return null;
  try {
    return JSON.parse(pkg.content);
  } catch {
    return null;
  }
}

function hasDep(pkg: PackageJsonShape | null, name: string): boolean {
  if (!pkg) return false;
  return Boolean(pkg.dependencies?.[name] || pkg.devDependencies?.[name]);
}

function hasFile(files: ProjectFile[], predicate: (p: string) => boolean): boolean {
  return files.some((f) => predicate(f.path));
}

/**
 * Phân tích danh sách file (đường dẫn, và nội dung package.json nếu có)
 * để nhận diện stack công nghệ. Trả về danh sách kèm bằng chứng cụ thể —
 * KHÔNG trả về một con số "độ chính xác AI" mơ hồ.
 */
export function detectStack(files: ProjectFile[]): DetectedStack[] {
  const results: DetectedStack[] = [];
  const pkg = parsePackageJson(files);

  if (hasDep(pkg, 'next')) {
    results.push({ name: 'Next.js', confidence: 'high', evidence: ['package.json có dependency "next"'] });
  }
  if (hasDep(pkg, 'react') && !hasDep(pkg, 'next')) {
    results.push({ name: 'React', confidence: 'high', evidence: ['package.json có dependency "react"'] });
  }
  if (hasDep(pkg, 'vue')) {
    results.push({ name: 'Vue', confidence: 'high', evidence: ['package.json có dependency "vue"'] });
  }
  if (hasDep(pkg, 'vite')) {
    results.push({ name: 'Vite', confidence: 'medium', evidence: ['package.json có devDependency "vite"'] });
  }
  if (hasDep(pkg, 'express')) {
    results.push({ name: 'Express', confidence: 'high', evidence: ['package.json có dependency "express"'] });
  }
  if (hasDep(pkg, '@prisma/client') || hasFile(files, (p) => p.endsWith('schema.prisma'))) {
    results.push({ name: 'Prisma', confidence: 'high', evidence: ['Tìm thấy schema.prisma hoặc dependency @prisma/client'] });
  }
  if (hasFile(files, (p) => p.endsWith('requirements.txt'))) {
    results.push({ name: 'Python', confidence: 'medium', evidence: ['Tìm thấy requirements.txt'] });
  }
  if (hasFile(files, (p) => p.endsWith('manage.py'))) {
    results.push({ name: 'Django', confidence: 'high', evidence: ['Tìm thấy manage.py'] });
  }
  if (hasFile(files, (p) => /(^|\/)main\.py$/.test(p)) && hasFile(files, (p) => p.endsWith('requirements.txt'))) {
    results.push({ name: 'FastAPI (có thể)', confidence: 'medium', evidence: ['Tìm thấy main.py cùng requirements.txt — cần kiểm tra thêm import fastapi để chắc chắn'] });
  }
  if (hasFile(files, (p) => p.endsWith('composer.json'))) {
    results.push({ name: 'PHP', confidence: 'medium', evidence: ['Tìm thấy composer.json'] });
  }
  if (hasFile(files, (p) => p.endsWith('artisan'))) {
    results.push({ name: 'Laravel', confidence: 'high', evidence: ['Tìm thấy file artisan'] });
  }
  if (hasFile(files, (p) => p.endsWith('.html')) && !pkg && results.length === 0) {
    results.push({ name: 'HTML/CSS/JS tĩnh', confidence: 'medium', evidence: ['Có file .html, không tìm thấy package.json hay framework backend nào'] });
  }

  return results;
}
