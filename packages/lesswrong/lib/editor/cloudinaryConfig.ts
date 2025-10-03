import { cloudinaryCloudNameSetting, cloudinaryUploadPresetEditorName } from '../instanceSettings';
import type { CloudinaryCkEditorPluginConfig } from '../../../../ckEditor/src/cloudinary';

export const cloudinaryConfig: {cloudinary: CloudinaryCkEditorPluginConfig} = {
  cloudinary: {
    getCloudName: () => {
      const cloudName = cloudinaryCloudNameSetting.get();
      if (cloudName === undefined || cloudName === null) {
        throw new Error('Cloudinary cloud name is not set');
      }
      return cloudName;
    },
    getUploadPreset: () => {
      const uploadPreset = cloudinaryUploadPresetEditorName.get();
      if (uploadPreset === undefined || uploadPreset === null) {
        throw new Error('Cloudinary upload preset is not set');
      }
      return uploadPreset;
    },
  },
}
