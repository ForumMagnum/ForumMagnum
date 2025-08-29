import { ckEditorEnvironmentIdSetting, ckEditorSecretKeySetting, ckEditorApiPrefixSetting, ckEditorApiSecretKeySetting } from '../databaseSettings';
import { ckEditorApiPrefixOverrideSetting, ckEditorApiSecretKeyOverrideSetting, ckEditorEnvironmentIdOverrideSetting, ckEditorSecretKeyOverrideSetting } from '../../lib/instanceSettings';


export const getCkEditorEnvironmentId = () => ckEditorEnvironmentIdOverrideSetting.get() || ckEditorEnvironmentIdSetting.get();
export const getCkEditorSecretKey = () => ckEditorSecretKeyOverrideSetting.get() || ckEditorSecretKeySetting.get();
export const getCkEditorApiPrefix = () => ckEditorApiPrefixOverrideSetting.get() || ckEditorApiPrefixSetting.get();
export const getCkEditorApiSecretKey = () => ckEditorApiSecretKeyOverrideSetting.get() || ckEditorApiSecretKeySetting.get();
