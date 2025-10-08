/**
 * Usage: yarn migrate up|down|pending|executed [dev|staging|prod] [forumType]
 *
 * If no environment is specified, you can use the environment variables PG_URL
 * and SETTINGS_FILE
 */
import { exec } from 'child_process';
import { promisify } from 'util';
import { loadCkEditorUploadEnv } from "./scripts/runWithVercelEnv";
import { initConsole } from "./packages/lesswrong/server/serverStartup";

const execAsync = promisify(exec);

const initGlobals = (isProd: boolean) => {
  // @ts-ignore
  global.bundleIsServer = true;
  // @ts-ignore
  global.bundleIsTest = false;
  // @ts-ignore
  global.bundleIsIntegrationTest = false;
  // @ts-ignore
  global.bundleIsCodegen = false;
  // @ts-ignore
  global.bundleIsE2E = false;
  // @ts-ignore
  global.bundleIsProduction = isProd;
  // @ts-ignore
  global.bundleIsMigrations = true;
  // @ts-ignore
  global.enableVite = false;
  // @ts-ignore
  global.defaultSiteAbsoluteUrl = "";
}

const fetchImports = async () => {
  const { ckEditorApi: { checkEditorBundle, uploadEditorBundle } } = await import('./packages/lesswrong/server/ckEditor/ckEditorApi');
  const { ckEditorBundleVersion } = await import('./packages/lesswrong/lib/wrapCkEditor')

  return { ckEditorBundleVersion, checkEditorBundle, uploadEditorBundle };
}

(async () => {
  const { environment } = await loadCkEditorUploadEnv();

  initGlobals(environment === "prod");
  initConsole();

  const { ckEditorBundleVersion, checkEditorBundle, uploadEditorBundle } = await fetchImports();

  let exitCode = 0;

  try {
    const { exists } = await checkEditorBundle(ckEditorBundleVersion);
    if (!exists) {
      console.log(`ckEditor bundle version ${ckEditorBundleVersion} not yet uploaded; building now`);
      await execAsync(`cd ckEditor && yarn && yarn build`);
      await uploadEditorBundle(ckEditorBundleVersion);
    }
  } catch (e) {
    console.error("An error occurred while checking, building, or uploading the ckEditor bundle version:", e);
    exitCode = 1;
  }

  process.exit(exitCode);
})();
