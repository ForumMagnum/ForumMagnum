import { DatabaseServerSetting } from '../databaseSettings';
import { PublicInstanceSetting } from '../../lib/instanceSettings';

// Found in CkEditor Dashboard -- https://dashboard.ckeditor.com/
const ckEditorEnvironmentIdSetting = new DatabaseServerSetting<string | null>('ckEditor.environmentId', null)

// Found in CkEditor Dashboard>Environment>Access credentials>Create new access key
const ckEditorSecretKeySetting = new DatabaseServerSetting<string | null>('ckEditor.secretKey', null)

// Found in CkEditor Dashboard>Environment>API Configuration>API base URL
const ckEditorApiPrefixSetting = new DatabaseServerSetting<string | null>('ckEditor.apiPrefix', null)

// Found in CkEditor Dashboard>Environment>API Configuration>API secret
const ckEditorApiSecretKeySetting = new DatabaseServerSetting<string | null>('ckEditor.apiSecretKey', null)

// For development, there's a matched set of CkEditor settings as instance
// settings, which take precedence over the database settings. This allows
// using custom CkEditor settings that don't match what's in the attached
// database.

const ckEditorEnvironmentIdOverrideSetting = new PublicInstanceSetting<string | null>('ckEditorOverride.environmentId', null, "optional")
const ckEditorSecretKeyOverrideSetting = new PublicInstanceSetting<string | null>('ckEditorOverride.secretKey', null, "optional")
const ckEditorApiPrefixOverrideSetting = new PublicInstanceSetting<string | null>('ckEditorOverride.apiPrefix', null, "optional")
const ckEditorApiSecretKeyOverrideSetting = new PublicInstanceSetting<string | null>('ckEditorOverride.apiSecretKey', null, "optional")

export const getCkEditorEnvironmentId = () => ckEditorEnvironmentIdOverrideSetting.get() || ckEditorEnvironmentIdSetting.get();
export const getCkEditorSecretKey = () => ckEditorSecretKeyOverrideSetting.get() || ckEditorSecretKeySetting.get();
export const getCkEditorApiPrefix = () => ckEditorApiPrefixOverrideSetting.get() || ckEditorApiPrefixSetting.get();
export const getCkEditorApiSecretKey = () => ckEditorApiSecretKeyOverrideSetting.get() || ckEditorApiSecretKeySetting.get();
