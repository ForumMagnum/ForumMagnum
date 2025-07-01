import { cloudinaryCloudNameSetting, cloudinaryUploadPresetEditorName } from '../publicSettings'
import type { CloudinaryCkEditorPluginConfig } from '../../../../ckEditor/src/cloudinary';

export const cloudinaryConfig: {cloudinary: CloudinaryCkEditorPluginConfig} = {
  cloudinary: {
    getCloudName: cloudinaryCloudNameSetting.getOrThrow,
    getUploadPreset: cloudinaryUploadPresetEditorName.getOrThrow,
  },
}
