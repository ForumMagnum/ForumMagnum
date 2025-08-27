import { forumTypeSetting } from "@/lib/forumTypeUtils";
import { PublicInstanceSetting } from "@/lib/instanceSettings";
import fs from "fs";
import path from "path";

jest.mock('../lib/forumTypeUtils', () => {
  const originalModule = jest.requireActual('../lib/forumTypeUtils');
  return {
    __esModule: true,
    ...originalModule,
    forumTypeSetting: {
      get: jest.fn(() => { throw new Error('forumTypeSetting should never be called at import-time!'); }),
    },
    isLW: jest.fn(() => { throw new Error('isLW should never be called at import-time!'); }),
    isAF: jest.fn(() => { throw new Error('isAF should never be called at import-time!'); }),
    isEAForum: jest.fn(() => { throw new Error('isEAForum should never be called at import-time!'); }),
    isLWorAF: jest.fn(() => { throw new Error('isLWorAF should never be called at import-time!'); }),
    forumSelect: jest.fn(() => { throw new Error('forumSelect should never be called at import-time!'); }),
  };
});

function enumerateFiles(dirPath: string): string[] {
  let fileList: string[] = [];
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      fileList = fileList.concat(enumerateFiles(fullPath));
    } else if (entry.isFile()) {
      fileList.push(fullPath);
    }
  }

  return fileList;
}

async function importAllProjectFiles() {
  const projectFilesEntrypoints = enumerateFiles('app/').filter(path => path.endsWith('.ts') || path.endsWith('.tsx'));
  for (const file of projectFilesEntrypoints) {
    await import('../../../' + file);
  }
}

beforeAll(async () => {
  jest.spyOn(PublicInstanceSetting.prototype, 'get').mockImplementation(() => {
    throw new Error('PublicInstanceSetting.get() should never be called at import-time!');
  });
});

describe('forumTypeUtils', () => {
  it('should not be called at import-time', async () => {
    await importAllProjectFiles();
    expect(forumTypeSetting.get).not.toHaveBeenCalled();
  });
});
