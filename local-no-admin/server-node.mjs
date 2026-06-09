import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const server = path.join(__dirname, "server.py");

const candidates = [
  process.env.PYTHON,
  "python",
  "py",
].filter(Boolean);

function start() {
  const env = {
    ...process.env,
    HOST: process.env.HOST ?? "0.0.0.0",
    PORT: process.env.PORT ?? "5173",
    NO_BROWSER: process.env.NO_BROWSER ?? "1",
  };

  const command = candidates.shift();
  if (!command) {
    console.error("Python nao encontrado. Instale Python 3.12 ou defina a variavel PYTHON.");
    process.exit(1);
  }

  const args = command === "py" ? ["-3", server] : [server];
  const child = spawn(command, args, {
    cwd: root,
    env,
    stdio: "inherit",
    windowsHide: true,
  });

  child.on("error", () => {
    start();
  });

  child.on("exit", (code, signal) => {
    if (signal) process.exit(1);
    process.exit(code ?? 0);
  });
}

if (!existsSync(server)) {
  console.error(`Servidor Python nao encontrado: ${server}`);
  process.exit(1);
}

start();
