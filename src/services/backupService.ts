import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

export async function createBackup(profileId: string, filePath: string): Promise<string> {
  const filename = path.basename(filePath);
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupDir = path.join(os.homedir(), ".mcmod-manager", "backups", profileId);
  await fs.mkdir(backupDir, { recursive: true });
  const destination = path.join(backupDir, `${timestamp}_${filename}`);
  await fs.copyFile(filePath, destination);
  return destination;
}
