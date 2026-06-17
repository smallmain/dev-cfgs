import { spawn } from "node:child_process";
import path from "node:path";
import { rootDir } from "./build.js";

function normalizeArgs(args) {
  const normalizedArgs = args[0] === "--" ? args.slice(1) : args;
  return normalizedArgs.length === 0 ? ["--help"] : normalizedArgs;
}

function getCliCwd() {
  return process.env.INIT_CWD || process.cwd();
}

function runCli(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ["--experimental-strip-types", path.join(rootDir, "src/index.ts"), ...args], {
      cwd: getCliCwd(),
      stdio: "inherit",
    });

    child.on("error", reject);
    child.on("exit", code => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`sm exited with code ${code}.`));
    });
  });
}

await runCli(normalizeArgs(process.argv.slice(2)));
