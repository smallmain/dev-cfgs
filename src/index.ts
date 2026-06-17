import { Command } from "commander";
import { runCreateCommand } from "./create.ts";
import { readPackageJson } from "./package-info.ts";

function collectOption(value: string, previousValues: string[]): string[] {
  return [...previousValues, value];
}

async function main(): Promise<void> {
  const packageJson = await readPackageJson();
  const program = new Command();

  program
    .name("sm")
    .description("SmallMain development scaffolding CLI.")
    .version(packageJson.version ?? "0.0.0");

  program
    .command("create")
    .description("Create a project in the current working directory.")
    .option("-y, --yes", "Use defaults and skip prompts.")
    .option("--name <name>", "Package name.")
    .option("--description <description>", "English description.")
    .option("--zh-name <name>", "Chinese display name.")
    .option("--zh-description <description>", "Chinese description.")
    .option("--github-owner <owner>", "GitHub repository owner.")
    .option("--github-repo <repo>", "GitHub repository name.")
    .option("--author-name <name>", "Author name.")
    .option("--author-email <email>", "Author email.")
    .option("--author-url <url>", "Author URL.")
    .option("--license-year <year>", "License year.")
    .option("--stack <stack>", "Tech stack. Repeat or use commas for multiple values.", collectOption, [])
    .option("--preset <preset>", "Web preset. Currently supports npm-package.")
    .option("--component <component>", "Web component. Repeat or use commas for multiple values.", collectOption, [])
    .action(options => runCreateCommand(options, packageJson));

  program
    .command("lint")
    .description("Reserved command; not implemented yet.")
    .action(() => {
      console.log("sm lint is reserved and not implemented yet.");
    });

  await program.parseAsync();
}

try {
  await main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}