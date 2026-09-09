import { cloudinaryCloudNameSetting, cloudinaryUploadPresetEditorName } from '../instanceSettings';
import type { CloudinaryCkEditorPluginConfig } from '../../../../ckEditor/src/cloudinary';
import type { ForumTypeString } from '../instanceSettings';

function getCloudName(forumType: ForumTypeString): string {
  const cloudName = cloudinaryCloudNameSetting.get(forumType);
  if (cloudName === undefined || cloudName === null) {
    throw new Error('Cloudinary cloud name is not set');
  }
  return cloudName;
}

function getUploadPreset(forumType: ForumTypeString): string {
  const uploadPreset = cloudinaryUploadPresetEditorName.get(forumType);
  if (uploadPreset === undefined || uploadPreset === null) {
    throw new Error('Cloudinary upload preset is not set');
  }
  return uploadPreset;
}

export function getCloudinaryConfig(forumType: ForumTypeString): {cloudinary: CloudinaryCkEditorPluginConfig} {
  return {
    cloudinary: {
      getCloudName: getCloudName.bind(null, forumType),
      getUploadPreset: getUploadPreset.bind(null, forumType),
    },
  };
}
