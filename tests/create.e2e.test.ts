import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import spawn, { SubprocessError } from "nano-spawn";
import { beforeAll, expect, test } from "vitest";

interface CommandResult {
  exitCode: number | null;
  signal: NodeJS.Signals | null;
  stdout: string;
  stderr: string;
  timedOut: boolean;
}

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cliPath = path.join(repoRoot, "dist/npm/dev/bin/sm.js");
const testTimeoutMs = 300_000;

beforeAll(async () => {
  const result = await runCommand("pnpm", ["build"], {
    cwd: repoRoot,
    timeoutMs: testTimeoutMs,
  });

  expect(result, formatCommandFailure("pnpm build", result)).toMatchObject({
    exitCode: 0,
    timedOut: false,
  });
}, testTimeoutMs);

test(
  "creates a package with the default options",
  async () => {
    const projectDir = await mkdtemp(path.join(tmpdir(), "sm-create-e2e-"));
    let passed = false;

    try {
      const result = await runCommand(process.execPath, [cliPath, "create", "--yes"], {
        cwd: projectDir,
        timeoutMs: testTimeoutMs,
      });
      const expectedName = toPackageName(path.basename(projectDir));

      expect(result, formatCommandFailure("sm create --yes", result)).toMatchObject({
        exitCode: 0,
        timedOut: false,
      });
      await expectPathExists(path.join(projectDir, "package.json"));
      await expectPathExists(path.join(projectDir, ".git/HEAD"));
      await expectPathExists(path.join(projectDir, ".vscode/settings.json"));
      await expectPathExists(path.join(projectDir, "README.md"));

      const packageJson = JSON.parse(
        await readFile(path.join(projectDir, "package.json"), "utf8"),
      ) as { name?: string };

      expect(packageJson.name).toBe(expectedName);
      expect(result.stdout).toContain(`Created ${expectedName} in `);

      passed = true;
    } finally {
      await cleanupProjectDir(projectDir, passed);
    }
  },
  testTimeoutMs,
);

async function runCommand(
  command: string,
  args: string[],
  options: { cwd: string; timeoutMs: number },
): Promise<CommandResult> {
  const abortController = new AbortController();
  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    abortController.abort();
  }, options.timeoutMs);

  try {
    const result = await spawn(command, args, {
      cwd: options.cwd,
      env: { CI: "1" },
      signal: abortController.signal,
      stdio: ["ignore", "pipe", "pipe"],
    });

    return {
      exitCode: 0,
      signal: null,
      stdout: result.stdout,
      stderr: result.stderr,
      timedOut,
    };
  } catch (error) {
    if (error instanceof SubprocessError) {
      return {
        exitCode: error.exitCode ?? null,
        signal: (error.signalName as NodeJS.Signals | undefined) ?? null,
        stdout: error.stdout,
        stderr: error.stderr,
        timedOut,
      };
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function expectPathExists(filePath: string): Promise<void> {
  await expect(stat(filePath)).resolves.toBeDefined();
}

async function cleanupProjectDir(projectDir: string, passed: boolean): Promise<void> {
  if (!passed || process.env.KEEP_TEST_TEMP === "1") {
    console.info(`Kept create e2e temp directory: ${projectDir}`);
    return;
  }

  await rm(projectDir, { force: true, recursive: true });
}

function formatCommandFailure(command: string, result: CommandResult): string {
  return [
    `${command} failed.`,
    `exitCode: ${String(result.exitCode)}`,
    `signal: ${String(result.signal)}`,
    `timedOut: ${String(result.timedOut)}`,
    "stdout:",
    result.stdout,
    "stderr:",
    result.stderr,
  ].join("\n");
}

function toPackageName(value: string): string {
  const normalizedValue = value
    .trim()
    .toLowerCase()
    .replaceAll(/[^a-z0-9._~-]+/g, "-")
    .replaceAll(/^-+|-+$/g, "");

  return normalizedValue || "my-package";
}
