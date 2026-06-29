import spawn, { SubprocessError } from "nano-spawn";

export interface SpawnResult {
  code: number;
  signal: NodeJS.Signals | null;
}

interface CommandOptions {
  cwd?: string;
  preferLocal?: boolean;
}

interface RunCommandOptions extends CommandOptions {
  stdio?: "ignore" | "inherit";
}

interface ReadCommandOutputOptions extends CommandOptions {
  stderr?: "ignore" | "inherit";
}

export async function isCommandAvailable(
  command: string,
  options: CommandOptions = {},
): Promise<boolean> {
  try {
    await spawn(command, ["--version"], {
      cwd: options.cwd,
      preferLocal: options.preferLocal,
      stdio: "ignore",
    });
    return true;
  } catch (error) {
    return getSpawnResult(error) !== undefined;
  }
}

export async function runCommand(
  command: string,
  args: string[],
  options: RunCommandOptions = {},
): Promise<SpawnResult> {
  try {
    await spawn(command, args, {
      cwd: options.cwd,
      preferLocal: options.preferLocal,
      stdio: options.stdio ?? "inherit",
    });

    return { code: 0, signal: null };
  } catch (error) {
    const result = getSpawnResult(error);

    if (result) {
      return result;
    }

    throw error;
  }
}

export async function runCommandOrThrow(
  command: string,
  args: string[],
  options: RunCommandOptions = {},
): Promise<void> {
  const result = await runCommand(command, args, options);

  if (result.code !== 0) {
    throw new Error(`${command} ${args.join(" ")} exited with code ${result.code}.`);
  }
}

export async function commandSucceeds(
  command: string,
  args: string[],
  options: CommandOptions = {},
): Promise<boolean> {
  try {
    const result = await runCommand(command, args, {
      ...options,
      stdio: "ignore",
    });

    return result.code === 0;
  } catch {
    return false;
  }
}

export async function readCommandOutput(
  command: string,
  args: string[],
  options: ReadCommandOutputOptions = {},
): Promise<string> {
  try {
    const result = await spawn(command, args, {
      cwd: options.cwd,
      preferLocal: options.preferLocal,
      stdio: ["ignore", "pipe", options.stderr ?? "inherit"],
    });

    return result.stdout;
  } catch (error) {
    const result = getSpawnResult(error);

    if (result) {
      throw new Error(`${command} ${args.join(" ")} exited with code ${result.code}.`);
    }

    throw error;
  }
}

function getSpawnResult(error: unknown): SpawnResult | undefined {
  if (!(error instanceof SubprocessError)) {
    return undefined;
  }

  if (error.exitCode === undefined && error.signalName === undefined) {
    return undefined;
  }

  return {
    code: error.exitCode ?? 1,
    signal: (error.signalName as NodeJS.Signals | undefined) ?? null,
  };
}
