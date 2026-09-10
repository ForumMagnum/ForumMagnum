export const getCkEditorEnvironmentId = () => process.env.private_ckEditorOverride_environmentId || (process.env.private_ckEditor_environmentId ?? null);
export const getCkEditorSecretKey = () => process.env.private_ckEditorOverride_secretKey || (process.env.private_ckEditor_secretKey ?? null);
export const getCkEditorApiPrefix = () => process.env.private_ckEditorOverride_apiPrefix || (process.env.private_ckEditor_apiPrefix ?? null);
export const getCkEditorApiSecretKey = () => process.env.private_ckEditorOverride_apiSecretKey || (process.env.private_ckEditor_apiSecretKey ?? null);
