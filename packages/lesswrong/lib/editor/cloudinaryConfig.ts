import {cloudinaryCloudNameSetting, DatabasePublicSetting} from '../publicSettings'
import type { CloudinaryCkEditorPluginConfig } from '../../../../ckEditor/src/cloudinary';

const cloudinaryUploadPresetEditorName =
  new DatabasePublicSetting<string | null>('cloudinary.uploadPresetEditor', null)

export const cloudinaryConfig: {cloudinary: CloudinaryCkEditorPluginConfig} = {
  cloudinary: {
    getCloudName: cloudinaryCloudNameSetting.getOrThrow,
    getUploadPreset: cloudinaryUploadPresetEditorName.getOrThrow,
  },
}
