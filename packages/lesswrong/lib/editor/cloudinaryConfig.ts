import {cloudinaryCloudNameSetting, DatabasePublicSetting} from '../publicSettings.ts'

const cloudinaryUploadPresetEditorName = 
  new DatabasePublicSetting<string | null>('cloudinary.uploadPresetEditor', null) 

export const getCloudinaryConfig = () => ({
  // Note this currently has an effect of crashing the editor if these settings are missing
  cloudinary: {
    cloudName: cloudinaryCloudNameSetting.getOrThrow(),
    uploadPreset: cloudinaryUploadPresetEditorName.getOrThrow(),
  },
})
