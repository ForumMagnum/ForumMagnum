import { readFileSync } from "fs";
import { writeFile } from "fs/promises";
import { promisify } from "util";
import { exec as execSync } from "child_process";

const helpMessage = `
branchdb - create temporary dev databases for git branches \uD83C\uDF3F
Usage:
  yarn branchdb create  create a new database for the current git branch
  yarn branchdb drop    drop the dev database created for the current git branch
  yarn branchdb clean   drop all branch dbs created by this git clone
  yarn branchdb list    list current branch dbs created by this git clone
  yarn branchdb help    show this help message
`;

const exec = promisify(execSync);

const paths = {
  cachePath: "./.branchdbcache",
  pgUrlPath: "../ForumCredentials/dev-staging-admin-pg-conn.txt",
} as const;

const getGitBranchName = async (): Promise<string> => {
  const {stdout, stderr} = await exec("git branch --show-current");
  if (stderr) {
    throw new Error("Error reading git branch name");
  }
  if (!stdout) {
    throw new Error("Failed to read current git branch");
  }
  return stdout.trim();
}

class BranchDbCache {
  private dbs: string[] = [];

  constructor() {
    try {
      const data = readFileSync(paths.cachePath).toString().trim();
      this.dbs = data.split("\n").map((db: string) => db.trim());
    } catch {
      this.dbs = [];
    }
  }

  count(): number {
    return this.dbs.length;
  }

  getDbNames(): string[] {
    return this.dbs;
  }

  has(db: string): boolean {
    return this.dbs.includes(db);
  }

  assertHas(db: string): void {
    if (!this.has(db)) {
      throw new Error(`Branch DB '${db}' doesn't exist`);
    }
  }

  assertNotHas(db: string): void {
    if (this.has(db)) {
      throw new Error(`Branch DB '${db}' already exists`);
    }
  }

  async save(): Promise<void> {
    const data = this.dbs.join("\n");
    await writeFile(paths.cachePath, data);
  }

  add(db: string): void {
    if (!this.has(db)) {
      this.dbs.push(db);
    }
  }

  remove(db: string): void {
    this.dbs = this.dbs.filter((item) => item !== db);
  }

  addAndSave(db: string): Promise<void> {
    this.add(db);
    return this.save();
  }

  removeAndSave(db: string): Promise<void> {
    this.remove(db);
    return this.save();
  }
}

class BranchDbBuilder {
  private static readonly PREFIX = "dev_branch_";

  private silent: boolean;
  private cache: BranchDbCache;
  private pgUrl: string;
  private templateDbName: string;

  constructor() {
    this.silent = false;
    this.cache = new BranchDbCache();
    this.pgUrl = readFileSync(paths.pgUrlPath).toString().trim();
    if (!this.pgUrl) {
      throw new Error("Missing Postgres URL");
    }
    // TODO: For now this is hard coded for the EA forum - work out a nice
    // way to make this generic (read from settings-dev.json maybe?).
    this.templateDbName = "eaforum_dev_replica";
  }

  private log(...args: any[]): void {
    if (!this.silent) {
      console.log(...args);
    }
  }

  private async makeCurrentBranchName(): Promise<string> {
    const gitBranch = await getGitBranchName();
    return BranchDbBuilder.PREFIX + gitBranch;
  }

  private buildCreateSql(branchDbName: string): string {
    return `CREATE DATABASE "${branchDbName}" TEMPLATE "${this.templateDbName}";`;
  }

  private buildDropSql(branchDbName: string): string {
    return `DROP DATABASE "${branchDbName}";`;
  }

  private async executeSql(sql: string): Promise<string> {
    this.log(`Executing SQL: ${sql}`);
    const command = `psql ${this.pgUrl} -c '${sql}'`;
    const {stdout, stderr} = await exec(command);
    if (stderr) {
      throw new Error(`Failed to execute sql '${sql}': ${stderr}`);
    }
    return stdout;
  }

  private async createDb(dbName: string): Promise<void> {
    const sql = this.buildCreateSql(dbName);
    await this.executeSql(sql);
    await this.cache.addAndSave(dbName);
  }

  private async dropDb(dbName: string): Promise<void> {
    const sql = this.buildDropSql(dbName);
    await this.executeSql(sql);
    await this.cache.removeAndSave(dbName);
  }

  private async handleCreate(): Promise<void> {
    const branchDbName = await this.makeCurrentBranchName();
    this.cache.assertNotHas(branchDbName);
    await this.createDb(branchDbName);
  }

  private async handleDrop(): Promise<void> {
    const branchDbName = await this.makeCurrentBranchName();
    this.cache.assertHas(branchDbName);
    await this.dropDb(branchDbName);
  }

  private async handleClean(): Promise<void> {
    await Promise.all(this.cache.getDbNames().map(this.dropDb.bind(this)));
  }

  private handleList(): void {
    const count = this.cache.count();
    this.log(`Found ${count} cached dev-branch database${count === 1 ? "" : "s"}:`);
    for (const db of this.cache.getDbNames()) {
      this.log(` - ${db}`);
    }
  }

  async runCommand(command: string): Promise<void> {
    switch (command) {
      case "create":
        await this.handleCreate();
        break;
      case "drop":
        await this.handleDrop();
        break;
      case "clean":
        await this.handleClean();
        break;
      case "list":
        this.handleList();
        break;
      case "help":
        this.log(helpMessage);
        break;
      default:
        throw new Error(`Invalid command: '${command}'`);
    }
  }
}

(async () => {
  try {
    await new BranchDbBuilder().runCommand(process.argv[2] ?? "");
  } catch (e) {
    console.error("Error:", e.message);
    process.exit(1);
  }
})();
