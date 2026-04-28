import { $ } from "bun";
import os from "os";

const isWindows = os.platform() === "win32";

export async function runCMD(cmd: string) {
  if (isWindows) {
    return await $`powershell -Command ${cmd}`;
  } else {
    return await $`bash -c ${cmd}`;
  }
}
