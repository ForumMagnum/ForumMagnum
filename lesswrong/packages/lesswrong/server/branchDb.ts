import { exec as execCB } from "child_process";
import { promisify } from "util";
import { readFile } from "fs/promises";
import { isDevelopment } from "../lib/executionEnvironment";

const exec = promisify(execCB);

export const getBranchDbName = async (): Promise<string | undefined> => {
  if (!isDevelopment) {
    return;
  }

  try {
    const {stdout, stderr} = await exec("git branch --show-current");
    if (stderr || !stdout) {
      throw new Error(`Failed to read git branch: ${stderr}`);
    }
    const gitBranch = stdout.trim();
    if (!gitBranch) {
      throw new Error("Couldn't read current git branch");
    }
    const dbName = `dev_branch_${gitBranch}`;
    const branchDbs = (await readFile("./.branchdbcache")).toString().split("\n");
    if (branchDbs.includes(dbName)) {
      return dbName;
    }
  } catch (e) {
    // Commenting out this console log because this feature is unfinished
    // eslint-disable-next-line no-console
    // console.warn("Warning loading branch dbs:", e.message, process.cwd());
  }
}
