import { execFileSync } from "child_process";
import { createHash } from "crypto";
import { appendFileSync, cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import path from "path";
import pgp, { IConnected, IDatabase } from "pg-promise";
import type { IClient } from "pg-promise/typescript/pg-subset";

export const integrationTestTemplateDatabase = "unittest_jest_template";

const MINIPG_VERSION = "0.3";
const MINIPG_RELEASE_URL = `https://github.com/progrium/minipg/releases/download/v${MINIPG_VERSION}`;
const ALPINE_COMMUNITY_URL = "https://dl-cdn.alpinelinux.org/alpine/v3.24/community";
const PGVECTOR_APK = "postgresql-pgvector-0.8.1-r0.apk";
const PGVECTOR_APK_POSTGRES_DIR = "postgresql18";

// minipg 0.3 runs Postgres in a machine with a fixed 2 GB of memory, which holds about 39 connections. One more
// crashes a backend, and the whole server restarts into recovery. With a lower max_connections, Postgres refuses
// the connection instead. Upstream has since made the machine's memory scale with max_connections, so this and
// maxWorkers in jest.integration.config.ts can go once a release includes that.
const POSTGRES_MAX_CONNECTIONS = 32;

interface PlatformDownloads {
  minipgZip: string,
  minipgSha256: string,
  alpineArch: string,
  pgvectorSha256: string,
  rootsDirInHome: string,
}

const downloadsByPlatform: Record<string, PlatformDownloads> = {
  "darwin-arm64": {
    minipgZip: `minipg_${MINIPG_VERSION}_macos_arm64.zip`,
    minipgSha256: "b5be2016a21ef3c332fcb089c35812443f4c2b991e91af5b868a889c407ae333",
    alpineArch: "aarch64",
    pgvectorSha256: "d2aba4259936e9aa03aa22e4aff27609621a775c4a644402ce208ad1d1c3fe92",
    rootsDirInHome: "Library/Caches/minipg/roots",
  },
  "linux-x64": {
    minipgZip: `minipg_${MINIPG_VERSION}_linux_amd64.zip`,
    minipgSha256: "e0b7429a0144f6a1d6ef0b3f58541d8e0818ce0ca60417efdf7bb4541e794faa",
    alpineArch: "x86_64",
    pgvectorSha256: "74da26078ddae2e21819ac1789b3a363953050653bb2acb5a14083e822bc470b",
    rootsDirInHome: ".cache/minipg/roots",
  },
};

const repoRoot = path.resolve(__dirname, "../../..");
const cacheDir = path.join(repoRoot, "node_modules/.cache/minipg");
const minipgHome = path.join(cacheDir, "home");
const minipgBinaryDir = path.join(cacheDir, `minipg-${MINIPG_VERSION}`);
const minipgBinary = path.join(minipgBinaryDir, "minipg");

interface RunningDatabase {
  runDir: string,
  pgdbPath: string,
  db: IDatabase<{}>,
  keepaliveConnection: IConnected<{}, IClient>,
}

let runningDatabase: RunningDatabase | null = null;

function getPlatformDownloads(): PlatformDownloads {
  const platform = `${process.platform}-${process.arch}`;
  const downloads = downloadsByPlatform[platform];
  if (!downloads) {
    throw new Error(`Integration tests run their database with minipg, which isn't set up for ${platform}`);
  }
  return downloads;
}

async function downloadVerified(url: string, sha256: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: HTTP ${response.status}`);
  }
  const contents = Buffer.from(await response.arrayBuffer());
  const actualSha256 = createHash("sha256").update(contents).digest("hex");
  if (actualSha256 !== sha256) {
    throw new Error(`Checksum mismatch for ${url}: expected ${sha256}, got ${actualSha256}`);
  }
  return contents;
}

async function ensureMinipgBinary(downloads: PlatformDownloads): Promise<void> {
  if (existsSync(minipgBinary)) {
    return;
  }
  // eslint-disable-next-line no-console
  console.log(`Downloading minipg ${MINIPG_VERSION} to ${minipgBinaryDir}`);
  const zip = await downloadVerified(`${MINIPG_RELEASE_URL}/${downloads.minipgZip}`, downloads.minipgSha256);
  const stagingDir = mkdtempSync(path.join(cacheDir, "download-"));
  const zipPath = path.join(stagingDir, downloads.minipgZip);
  const unzippedDir = path.join(stagingDir, "unzipped");
  writeFileSync(zipPath, zip);
  execFileSync("unzip", ["-q", zipPath, "-d", unzippedDir], { stdio: "pipe" });
  renameSync(unzippedDir, minipgBinaryDir);
  rmSync(stagingDir, { recursive: true });
}

function runMinipg(runDir: string, args: string[]): string {
  return execFileSync(minipgBinary, args, {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: "pipe",
    // minipg unpacks its Postgres installation under HOME and offers no way to add extensions to it, so we add
    // pgvector to the unpacked files ourselves. Giving it a HOME of its own keeps that out of the per-user copy.
    env: {
      ...process.env,
      HOME: minipgHome,
      XDG_CACHE_HOME: path.join(minipgHome, ".cache"),
      XDG_STATE_HOME: path.join(minipgHome, ".local/state"),
      XDG_RUNTIME_DIR: runDir,
    },
  });
}

function getPostgresRootDir(pgdbPath: string, downloads: PlatformDownloads): string {
  const minipgToml = readFileSync(path.join(pgdbPath, "minipg.toml"), "utf8");
  const digest = minipgToml.match(/^pg\.digest = "(sha256:[0-9a-f]+)"$/m)?.[1];
  if (!digest) {
    throw new Error(`No pg.digest in ${pgdbPath}/minipg.toml`);
  }
  return path.join(minipgHome, downloads.rootsDirInHome, digest.replace(":", "-"));
}

async function ensurePgvectorInstalled(postgresRootDir: string, downloads: PlatformDownloads): Promise<void> {
  const installedLibrary = path.join(postgresRootDir, "usr/local/lib/postgresql/vector.so");
  if (existsSync(installedLibrary)) {
    return;
  }
  const apk = await downloadVerified(`${ALPINE_COMMUNITY_URL}/${downloads.alpineArch}/${PGVECTOR_APK}`, downloads.pgvectorSha256);
  const stagingDir = mkdtempSync(path.join(cacheDir, "download-"));
  const apkPath = path.join(stagingDir, PGVECTOR_APK);
  writeFileSync(apkPath, apk);
  execFileSync("tar", ["-xzf", apkPath, "-C", stagingDir, "usr"], { stdio: "pipe" });
  cpSync(
    path.join(stagingDir, "usr/share", PGVECTOR_APK_POSTGRES_DIR, "extension"),
    path.join(postgresRootDir, "usr/local/share/postgresql/extension"),
    { recursive: true },
  );
  cpSync(path.join(stagingDir, "usr/lib", PGVECTOR_APK_POSTGRES_DIR, "vector.so"), installedLibrary);
  rmSync(stagingDir, { recursive: true });
}

export async function startIntegrationTestDatabase(): Promise<void> {
  const downloads = getPlatformDownloads();
  mkdirSync(cacheDir, { recursive: true });
  await ensureMinipgBinary(downloads);

  const runDir = mkdtempSync(path.join(tmpdir(), "lw-integration-"));
  const pgdbPath = path.join(runDir, "db.pgdb");
  runMinipg(runDir, ["init", pgdbPath]);
  appendFileSync(path.join(pgdbPath, "pgdata/postgresql.conf"), `max_connections = ${POSTGRES_MAX_CONNECTIONS}\n`);
  await ensurePgvectorInstalled(getPostgresRootDir(pgdbPath, downloads), downloads);
  runMinipg(runDir, ["create", pgdbPath, integrationTestTemplateDatabase]);
  runMinipg(runDir, [
    "exec", pgdbPath, "-d", integrationTestTemplateDatabase, "--",
    "psql", "-v", "ON_ERROR_STOP=1", "-q", "-f", "schema/accepted_schema.sql",
  ]);
  const pgUrl = runMinipg(runDir, ["url", pgdbPath, "-d", "postgres"]).trim();

  // The server shuts itself down a minute after its last client disconnects. Holding a connection for the whole
  // run keeps it up through gaps between test files, and lets it exit by itself if jest is killed.
  const db = pgp()(pgUrl);
  const keepaliveConnection = await db.connect();

  runningDatabase = { runDir, pgdbPath, db, keepaliveConnection };
  process.env.PG_URL = pgUrl;
}

export async function stopIntegrationTestDatabase(): Promise<void> {
  if (!runningDatabase) {
    throw new Error("The integration test database isn't running");
  }
  const { runDir, pgdbPath, db, keepaliveConnection } = runningDatabase;
  runningDatabase = null;
  await keepaliveConnection.done();
  await db.$pool.end();
  runMinipg(runDir, ["stop", pgdbPath]);
  rmSync(runDir, { recursive: true });
}
