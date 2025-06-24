import { DatabaseServerSetting } from '../databaseSettings';
import { ckEditorApiPrefixOverrideSetting, ckEditorApiSecretKeyOverrideSetting, ckEditorEnvironmentIdOverrideSetting, ckEditorSecretKeyOverrideSetting } from '../../lib/instanceSettings';

// Found in CkEditor Dashboard -- https://dashboard.ckeditor.com/
const ckEditorEnvironmentIdSetting = new DatabaseServerSetting<string | null>('ckEditor.environmentId', null)

// Found in CkEditor Dashboard>Environment>Access credentials>Create new access key
const ckEditorSecretKeySetting = new DatabaseServerSetting<string | null>('ckEditor.secretKey', null)

// Found in CkEditor Dashboard>Environment>API Configuration>API base URL
const ckEditorApiPrefixSetting = new DatabaseServerSetting<string | null>('ckEditor.apiPrefix', null)

// Found in CkEditor Dashboard>Environment>API Configuration>API secret
const ckEditorApiSecretKeySetting = new DatabaseServerSetting<string | null>('ckEditor.apiSecretKey', null)

export const getCkEditorEnvironmentId = () => ckEditorEnvironmentIdOverrideSetting.get() || ckEditorEnvironmentIdSetting.get();
export const getCkEditorSecretKey = () => ckEditorSecretKeyOverrideSetting.get() || ckEditorSecretKeySetting.get();
export const getCkEditorApiPrefix = () => ckEditorApiPrefixOverrideSetting.get() || ckEditorApiPrefixSetting.get();
export const getCkEditorApiSecretKey = () => ckEditorApiSecretKeyOverrideSetting.get() || ckEditorApiSecretKeySetting.get();
