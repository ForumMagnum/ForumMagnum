import {cloudinaryCloudNameSetting, DatabasePublicSetting} from '../publicSettings'

const cloudinaryUploadPresetEditorName =
  new DatabasePublicSetting<string | null>('cloudinary.uploadPresetEditor', null)

export const cloudinaryConfig = {
  cloudinary: {
    getCloudName: cloudinaryCloudNameSetting.getOrThrow,
    getUploadPreset: cloudinaryUploadPresetEditorName.getOrThrow,
  },
}
