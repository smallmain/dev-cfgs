import lintCommitMessage from "@commitlint/lint";
import loadCommitlintConfig from "@commitlint/load";
import type { LintOptions } from "@commitlint/types";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { isCommandAvailable, runCommand } from "./command-utils.ts";

interface RawLintOptions {
  commitMessage?: string;
  file?: boolean;
  fix?: boolean;
}

const oxlintConfigFiles = [
  "oxlint.config.js",
  "oxlint.config.mjs",
  "oxlint.config.cjs",
  "oxlint.config.ts",
  ".oxlintrc.json",
  ".oxlintrc.jsonc",
];
const stylelintConfigFiles = [
  "stylelint.config.js",
  "stylelint.config.mjs",
  "stylelint.config.cjs",
  "stylelint.config.ts",
  ".stylelintrc",
  ".stylelintrc.json",
  ".stylelintrc.yaml",
  ".stylelintrc.yml",
  ".stylelintrc.js",
  ".stylelintrc.mjs",
  ".stylelintrc.cjs",
  ".stylelintrc.ts",
];
const stylelintDefaultPatterns = [
  "**/*.{css,scss,sass,less,pcss,html,vue,svelte,astro,md,mdx}",
];
const stylelintExtensions = new Set([
  ".astro",
  ".css",
  ".html",
  ".less",
  ".md",
  ".mdx",
  ".pcss",
  ".sass",
  ".scss",
  ".svelte",
  ".vue",
]);

export async function runLintCommand(files: string[], options: RawLintOptions): Promise<void> {
  const cwd = process.cwd();
  const runners = [
    await createOxlintRunner(cwd, files, options),
    await createStylelintRunner(cwd, files, options),
  ].filter((runner): runner is LintRunner => runner !== undefined);

  let exitCode = 0;

  if (options.file === true && options.commitMessage === undefined) {
    throw new Error("--file can only be used with --commit-message.");
  }

  for (const runner of runners) {
    const result = await runCommand(runner.command, runner.args, { cwd, preferLocal: true });

    if (result.code !== 0) {
      exitCode = result.code;
    }
  }

  if (options.commitMessage !== undefined && !(await lintCommitMessageOption(options))) {
    exitCode = 1;
  }

  if (exitCode !== 0) {
    process.exitCode = exitCode;
  }
}

async function lintCommitMessageOption(options: RawLintOptions): Promise<boolean> {
  const message =
    options.file === true ? await readFile(options.commitMessage ?? "", "utf8") : options.commitMessage ?? "";
  const config = await loadCommitlintConfig({ extends: ["@commitlint/config-conventional"] });
  const lintOptions: LintOptions = {
    parserOpts: config.parserPreset?.parserOpts as LintOptions["parserOpts"],
  };
  const result = await lintCommitMessage(message, config.rules, {
    parserOpts: lintOptions.parserOpts,
  });

  for (const warning of result.warnings) {
    console.warn(`commit-message warning: ${warning.message}`);
  }

  for (const error of result.errors) {
    console.error(`commit-message error: ${error.message}`);
  }

  return result.valid;
}

interface LintRunner {
  command: string;
  args: string[];
}

async function createOxlintRunner(
  cwd: string,
  files: string[],
  options: RawLintOptions,
): Promise<LintRunner | undefined> {
  if (
    !(await isCommandAvailable("oxlint", { cwd, preferLocal: true })) ||
    !(await usesTool(cwd, oxlintConfigFiles, "oxlint"))
  ) {
    return undefined;
  }

  return {
    command: "oxlint",
    args: [
      "--no-error-on-unmatched-pattern",
      ...(options.fix ? ["--fix"] : []),
      ...files,
    ],
  };
}

async function createStylelintRunner(
  cwd: string,
  files: string[],
  options: RawLintOptions,
): Promise<LintRunner | undefined> {
  if (
    !(await isCommandAvailable("stylelint", { cwd, preferLocal: true })) ||
    !(await usesTool(cwd, stylelintConfigFiles, "stylelint"))
  ) {
    return undefined;
  }

  const stylelintFiles = files.length > 0 ? files.filter(isStylelintFile) : stylelintDefaultPatterns;

  if (stylelintFiles.length === 0) {
    return undefined;
  }

  return {
    command: "stylelint",
    args: [
      "--allow-empty-input",
      ...(options.fix ? ["--fix"] : []),
      ...stylelintFiles,
    ],
  };
}

async function usesTool(cwd: string, configFiles: string[], packageJsonField: string): Promise<boolean> {
  for (const configFile of configFiles) {
    if (await fileExists(path.join(cwd, configFile))) {
      return true;
    }
  }

  try {
    const packageJson = JSON.parse(await readFile(path.join(cwd, "package.json"), "utf8")) as Record<
      string,
      unknown
    >;

    return packageJson[packageJsonField] !== undefined;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return false;
    }

    throw error;
  }
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await readFile(filePath);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return false;
    }

    throw error;
  }
}

function isStylelintFile(file: string): boolean {
  return stylelintExtensions.has(path.extname(file).toLowerCase());
}
