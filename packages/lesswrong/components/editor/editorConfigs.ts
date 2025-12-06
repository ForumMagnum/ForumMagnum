import type { EditorConfig } from '@ckeditor/ckeditor5-core';
//import type { EditorConfig } from "../../../../ckEditor/src/augmentation";

function getCkEditorLicenseKey() {
  // We're running locally, rather than in a deployment environment, so we always need to use the dev key.
  if (!process.env.VERCEL_DEPLOYMENT_ID) {
    const devLicenseKey = process.env.NEXT_PUBLIC_CKEDITOR_DEV_LICENSE_KEY;
    if (!devLicenseKey) {
      console.warn('NEXT_PUBLIC_CKEDITOR_DEV_LICENSE_KEY is not set');
      return 'GPL';
    }
    return devLicenseKey;
  }
  
  const licenseKey = process.env.NEXT_PUBLIC_CKEDITOR_LICENSE_KEY;
  if (!licenseKey) {
    console.warn('NEXT_PUBLIC_CKEDITOR_LICENSE_KEY is not set');
    return 'GPL';
  }
  return licenseKey;
}

export type WrappedEditorConfig = EditorConfig & {
  licenseKey: string
};

/**
 * Editor configurations that are outside the CkEditor webpack part of the
 * build. When you use the <CKEditor> component you _must_ use this function
 * to construct your config, since it's what adds the license key.
 *
 * For configuration that happens _inside_ the CkEditor bundle (which has an
 * extra compile step), see ckEditor/src/editorConfigs.ts.
 */
export function makeEditorConfig(config: any): any {
  return {
    ...config,
    licenseKey: getCkEditorLicenseKey(),
  };
}

