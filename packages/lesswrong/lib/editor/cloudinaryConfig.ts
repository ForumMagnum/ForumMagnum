import { cloudinaryCloudNameSetting, cloudinaryUploadPresetEditorName } from '../instanceSettings';
import type { CloudinaryCkEditorPluginConfig } from '../../../../ckEditor/src/cloudinary';

export const cloudinaryConfig: {cloudinary: CloudinaryCkEditorPluginConfig} = {
  cloudinary: {
    getCloudName: cloudinaryCloudNameSetting.getOrThrow,
    getUploadPreset: cloudinaryUploadPresetEditorName.getOrThrow,
  },
}
