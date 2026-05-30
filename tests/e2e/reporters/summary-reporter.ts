/**
 * Custom reporter — emits `playwright-report/SUMMARY.md` after the run.
 *
 * Specs annotate each test with priority (P0/P1/P2/P3) and an optional
 * suggestedFix file:line. Example inside a test:
 *
 *   test('sign-in redirects', async ({ page }, testInfo) => {
 *     testInfo.annotations.push({ type: 'priority', description: 'P0' });
 *     testInfo.annotations.push({
 *       type: 'suggestedFix',
 *       description: 'app/[locale]/(auth)/sign-in/page.tsx:392 — onAuthStateChange wiring',
 *     });
 *     ...
 *   });
 */
import * as fs from 'fs';
import * as path from 'path';
import type {
  Reporter, TestCase, TestResult, FullResult, Suite,
} from '@playwright/test/reporter';

type Priority = 'P0' | 'P1' | 'P2' | 'P3';

interface FailureEntry {
  priority: Priority;
  title: string;
  spec: string;
  durationMs: number;
  suggestedFix?: string;
  errorSummary: string;
  attachments: string[];
}

function pickAnnotation(test: TestCase, type: string): string | undefined {
  return test.annotations.find((a) => a.type === type)?.description;
}

function isPriority(s: string | undefined): s is Priority {
  return s === 'P0' || s === 'P1' || s === 'P2' || s === 'P3';
}

export default class SummaryReporter implements Reporter {
  private allTests: { test: TestCase; result: TestResult }[] = [];

  onTestEnd(test: TestCase, result: TestResult): void {
    this.allTests.push({ test, result });
  }

  onEnd(result: FullResult): void {
    const total = this.allTests.length;
    const failed = this.allTests.filter((t) => t.result.status === 'failed' || t.result.status === 'timedOut');
    const flaky = this.allTests.filter((t) => t.result.status === 'passed' && t.result.retry > 0);
    const passed = this.allTests.filter((t) => t.result.status === 'passed').length;
    const skipped = this.allTests.filter((t) => t.result.status === 'skipped').length;

    const byPriority: Record<Priority, FailureEntry[]> = { P0: [], P1: [], P2: [], P3: [] };

    for (const { test, result } of failed) {
      const pri = isPriority(pickAnnotation(test, 'priority')) ? (pickAnnotation(test, 'priority') as Priority) : 'P2';
      const entry: FailureEntry = {
        priority: pri,
        title: test.title,
        spec: this.relSpecPath(test),
        durationMs: result.duration,
        suggestedFix: pickAnnotation(test, 'suggestedFix'),
        errorSummary: this.firstErrorLine(result),
        attachments: result.attachments.map((a) => a.path ?? a.name).filter(Boolean) as string[],
      };
      byPriority[pri].push(entry);
    }

    const slowest = [...this.allTests]
      .sort((a, b) => b.result.duration - a.result.duration)
      .slice(0, 5);

    const lines: string[] = [];
    const dt = new Date().toISOString().replace('T', ' ').slice(0, 19);
    lines.push(`# E2E Run — ${dt} UTC`);
    lines.push('');
    lines.push(
      `Total: ${total} | Pass: ${passed} | Fail: ${failed.length} | Flaky: ${flaky.length} | Skipped: ${skipped} | Overall: **${result.status}**`,
    );
    lines.push('');
    lines.push('## Failures by priority');
    lines.push('');
    for (const pri of ['P0', 'P1', 'P2', 'P3'] as Priority[]) {
      const entries = byPriority[pri];
      const heading: Record<Priority, string> = {
        P0: '### P0 — must fix before deploy',
        P1: '### P1 — high (block deploy after triage)',
        P2: '### P2 — medium',
        P3: '### P3 — cosmetic',
      };
      lines.push(heading[pri]);
      if (!entries.length) {
        lines.push('_(none)_');
        lines.push('');
        continue;
      }
      for (const e of entries) {
        lines.push(`- **[${e.spec}]** ${e.title}`);
        lines.push(`  - Error: \`${e.errorSummary}\``);
        if (e.suggestedFix) lines.push(`  - Fix: ${e.suggestedFix}`);
        if (e.attachments.length) {
          lines.push(`  - Artifacts: ${e.attachments.map((a) => path.relative(process.cwd(), a)).join(', ')}`);
        }
      }
      lines.push('');
    }

    if (flaky.length) {
      lines.push('## Flaky (passed after retry)');
      for (const { test, result } of flaky) {
        lines.push(`- [${this.relSpecPath(test)}] ${test.title} — passed on retry ${result.retry}`);
      }
      lines.push('');
    }

    lines.push('## Slowest 5');
    for (const { test, result } of slowest) {
      lines.push(`- ${(result.duration / 1000).toFixed(1)}s — [${this.relSpecPath(test)}] ${test.title}`);
    }
    lines.push('');

    const outDir = path.join(process.cwd(), 'playwright-report');
    try { fs.mkdirSync(outDir, { recursive: true }); } catch {}
    fs.writeFileSync(path.join(outDir, 'SUMMARY.md'), lines.join('\n'), 'utf8');
    // eslint-disable-next-line no-console
    console.log(`\n[summary-reporter] wrote ${path.join('playwright-report', 'SUMMARY.md')}`);
  }

  private relSpecPath(test: TestCase): string {
    const file = test.location.file;
    return path.relative(process.cwd(), file).replace(/\\/g, '/');
  }

  private firstErrorLine(result: TestResult): string {
    const err = result.error ?? result.errors[0];
    if (!err) return result.status;
    const msg = (err.message ?? '').split('\n')[0];
    return msg.replace(/\[[0-9;]*m/g, '').slice(0, 240);
  }
}

// Walk the suite tree (not actually needed for SummaryReporter but useful if extended)
function _walkTests(suite: Suite, cb: (t: TestCase) => void): void {
  for (const s of suite.suites) _walkTests(s, cb);
  for (const t of suite.tests) cb(t);
}
