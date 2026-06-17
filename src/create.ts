import { chmod, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { checkbox, input, select } from "@inquirer/prompts";
import {
  getAuthor,
  getDependencyVersion,
  packageRootDir,
  type PackageJson,
} from "./package-info.ts";

interface RawCreateOptions {
  yes?: boolean;
  name?: string;
  description?: string;
  zhName?: string;
  zhDescription?: string;
  githubOwner?: string;
  githubRepo?: string;
  authorName?: string;
  authorEmail?: string;
  authorUrl?: string;
  licenseYear?: string;
  stack?: string[];
  preset?: string;
  component?: string[];
}

interface CreateContext {
  packageName: string;
  displayName: string;
  description: string;
  zhName: string;
  zhDescription: string;
  githubOwner: string;
  githubRepo: string;
  authorName: string;
  authorEmail: string;
  authorUrl: string;
  licenseYear: string;
  stacks: string[];
  webPreset: string;
  webComponents: string[];
}

type TemplateValues = Record<string, string>;

const commonTemplateDir = path.join(packageRootDir, "templates/common");
const commonConfigDir = path.join(packageRootDir, "configs/common");
const webNpmPackageTemplateDir = path.join(packageRootDir, "templates/web/npm-package");

const supportedStacks = new Set(["web"]);
const supportedWebPresets = new Set(["npm-package"]);
const supportedWebComponents = new Set(["css"]);
const defaultDevEngines = {
  packageManager: {
    name: "pnpm",
    version: "^11.5.3",
    onFail: "download",
  },
};

export async function runCreateCommand(
  options: RawCreateOptions,
  packageJson: PackageJson,
): Promise<void> {
  const context = await resolveCreateContext(options, packageJson);
  const targetDir = process.cwd();

  await renderTemplateDirectory(
    commonTemplateDir,
    targetDir,
    createTemplateValues(context, packageJson),
  );
  await renderTemplateDirectory(
    commonConfigDir,
    targetDir,
    createTemplateValues(context, packageJson),
  );
  await renderTemplateDirectory(
    webNpmPackageTemplateDir,
    targetDir,
    createTemplateValues(context, packageJson),
  );
  await writeJson(
    path.join(targetDir, "package.json"),
    createProjectPackageJson(context, packageJson),
  );
  await writePreCommitHook(targetDir, context);
  await writeVsCodeConfig(targetDir, context);

  if (context.webComponents.includes("css")) {
    await writeFile(
      path.join(targetDir, "stylelint.config.ts"),
      'import type { Config } from "stylelint";\n\nexport default {\n  extends: "@smallmains/dev/stylelint/generic.js",\n} satisfies Config;\n',
    );
  }

  console.log(`Created ${context.packageName} in ${targetDir}`);
  console.log("Next steps: pnpm install && pnpm run lint");
}

async function resolveCreateContext(
  options: RawCreateOptions,
  packageJson: PackageJson,
): Promise<CreateContext> {
  const yes = options.yes === true;
  const cwdName = path.basename(process.cwd());
  const defaultPackageName = toPackageName(cwdName);
  const packageName = await resolveText(options.name, "Package name", defaultPackageName, yes);
  const displayName = toDisplayName(packageName);
  const description = await resolveText(
    options.description,
    "English description",
    "Description.",
    yes,
  );
  const zhName = await resolveText(options.zhName, "中文名称", displayName, yes);
  const zhDescription = await resolveText(options.zhDescription, "中文描述", "描述。", yes);
  const githubOwner = await resolveText(options.githubOwner, "GitHub owner", "smallmain", yes);
  const githubRepo = await resolveText(
    options.githubRepo,
    "GitHub repository",
    toRepoName(packageName),
    yes,
  );
  const author = getAuthor(packageJson);
  const authorName = await resolveText(options.authorName, "Author name", author.name, yes);
  const authorEmail = await resolveText(options.authorEmail, "Author email", author.email, yes);
  const authorUrl = await resolveText(options.authorUrl, "Author URL", author.url, yes);
  const licenseYear = await resolveText(
    options.licenseYear,
    "License year",
    String(new Date().getFullYear()),
    yes,
  );
  const stacks = await resolveStacks(options.stack, yes);

  if (!stacks.includes("web")) {
    throw new Error("At least one supported stack is required. Currently only web is supported.");
  }

  const webPreset = await resolveWebPreset(options.preset, yes);
  const webComponents = await resolveWebComponents(options.component, yes);

  return {
    packageName,
    displayName,
    description,
    zhName,
    zhDescription,
    githubOwner,
    githubRepo,
    authorName,
    authorEmail,
    authorUrl,
    licenseYear,
    stacks,
    webPreset,
    webComponents,
  };
}

async function resolveText(
  value: string | undefined,
  message: string,
  defaultValue: string,
  yes: boolean,
): Promise<string> {
  if (value !== undefined) {
    return value;
  }

  if (yes) {
    return defaultValue;
  }

  return input({
    message,
    default: defaultValue,
    validate: answer => answer.trim().length > 0 || "Value is required.",
  });
}

async function resolveStacks(stackOptions: string[] | undefined, yes: boolean): Promise<string[]> {
  const stacks = normalizeOptions(stackOptions);

  if (stacks.length > 0) {
    validateOptions(stacks, supportedStacks, "stack");
    return stacks;
  }

  if (yes) {
    return ["web"];
  }

  return checkbox({
    message: "Select tech stacks",
    required: true,
    choices: [
      {
        name: "Web",
        value: "web",
        checked: true,
      },
    ],
  });
}

async function resolveWebPreset(preset: string | undefined, yes: boolean): Promise<string> {
  if (preset) {
    validateOptions([preset], supportedWebPresets, "web preset");
    return preset;
  }

  if (yes) {
    return "npm-package";
  }

  return select({
    message: "Select Web preset",
    choices: [
      {
        name: "npm package",
        value: "npm-package",
      },
    ],
  });
}

async function resolveWebComponents(
  componentOptions: string[] | undefined,
  yes: boolean,
): Promise<string[]> {
  const components = normalizeOptions(componentOptions);

  if (components.length > 0) {
    validateOptions(components, supportedWebComponents, "web component");
    return components;
  }

  if (yes) {
    return [];
  }

  return checkbox({
    message: "Select Web components",
    choices: [
      {
        name: "css (Stylelint)",
        value: "css",
        checked: false,
      },
    ],
  });
}

function normalizeOptions(values: string[] | undefined): string[] {
  return [
    ...new Set(
      (values ?? [])
        .flatMap(value => value.split(","))
        .map(value => value.trim())
        .filter(Boolean),
    ),
  ];
}

function validateOptions(values: string[], supportedValues: Set<string>, label: string): void {
  const unsupportedValues = values.filter(value => !supportedValues.has(value));

  if (unsupportedValues.length > 0) {
    throw new Error(`Unsupported ${label}: ${unsupportedValues.join(", ")}.`);
  }
}

function createProjectPackageJson(context: CreateContext, packageJson: PackageJson): unknown {
  const scripts: Record<string, string> = {
    lint: "oxlint",
    "lint:fix": "oxlint --fix",
    prepare: "husky",
  };

  if (context.webComponents.includes("css")) {
    scripts.lint = "oxlint && pnpm run lint:style";
    scripts["lint:fix"] = "oxlint --fix && pnpm run lint:style:fix";
    scripts["lint:style"] =
      'stylelint "**/*.{css,scss,sass,less,pcss,html,vue,svelte,astro,md,mdx}"';
    scripts["lint:style:fix"] =
      'stylelint "**/*.{css,scss,sass,less,pcss,html,vue,svelte,astro,md,mdx}" --fix';
  }

  const devDependencies: Record<string, string> = {
    "@smallmains/dev": createDevPackageVersion(packageJson),
    husky: getDependencyVersion(packageJson, "husky"),
    "lint-staged.sh": getDependencyVersion(packageJson, "lint-staged.sh"),
    oxfmt: getDependencyVersion(packageJson, "oxfmt"),
    oxlint: getDependencyVersion(packageJson, "oxlint"),
    "oxlint-tsgolint": getDependencyVersion(packageJson, "oxlint-tsgolint"),
    typescript: getDependencyVersion(packageJson, "typescript"),
  };

  if (context.webComponents.includes("css")) {
    devDependencies.stylelint = getDependencyVersion(packageJson, "stylelint");
  }

  return {
    name: context.packageName,
    version: "1.0.0",
    description: context.description,
    homepage: `https://github.com/${context.githubOwner}/${context.githubRepo}#readme`,
    bugs: {
      url: `https://github.com/${context.githubOwner}/${context.githubRepo}/issues`,
    },
    license: "MIT",
    author: {
      name: context.authorName,
      email: context.authorEmail,
      url: context.authorUrl,
    },
    repository: {
      type: "git",
      url: `git+https://github.com/${context.githubOwner}/${context.githubRepo}.git`,
    },
    funding: "https://github.com/sponsors/smallmain",
    publishConfig: {
      access: "public",
    },
    scripts,
    devDependencies,
    devEngines: packageJson.devEngines ?? defaultDevEngines,
  };
}

function createTemplateValues(context: CreateContext, packageJson: PackageJson): TemplateValues {
  return {
    packageName: context.packageName,
    displayName: context.displayName,
    description: context.description,
    zhName: context.zhName,
    zhDescription: context.zhDescription,
    githubOwner: context.githubOwner,
    githubRepo: context.githubRepo,
    authorName: context.authorName,
    authorEmail: context.authorEmail,
    authorUrl: context.authorUrl,
    licenseYear: context.licenseYear,
    devPackageVersion: packageJson.version ?? "0.0.0",
    oxfmtVersion: stripVersionRange(getDependencyVersion(packageJson, "oxfmt")),
    oxlintVersion: stripVersionRange(getDependencyVersion(packageJson, "oxlint")),
  };
}

async function renderTemplateDirectory(
  sourceDir: string,
  targetDir: string,
  values: TemplateValues,
): Promise<void> {
  const entries = await readdir(sourceDir, { withFileTypes: true });

  await mkdir(targetDir, { recursive: true });

  for (const entry of entries) {
    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, resolveTemplateOutputName(entry.name));

    if (entry.isDirectory()) {
      await renderTemplateDirectory(sourcePath, targetPath, values);
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    const content = renderTemplate(await readFile(sourcePath, "utf8"), values);
    await mkdir(path.dirname(targetPath), { recursive: true });
    await writeFile(targetPath, content);

    if (targetPath.endsWith(path.join(".husky", "pre-commit"))) {
      await chmod(targetPath, 0o755);
    }
  }
}

function renderTemplate(content: string, values: TemplateValues): string {
  let renderedContent = content;

  for (const [key, value] of Object.entries(values)) {
    renderedContent = renderedContent.replaceAll(`{{${key}}}`, value);
  }

  return renderedContent;
}

function resolveTemplateOutputName(name: string): string {
  return name.endsWith(".tmpl") ? name.slice(0, -".tmpl".length) : name;
}

async function writePreCommitHook(targetDir: string, context: CreateContext): Promise<void> {
  const lines = [
    'lint-staged.sh "pnpm run lint" "*.js" "*.jsx" "*.mjs" "*.cjs" "*.ts" "*.tsx" "*.mts" "*.cts"',
  ];

  if (context.webComponents.includes("css")) {
    lines.push(
      'lint-staged.sh "pnpm run lint:style" "*.css" "*.scss" "*.sass" "*.less" "*.pcss" "*.html" "*.vue" "*.svelte" "*.astro" "*.md" "*.mdx"',
    );
  }

  const hookPath = path.join(targetDir, ".husky/pre-commit");
  await mkdir(path.dirname(hookPath), { recursive: true });
  await writeFile(hookPath, `${lines.join("\n")}\n`);
  await chmod(hookPath, 0o755);
}

async function writeVsCodeConfig(targetDir: string, context: CreateContext): Promise<void> {
  const settings: Record<string, unknown> = {
    "[javascript][typescript][javascriptreact][typescriptreact]": {
      "editor.defaultFormatter": "oxc.oxc-vscode",
    },
    "[markdown][mdx]": {
      "editor.defaultFormatter": "oxc.oxc-vscode",
    },
    "[json][jsonc][jsonl][snippets][yaml]": {
      "editor.defaultFormatter": "oxc.oxc-vscode",
    },
  };
  const recommendations = ["editorconfig.editorconfig", "oxc.oxc-vscode"];

  if (context.webComponents.includes("css")) {
    settings["[html][css][scss][less]"] = {
      "editor.defaultFormatter": "oxc.oxc-vscode",
    };
    settings["[vue]"] = {
      "editor.defaultFormatter": "oxc.oxc-vscode",
    };
    settings["stylelint.validate"] = [
      "css",
      "postcss",
      "html",
      "vue",
      "svelte",
      "astro",
      "markdown",
      "mdx",
    ];
    recommendations.push("stylelint.vscode-stylelint");
  }

  const vscodeDir = path.join(targetDir, ".vscode");
  await mkdir(vscodeDir, { recursive: true });
  await writeJson(path.join(vscodeDir, "settings.json"), settings);
  await writeJson(path.join(vscodeDir, "extensions.json"), { recommendations });
}

async function writeJson(filePath: string, value: unknown): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function toPackageName(value: string): string {
  const normalizedValue = value
    .trim()
    .toLowerCase()
    .replaceAll(/[^a-z0-9._~-]+/g, "-")
    .replaceAll(/^-+|-+$/g, "");

  return normalizedValue || "my-package";
}

function toRepoName(packageName: string): string {
  return packageName.split("/").at(-1) ?? packageName;
}

function toDisplayName(packageName: string): string {
  return toRepoName(packageName)
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map(word => `${word.slice(0, 1).toUpperCase()}${word.slice(1)}`)
    .join(" ");
}

function createDevPackageVersion(packageJson: PackageJson): string {
  return packageJson.version ? `^${packageJson.version}` : "latest";
}

function stripVersionRange(version: string): string {
  return version.replace(/^[~^]/, "");
}
