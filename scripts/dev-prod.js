import path from "node:path";
import spawn from "nano-spawn";
import { buildPackageFiles, outDir } from "./build.js";

function normalizeArgs(args) {
  const normalizedArgs = args[0] === "--" ? args.slice(1) : args;
  return normalizedArgs.length === 0 ? ["--help"] : normalizedArgs;
}

function getCliCwd() {
  return process.env.INIT_CWD || process.cwd();
}

async function runCli(args) {
  await spawn(process.execPath, [path.join(outDir, "bin/sm.js"), ...args], {
    cwd: getCliCwd(),
    stdio: "inherit",
  });
}

await buildPackageFiles();
await runCli(normalizeArgs(process.argv.slice(2)));
