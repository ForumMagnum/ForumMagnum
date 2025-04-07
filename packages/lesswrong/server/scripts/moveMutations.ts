import { getAllCollections, getCollection } from "../collections/allCollections";
import { join } from "path";
import { writeFile } from "fs/promises";
import { searchIndexedCollectionNamesSet } from "@/lib/search/searchUtil";
import { getCollectionHooks } from "../mutationCallbacks";
import { getSchema } from "@/lib/schema/allSchemas";
import { getEditableFieldNamesForCollection } from "@/lib/editor/make_editable";
import { collectionNameToGraphQLType } from "@/lib/vulcan-lib/collections";
import { allUserGroups } from "@/lib/permissions";
import { collectionNameToTypeName } from "@/lib/generated/collectionTypeNames";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "../vulcan-lib/apollo-server/graphqlTemplates";

const getPermissionsImportLine = (collection: CollectionBase<CollectionNameString>) => {
  const createPermissionCheckSection = getCreatePermissionCheckSection(collection);
  const updatePermissionCheckSection = getUpdatePermissionCheckSection(collection);
  const importsUserIsAdmin = createPermissionCheckSection.includes('userIsAdmin') || updatePermissionCheckSection.includes('userIsAdmin');
  const importsUserCanDo = createPermissionCheckSection.includes('userCanDo') || updatePermissionCheckSection.includes('userCanDo');
  const importsUserOwns = createPermissionCheckSection.includes('userOwns') || updatePermissionCheckSection.includes('userOwns');
  
  if (!importsUserIsAdmin && !importsUserCanDo && !importsUserOwns) {
    return '';
  }

  const importArray: string[] = [];
  if (importsUserIsAdmin) {
    importArray.push('userIsAdmin');
  }
  if (importsUserCanDo) {
    importArray.push('userCanDo');
  }
  if (importsUserOwns) {
    importArray.push('userOwns');
  }

  return `\nimport { ${importArray.join(', ')} } from "@/lib/vulcan-users/permissions";`;
}

const getGraphqlFieldsImportLine = (creatableFields: string, updatableFields: string) => {
  const importArray: string[] = [];
  if (!creatableFields && !updatableFields) {
    return '';
  }

  if (creatableFields.length > 0) {
    importArray.push('getCreatableGraphQLFields');
  }

  if (updatableFields.length > 0) {
    importArray.push('getUpdatableGraphQLFields');
  }

  return `\nimport { ${importArray.join(', ')} } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";`;
}

const sharedImportsSection = (
  hasEditableFields: boolean,
  hasLogChanges: boolean,
  hasSlug: boolean,
  collection: CollectionBase<CollectionNameString>,
  creatableFields: string,
  updatableFields: string,
) => {
  const collectionName = collection.collectionName;
  const collectionPathPart = collectionName[0].toLowerCase() + collectionName.slice(1);
  const elasticCollection = searchIndexedCollectionNamesSet.has(collectionName);
  
  const isElasticEnableLine = elasticCollection ? `\nimport { isElasticEnabled } from "@/lib/instanceSettings";` : '';
  const permissionsImportLine = getPermissionsImportLine(collection);
  const hasEditableFieldsLine = hasEditableFields ? `\nimport { runCreateAfterEditableCallbacks, runCreateBeforeEditableCallbacks, runEditAsyncEditableCallbacks, runNewAsyncEditableCallbacks, runUpdateAfterEditableCallbacks, runUpdateBeforeEditableCallbacks } from "@/server/editor/make_editable_callbacks";` : '';
  const logChangesLine = hasLogChanges ? `\nimport { logFieldChanges } from "@/server/fieldChanges";` : '';
  const elasticSyncLine = elasticCollection ? `\nimport { elasticSyncDocument } from "@/server/search/elastic/elasticCallbacks";` : '';
  const slugLine = hasSlug ? `\nimport { runSlugCreateBeforeCallback, runSlugUpdateBeforeCallback } from "@/server/utils/slugUtil";` : '';
  const graphqlFieldsLine = getGraphqlFieldsImportLine(creatableFields, updatableFields);
  const gqlTagLine = graphqlFieldsLine ? `\nimport gql from "graphql-tag";` : '';
  const cloneDeepLine = hasLogChanges ? `\nimport cloneDeep from "lodash/cloneDeep";` : '';
  
  return `
import schema from "@/lib/collections/${collectionPathPart}/newSchema";${isElasticEnableLine}
import { accessFilterSingle } from "@/lib/utils/schemaUtils";${permissionsImportLine}
import { runCountOfReferenceCallbacks } from "@/server/callbacks/countOfReferenceCallbacks";${hasEditableFieldsLine}${logChangesLine}
import { getDefaultMutationFunctions } from "@/server/resolvers/defaultMutations";${elasticSyncLine}${slugLine}${graphqlFieldsLine}
import { checkCreatePermissionsAndReturnProps, checkUpdatePermissionsAndReturnProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument } from "@/server/vulcan-lib/mutators";
import { dataToModifier } from "@/server/vulcan-lib/validation";${gqlTagLine}
import clone from "lodash/clone";${cloneDeepLine}
`
};

const getCreateActionName = (collectionName: CollectionNameString) => `${collectionNameToGraphQLType(collectionName).toLowerCase()}.create`;
const getNewActionName = (collectionName: CollectionNameString) => `${collectionName.toLowerCase()}.new`;

const defaultNewCheckSection = (collectionName: CollectionNameString) => `
function newCheck(user: DbUser | null, document: Partial<DbInsertion<Db${collectionNameToTypeName[collectionName]}>> | null, context: ResolverContext) {
  return userCanDo(user, [
    '${getCreateActionName(collectionName)}',
    '${getNewActionName(collectionName)}',
  ]);
}`;

const allActions = new Set(allUserGroups.flatMap(group => group.actions));

const getCreatePermissionCheckSection = (collection: CollectionBase<CollectionNameString>) => {
  // if (collection.options.mutations?.options?.newCheck) {
    // return '// Collection has custom newCheck';
  // }

  const collectionName = collection.collectionName;

  const createActionName = getCreateActionName(collectionName);
  const newActionName = getNewActionName(collectionName);

  if (allActions.has(createActionName) || allActions.has(newActionName)) {
    return defaultNewCheckSection(collectionName);
  }

  const typeName = collectionNameToTypeName[collectionName];

  return `\nfunction newCheck(user: DbUser | null, document: Partial<DbInsertion<Db${typeName}>> | null, context: ResolverContext) {
  return userIsAdmin(user);
}`;
};

const getUpdateOwnActionName = (collectionName: CollectionNameString) => `${collectionNameToGraphQLType(collectionName).toLowerCase()}.update.own`;
const getEditOwnActionName = (collectionName: CollectionNameString) => `${collectionName.toLowerCase()}.edit.own`;

const getUpdateAllActionName = (collectionName: CollectionNameString) => `${collectionNameToGraphQLType(collectionName).toLowerCase()}.update.all`;
const getEditAllActionName = (collectionName: CollectionNameString) => `${collectionName.toLowerCase()}.edit.all`;

const getUpdatePermissionCheckSection = (collection: CollectionBase<CollectionNameString>) => {
  // if (collection.options.mutations?.options?.editCheck) {
    // return '// Collection has custom editCheck';
  // }

  const collectionName = collection.collectionName;
  const typeName = collectionNameToTypeName[collectionName];

  const updateOwnActionName = getUpdateOwnActionName(collectionName);
  const editOwnActionName = getEditOwnActionName(collectionName);
  const updateAllActionName = getUpdateAllActionName(collectionName);
  const editAllActionName = getEditAllActionName(collectionName);

  const keepUserCanDo = allActions.has(updateOwnActionName)
    || allActions.has(editOwnActionName)
    || allActions.has(updateAllActionName)
    || allActions.has(editAllActionName);

  const defaultPermissionCheckSection = keepUserCanDo
    ? `return userOwns(user, document as HasUserIdType)
    ? userCanDo(user, [
      '${updateOwnActionName}',
      '${editOwnActionName}',
    ])
    : userCanDo(user, [
      '${updateAllActionName}',
      '${editAllActionName}',
    ]);`
    : `return userIsAdmin(user);`;

  return `function editCheck(user: DbUser | null, document: Db${typeName} | null, context: ResolverContext) {
  if (!user || !document) return false;
${keepUserCanDo ? `\n  // If we have legacy action permissions defined
  // for this collection, check if user can perform
  // the current action based on whether they own the
  // document or not.  Otherwise, check if user is an
  // admin.
` : ''}  ${defaultPermissionCheckSection}
}
`;
};

const openingSection = (collectionName: CollectionNameString) => `
const { createFunction, updateFunction } = getDefaultMutationFunctions('${collectionName}', {
  createFunction: async ({ data }: Create${collectionNameToTypeName[collectionName]}Input, context, skipValidation?: boolean) => {
    const { currentUser } = context;

    const callbackProps = await checkCreatePermissionsAndReturnProps('${collectionName}', {
      context,
      data,
      schema,
      skipValidation,
    });

    data = callbackProps.document;
`;

const slugCreateBeforeSection = `
    data = await runSlugCreateBeforeCallback(callbackProps);
`;

const createBeforeEditableSection = `
    data = await runCreateBeforeEditableCallbacks({
      doc: data,
      props: callbackProps,
    });
`;

const insertIntoDbSection = (collectionName: string) => `
    const afterCreateProperties = await insertAndReturnCreateAfterProps(data, '${collectionName}', callbackProps);
    let documentWithId = afterCreateProperties.document;
`;

const createAfterEditableSection = `
    documentWithId = await updateRevisionsDocumentIds({
      newDoc: documentWithId,
      props: afterCreateProperties,
    });

    documentWithId = await notifyUsersOfPingbackMentions({
      newDoc: documentWithId,
      props: afterCreateProperties,
    });
`;

const createRunCountOfReferenceCallbacksSection = (collectionName: string) => `
    await runCountOfReferenceCallbacks({
      collectionName: '${collectionName}',
      newDocument: documentWithId,
      callbackStage: 'createAfter',
      afterCreateProperties,
    });
`;

const createElasticSyncSection = (collectionName: string) => `
    if (isElasticEnabled) {
      void elasticSyncDocument('${collectionName}', documentWithId._id);
    }
`;

const newAsyncEditableSection = `
    await runNewAsyncEditableCallbacks({
      newDoc: documentWithId,
      props: asyncProperties,
    });
`;

const createReturnValueSection = `
    return documentWithId;
  },
`;

const updateFunctionOpeningSection = (collectionName: CollectionNameString, collection: CollectionBase<CollectionNameString>, needsOldDocument: boolean) => {
  const typeName = collectionNameToTypeName[collectionName];
  return `
  updateFunction: async ({ selector, data }, context, skipValidation?: boolean) => {
    const { currentUser, ${collectionName} } = context;
${collection.options.logChanges ? `
    // Save the original mutation (before callbacks add more changes to it) for
    // logging in FieldChanges
    const origData = cloneDeep(data);\n` : ''}
    const {
      documentSelector: ${typeName.toLowerCase()}Selector,
      previewDocument, 
      updateCallbackProperties,
    } = await checkUpdatePermissionsAndReturnProps('${collectionName}', { selector, context, data, schema, skipValidation });
${needsOldDocument ? `\n    const { oldDocument } = updateCallbackProperties;\n` : ''}`
};

const slugUpdateBeforeSection = `
    data = await runSlugUpdateBeforeCallback(updateCallbackProperties);
`;

const updateBeforeEditableSection = `
    data = await runUpdateBeforeEditableCallbacks({
      docData: data,
      props: updateCallbackProperties,
    });
`;

const editDbSection = (collectionName: CollectionNameString) => {
  const typeName = collectionNameToTypeName[collectionName];
  return `
    // This cast technically isn't safe but it's implicitly been there since the original updateMutator logic
    // The only difference could be in the case where there's no update (due to an empty modifier) and
    // we're left with the previewDocument, which could have EditableFieldInsertion values for its editable fields
    let updatedDocument = await updateAndReturnDocument(modifier, ${collectionName}, ${typeName.toLowerCase()}Selector, context) ?? previewDocument as Db${typeName};
`
};

const updateAfterEditableSection = `
    updatedDocument = await runUpdateAfterEditableCallbacks({
      newDoc: updatedDocument,
      props: updateCallbackProperties,
    });
`;

const updateRunCountOfReferenceCallbacksSection = (collectionName: string) => `
    await runCountOfReferenceCallbacks({
      collectionName: '${collectionName}',
      newDocument: updatedDocument,
      callbackStage: "updateAfter",
      updateAfterProperties: updateCallbackProperties,
    });
`;

const runEditAsyncEditableCallbacksSection = `
    await runEditAsyncEditableCallbacks({
      newDoc: updatedDocument,
      props: updateCallbackProperties,
    });
`;

const updateElasticSyncSection = (collectionName: string) => `
    if (isElasticEnabled) {
      void elasticSyncDocument('${collectionName}', updatedDocument._id);
    }
`;

const logFieldChangesSection = (collectionName: string) => `
    void logFieldChanges({ currentUser, collection: ${collectionName}, oldDocument, data: origData });
`;

const updateReturnValueSection = `
    return updatedDocument;
  },
});
`;

const exportFunctionsSection = (collectionName: CollectionNameString) => `export { createFunction as create${collectionNameToTypeName[collectionName]}, updateFunction as update${collectionNameToTypeName[collectionName]} };`;

const exportGraphQLFieldsSection = (
  collectionName: CollectionNameString,
  creatableFields: string,
  updatableFields: string,
) => {
  const typeName = collectionNameToTypeName[collectionName];

  const createInputType = creatableFields.length > 0 ? `input Create${typeName}Input {
    data: {
      \${getCreatableGraphQLFields(schema, '      ')}
    }
  }` : '';

  const updateInputType = updatableFields.length > 0 ? `
  input Update${typeName}Input {
    selector: SelectorInput
    data: {
      \${getUpdatableGraphQLFields(schema, '      ')}
    }
  }` : '';

  const mutationTypes = (createInputType || updateInputType) ? `
  extend type Mutation {
    ${createInputType ? `create${typeName}(input: Create${typeName}Input!): ${typeName}` : ''}
    ${updateInputType ? `update${typeName}(input: Update${typeName}Input!): ${typeName}` : ''}
  }` : '';

  return `
export const graphql${typeName}TypeDefs = gql\`
  ${createInputType}
  ${updateInputType}
  ${mutationTypes}
\`;
`;

};

const callbackSectionMarker = (callbackStage: string) => `
    // ****************************************************
    // TODO: add missing ${callbackStage} callbacks here!!!
    // ****************************************************
`;

function generateMutationFunctions(collectionName: CollectionNameString) {
  const collectionHooks = getCollectionHooks(collectionName);
  const collection = getCollection(collectionName);
  const schema = getSchema(collectionName);
  const editableFields = getEditableFieldNamesForCollection(collectionName);
  const collectionHasElasticSync = searchIndexedCollectionNamesSet.has(collectionName);

  const hasEditableFields = editableFields.length > 0;
  const hasLogChanges = !!collection.options.logChanges;
  const hasSlug = !!schema.slug?.graphql && 'slugCallbackOptions' in schema.slug.graphql;
  const creatableFields = getCreatableGraphQLFields(schema, '      ');
  const updatableFields = getUpdatableGraphQLFields(schema, '      ');

  const sb: string[] = [];

  sb.push(sharedImportsSection(hasEditableFields, hasLogChanges, hasSlug, collection, creatableFields, updatableFields));

  sb.push('\n')
  sb.push(getCreatePermissionCheckSection(collection));
  sb.push('\n\n');
  sb.push(getUpdatePermissionCheckSection(collection));
  sb.push('\n');

  sb.push(openingSection(collectionName));

  if (collectionHooks.createValidate.any()) {
    sb.push(callbackSectionMarker('createValidate'));
  }

  sb.push(`\n    data = await runFieldOnCreateCallbacks(schema, data, callbackProps);\n`);
  
  if (hasSlug) {
    sb.push(slugCreateBeforeSection);
  }

  if (collectionHooks.createBefore.any()) {
    sb.push(callbackSectionMarker('createBefore'));
  }

  if (hasEditableFields) {
    sb.push(createBeforeEditableSection);
  }

  if (collectionHooks.newSync.any()) {
    sb.push(callbackSectionMarker('newSync'));
  }
  
  sb.push(insertIntoDbSection(collectionName));

  if (collectionHooks.createAfter.any()) {
    sb.push(callbackSectionMarker('createAfter'));
  }

  if (hasEditableFields) {
    sb.push(createAfterEditableSection);
  }

  sb.push(createRunCountOfReferenceCallbacksSection(collectionName));

  if (collectionHooks.newAfter.any()) {
    sb.push(callbackSectionMarker('newAfter'));
  }

  if (collectionHooks.createAsync.any() || hasEditableFields) {
    sb.push(`
    const asyncProperties = {
      ...afterCreateProperties,
      document: documentWithId,
      newDocument: documentWithId,
    };\n`);
  }

  if (collectionHooks.createAsync.any()) {
    sb.push(callbackSectionMarker('createAsync'));
  }

  if (collectionHasElasticSync) {
    sb.push(createElasticSyncSection(collectionName));
  }

  if (collectionHooks.newAsync.any()) {
    sb.push(callbackSectionMarker('newAsync'));
  }

  if (hasEditableFields) {
    sb.push(newAsyncEditableSection);
  }

  sb.push(createReturnValueSection);

  const needsOldDocument = hasLogChanges || collectionHooks.editSync.any() || collectionHooks.editAsync.any();
  sb.push(updateFunctionOpeningSection(collectionName, collection, needsOldDocument));

  if (collectionHooks.updateValidate.any()) {
    sb.push(callbackSectionMarker('updateValidate'));
  }

  sb.push(`
    data = await runFieldOnUpdateCallbacks(schema, data, updateCallbackProperties);\n`);

  if (hasSlug) {
    sb.push(slugUpdateBeforeSection);
  }

  if (collectionHooks.updateBefore.any()) {
    sb.push(callbackSectionMarker('updateBefore'));
  }

  if (hasEditableFields) {
    sb.push(updateBeforeEditableSection);
  }

  sb.push(`\n    let modifier = dataToModifier(data);\n`);

  if (collectionHooks.editSync.any()) {
    sb.push(callbackSectionMarker('editSync'));
  }
  
  sb.push(editDbSection(collectionName));

  if (collectionHooks.updateAfter.any()) {
    sb.push(callbackSectionMarker('updateAfter'));
  }

  if (hasEditableFields) {
    sb.push(updateAfterEditableSection);
  }

  sb.push(updateRunCountOfReferenceCallbacksSection(collectionName));
  
  if (collectionHooks.updateAsync.any()) {
    sb.push(callbackSectionMarker('updateAsync'));
  }

  if (collectionHooks.editAsync.any()) {
    sb.push(callbackSectionMarker('editAsync'));
  }

  if (hasEditableFields) {
    sb.push(runEditAsyncEditableCallbacksSection);
  }

  if (collectionHasElasticSync) {
    sb.push(updateElasticSyncSection(collectionName));
  }

  if (hasLogChanges) {
    sb.push(logFieldChangesSection(collectionName));
  }

  sb.push(updateReturnValueSection);

  sb.push('\n\n');
  sb.push(exportFunctionsSection(collectionName));
  sb.push('\n\n');
  sb.push(exportGraphQLFieldsSection(collectionName, creatableFields, updatableFields));

  return sb.join('');
}


// export async function moveMutations() {
//   const allCollections = getAllCollections();
//   for (const collection of allCollections) {
//     const collectionName = collection.collectionName;
//     const collectionMutations = collection.options.mutations;

//     if (!collectionMutations) continue;

//     const mutationFilePath = join(__dirname, `../collections/${collectionName}/mutations.ts`);

//     const mutationFileContents = generateMutationFunctions(collectionName);

//     await writeFile(mutationFilePath, mutationFileContents);
//   }
// }

// export async function generateMutationImports() {
//   const allCollections = getAllCollections();
//   const imports: string[] = [];
//   const functionNames: string[] = [];

//   for (const collection of allCollections) {
//     const collectionName = collection.collectionName;
//     const collectionMutations = collection.options.mutations;

//     if (!collectionMutations) continue;

//     const createFunctionName = `create${collectionNameToTypeName[collectionName]}`;
//     const updateFunctionName = `update${collectionNameToTypeName[collectionName]}`;

//     const collectionPathPart = collectionName[0].toLowerCase() + collectionName.slice(1);

//     const importLine = `import { ${createFunctionName}, ${updateFunctionName} } from "@/server/collections/${collectionPathPart}/mutations";`;
//     imports.push(importLine);
//     functionNames.push(createFunctionName);
//     functionNames.push(updateFunctionName);
//   }

//   const importBlock = imports.join('\n');
//   const mutationBlock = functionNames.map(functionName => `${functionName}: addRootArg(${functionName})`).join(',\n');

//   await writeFile('./packages/lesswrong/server/initGraphQLImports.ts', importBlock + '\n\n' + mutationBlock);
// }

export async function moveLlmMessagesMutations() {
  const mutationFilePath = join(__dirname, `../collections/llmMessages/mutations.ts`);

  const reviewVoteMutations = generateMutationFunctions('LlmMessages');

  await writeFile(mutationFilePath, reviewVoteMutations);
}
