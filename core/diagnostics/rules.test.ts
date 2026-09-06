import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyzeFile, summarize, analyzeFiles } from './rules.ts';

test('analyzeFile: detects @ts-ignore', () => {
  const issues = analyzeFile('src/foo.ts', 'const x: number = getValue();\n// @ts-ignore\nconst y: string = x;\n');
  assert.ok(issues.some((i) => i.ruleId === 'no-ts-ignore'));
  const issue = issues.find((i) => i.ruleId === 'no-ts-ignore')!;
  assert.equal(issue.line, 2);
  assert.equal(issue.severity, 'error');
});

test('analyzeFile: detects explicit any (both ": any" and "as any")', () => {
  const issues = analyzeFile('src/foo.ts', 'function f(x: any) {}\nconst y = (data as any).value;\n');
  const anyIssues = issues.filter((i) => i.ruleId === 'no-explicit-any');
  assert.equal(anyIssues.length, 2);
});

test('analyzeFile: detects non-null assertion but not != operator (no false positive)', () => {
  const issues = analyzeFile('src/foo.ts', 'const el = document.getElementById("x")!;\nif (a != b) { doThing(); }\n');
  const nnIssues = issues.filter((i) => i.ruleId === 'no-non-null-assertion');
  assert.equal(nnIssues.length, 1);
  assert.equal(nnIssues[0].line, 1);
});

test('analyzeFile: does not flag rules outside applicable extensions', () => {
  // no-ts-ignore chỉ áp dụng cho .ts/.tsx, không áp dụng cho .md
  const issues = analyzeFile('README.md', '// @ts-ignore this is just documentation text');
  assert.equal(issues.some((i) => i.ruleId === 'no-ts-ignore'), false);
});

test('analyzeFile: detects TODO/FIXME markers', () => {
  const issues = analyzeFile('src/foo.ts', '// TODO: refactor this later\nfunction ok() {}\n');
  assert.ok(issues.some((i) => i.ruleId === 'todo-fixme-marker'));
});

test('analyzeFile: detects hardcoded secret pattern but not env-based usage', () => {
  const badFile = analyzeFile('src/config.ts', 'const apiKey = "sk-abcdefghijklmnopqrstuvwx";\n');
  const goodFile = analyzeFile('src/config.ts', 'const apiKey = process.env.ANTHROPIC_API_KEY;\n');
  assert.ok(badFile.some((i) => i.ruleId === 'hardcoded-secret-pattern'));
  assert.equal(goodFile.some((i) => i.ruleId === 'hardcoded-secret-pattern'), false);
});

test('analyzeFile: detects unguarded extractAllTo call', () => {
  const issues = analyzeFile('lib/zip.ts', 'zip.extractAllTo(targetDir, true);\n');
  assert.ok(issues.some((i) => i.ruleId === 'extract-all-without-validation'));
});

test('analyzeFile: clean file produces zero issues (no false positives on healthy code)', () => {
  const clean = `
export function add(a: number, b: number): number {
  return a + b;
}
`;
  const issues = analyzeFile('src/math.ts', clean);
  assert.equal(issues.length, 0);
});

test('summarize: real counts, not fabricated', () => {
  const issues = analyzeFile('src/foo.ts', '// @ts-ignore\nconst x: any = 1;\nconst y: any = 2;\n');
  const summary = summarize(issues);
  assert.equal(summary.totalIssues, 3);
  assert.equal(summary.bySeverity.error, 1);
  assert.equal(summary.bySeverity.warning, 2);
  assert.equal(summary.byRule['no-explicit-any'], 2);
});

test('analyzeFiles: aggregates across multiple files', () => {
  const issues = analyzeFiles([
    { path: 'a.ts', content: 'const x: any = 1;' },
    { path: 'b.ts', content: '// @ts-ignore\nconst y = 1;' },
  ]);
  assert.equal(issues.length, 2);
});
