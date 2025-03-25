/* eslint-disable no-console */

import * as fs from 'fs';
import * as path from 'path';
import net from 'net';
import GraphQLJSON from 'graphql-type-json';
import { allSchemas, getSchema, getSimpleSchema } from '../../lib/schema/allOldSchemas';
import { getSchema as getNewSchema } from '../../lib/schema/allSchemas';
// import { augmentSchemas } from '../resolvers/allFieldAugmentations';
import { capitalize } from '@/lib/vulcan-lib/utils';
import { Type } from '../sql/Type';
import { sleep } from '@/lib/helpers';
import SimpleSchema from 'simpl-schema';
import { randomId } from '@/lib/random';
import { defaultNotificationTypeSettings, legacyMultiChannelDefaultNotificationTypeSettings } from '@/lib/collections/users/schema';
import { forumTypeSetting } from '@/lib/instanceSettings';
import pick from 'lodash/pick';

// Run the augmentSchemas function to make sure all schemas are properly augmented
// This no longer exists post-migration, since we've deleted all of the server-side field resolver augmentations
// But it's left here if you want to go back to a commit where those are still defined.
// augmentSchemas();

// Base directory where collection schemas are stored
const collectionBasePath = path.join(__dirname, '../../lib/collections');

type PropsWithOptionalDefaults = ReadonlyArray<string | readonly [string, AnyBecauseHard]>;

type FieldWithResolveAs = CollectionFieldSpecification<CollectionNameString> & { resolveAs: CollectionFieldResolveAs<CollectionNameString> };

// Extract database field properties
const databaseProps = [
  'type',
  'defaultValue',
  'typescriptType',
  'denormalized',
  'canAutoDenormalize',
  'canAutofillDefault',
  'needsUpdate',
  'getValue',
  'foreignKey',
  'logChanges',
  'nullable',
] as const;

// Extract GraphQL field properties
const graphqlProps = [
  'optional',
  'canRead',
  'canUpdate',
  'canCreate',
  'onCreate',
  'onUpdate',
  'onDelete',
  'countOfReferences',
  'editableFieldOptions',
  'slugCallbackOptions',
] as const;

// Extract form field properties
const formProps = [
  'description',
  'min',
  'max',
  'minCount',
  'maxCount',
  'options',
  'form',
  'beforeComponent',
  'afterComponent',
  'order',
  'label',
  'tooltip',
  'control',
  'placeholder',
  'hidden',
  'group',
  'editableFieldOptions',
] as const;

const socketPath = process.env.AUTODEBUG_IPC_HANDLE;

const hoistMap: Partial<Record<CollectionNameString, Record<string, number>>> = {};

function getArrayItemType(schema: SchemaType<CollectionNameString>, fieldName: string) {
  const arrayItemFieldName = `${fieldName}.$`;
  // note: make sure field has an associated array
  if (schema[arrayItemFieldName]) {
    // try to get array type from associated array
    const arrayItemType = getGraphQLType(schema, arrayItemFieldName);
    return arrayItemType ? `[${arrayItemType}]` : null;
  }
  return null;
}

function getBaseGraphQLType(
  typeName: string,
  schema: SchemaType<CollectionNameString>,
  fieldName: string,
) {
  switch (typeName) {
    case 'String':
      return 'String';

    case 'Boolean':
      return 'Boolean';

    case 'Number':
      return 'Float';

    case 'SimpleSchema.Integer':
      return 'Int';

    // for arrays, look for type of associated schema field or default to [String]
    case 'Array':
      return getArrayItemType(schema, fieldName);

    case 'Object':
      return 'JSON';

    case 'Date':
      return 'Date';

    default:
      return null;
  }
}

function getGraphQLType<N extends CollectionNameString>(
  schema: SchemaType<N>,
  fieldName: string,
  isInput = false,
): string|null {
  const field = schema[fieldName];
  const type = field.type.singleType;
  const typeName =
    typeof type === 'object' ? 'Object' : typeof type === 'function' ? type.name : type;

  const required = isInput && !field.optional;

  const baseType = getBaseGraphQLType(typeName, schema, fieldName);
  if (baseType) {
    return required ? `${baseType}!` : baseType;
  }

  return null;
};

function stringifyFunctionWithProperImports(func: Function): string {
  const funcStr = func.toString();
  return funcStr.replace(/(?<!\w)\(0, [_]([\w]+)\.([\w]+)\)/g, (_match, importName, funcName) => {
    if (!_match.includes('_')) {
      return _match;
    }

    if (funcName === 'default') {
      return importName;
    }

    return funcName;
  });
}

function fieldHasResolveAs(field: CollectionFieldSpecification<CollectionNameString>): field is FieldWithResolveAs {
  return !!field.resolveAs;
}

interface FieldValueSubstitutionProps<F extends CollectionFieldSpecification<CollectionNameString> = CollectionFieldSpecification<CollectionNameString>> {
  func: Function;
  field: F;
  fieldName: string;
  collectionName: CollectionNameString;
}

function spaces(n: number) {
  return ' '.repeat(n);
}

function getFillIfMissingInlineRepresentation(defaultValue: any, context: FieldValueSubstitutionProps) {
  if (typeof defaultValue === 'string') {
    return `"${defaultValue}"`;
  }

  if (Array.isArray(defaultValue) && defaultValue.length === 0) {
    return '[]';
  }

  if (defaultValue instanceof Date) {
    return `new Date(${defaultValue.getTime()})`;
  }

  if (typeof defaultValue === 'object') {
    return formatValue(defaultValue, context, 'onCreate');
  }

  return defaultValue;
}

const defaultFieldValueSubstitutions = {
  onCreate: (context: FieldValueSubstitutionProps) => {
    const { func, field, collectionName } = context;
    switch (func.name) {
      case 'fillIfMissing':
        return undefined;
        // const defaultValue = field.defaultValue;
        // TODO: some of these are evaluated constants; seems bad to lose the references.  What to do?
        // const inlineRepresentation = getFillIfMissingInlineRepresentation(defaultValue, context);

        // return `get${capitalize(func.name)}(${inlineRepresentation})`;

      case 'denormalizedFieldOnCreate':
        // TODO: we should probably hoist these to named functions at the top level of the generated code
        // and then refer to them by name here.
        const { getValue, needsUpdate } = field;

        const getValuePart = getValue
          ? `getValue: ${formatValue(getValue, context, 'getValue')},`
          : '';

        const needsUpdatePart = needsUpdate
          ? `needsUpdate: ${formatValue(needsUpdate, context, 'needsUpdate')}`
          : '';

        return `get${capitalize(func.name)}<'${collectionName}'>({ ${getValuePart}${needsUpdatePart} })`;
      case 'arrayOfForeignKeysOnCreate':
        return func.name;
      default:
        return func;
    }
  },
  onUpdate: (context: FieldValueSubstitutionProps) => {
    const { func, field, fieldName, collectionName } = context;
    switch (func.name) {
      case 'throwIfSetToNull':
        return undefined;
        // return func.name;
      case 'denormalizedFieldOnUpdate':
        // TODO: we should probably hoist these to named functions at the top level of the generated code
        // and then refer to them by name here.
        const { getValue, needsUpdate } = field;

        const getValuePart = getValue
          ? `getValue: ${formatValue(getValue, context, 'getValue')},`
          : '';

        const needsUpdatePart = needsUpdate
          ? `needsUpdate: ${formatValue(needsUpdate, context, 'needsUpdate')}`
          : '';

        return `get${capitalize(func.name)}<'${collectionName}'>({ ${getValuePart}${needsUpdatePart} })`;
      default:
        if (fieldName === 'schemaVersion') {
          return `() => 1`;
        }
        return func;
    }
  },
  resolver: (context: FieldValueSubstitutionProps) => {
    const { func, fieldName, collectionName, field } = context;
    switch (func.name) {
      case 'normalizedEditableResolver':
      case 'revisionsResolver':
      case 'versionResolver':
        return `get${capitalize(func.name)}('${fieldName}')`;
      case 'denormalizedEditableResolver':
        return `get${capitalize(func.name)}('${collectionName}', '${fieldName}')`;
      case 'idResolverSingle': {
        if (!('foreignCollectionName' in func)) {
          throw new Error(`foreignCollectionName not found in func for idResolverSingle in ${collectionName}.${fieldName}`);
        }

        const foreignCollectionName = func.foreignCollectionName;
        return `generateIdResolverSingle({ foreignCollectionName: '${foreignCollectionName}', fieldName: '${fieldName}' })`;
      }
      case 'idResolverMulti': {
        if (!('foreignCollectionName' in func)) {
          throw new Error(`foreignCollectionName not found in func for idResolverMulti in ${collectionName}.${fieldName}`);
        }

        const foreignCollectionName = func.foreignCollectionName;
        const getKeyPart = fieldName === ('bookmarkedPostsMetadata' || fieldName === 'hiddenPostsMetadata')
          ? ', getKey: (obj) => obj.postId'
          : '';

        return `generateIdResolverMulti({ foreignCollectionName: '${foreignCollectionName}', fieldName: '${fieldName}'${getKeyPart} })`;
      }
      case 'contributorsFieldResolver':
        const fieldNameValue = collectionName === 'Tags' ? 'description' : 'contents';
        return `getContributorsFieldResolver({ collectionName: '${collectionName}', fieldName: '${fieldNameValue}' })`;
      case 'arbitalLinkedPagesFieldResolver':
        return `getArbitalLinkedPagesFieldResolver({ collectionName: '${collectionName}' })`;
      case 'textLastUpdatedAtFieldResolver':
        return `getTextLastUpdatedAtFieldResolver('${collectionName}')`;
      case 'summariesFieldResolver':
        return `getSummariesFieldResolver('${collectionName}')`;
      default:
        return func;
    }
  },
  sqlResolver: ({ func, fieldName, collectionName, field }: FieldValueSubstitutionProps) => {
    switch (func.name) {
      case 'normalizedEditableSqlResolver':
        return `get${capitalize(func.name)}('${fieldName}')`;
      case 'foreignKeySqlResolver':
        return `getForeignKeySqlResolver({ collectionName: '${collectionName}', nullable: ${field.nullable}, idFieldName: '${fieldName}' })`;
      case 'summariesFieldSqlResolver':
        return `getSummariesFieldSqlResolver('${collectionName}')`;  
      default:
        if (fieldName === 'currentUserVote') {
          return `currentUserVoteResolver`;
        } else if (fieldName === 'currentUserExtendedVote') {
          return `currentUserExtendedVoteResolver`;
        }
        return func;
    }
  },
  sqlPostProcess: ({ func }: FieldValueSubstitutionProps) => func,
  getValue: (context: FieldValueSubstitutionProps) => {
    const { func, fieldName, collectionName, field } = context;
    switch (func.name) {
      case 'denormalizedCountOfReferencesGetValue':
        if (!field.countOfReferences) {
          throw new Error(`Count of references not found for field ${fieldName} in collection ${collectionName}`);
        }
        const { foreignCollectionName, foreignFieldName, filterFn } = field.countOfReferences;

        const prefix = `\n${spaces(8)}`;
        const collectionNamePart = `${prefix}collectionName: '${collectionName}',`;
        const fieldNamePart = `${prefix}fieldName: '${fieldName}',`;
        const foreignCollectionNamePart = `${prefix}foreignCollectionName: '${foreignCollectionName}',`;
        const foreignFieldNamePart = `${prefix}foreignFieldName: '${foreignFieldName}',`;
        const filterFnPart = filterFn ? `${prefix}filterFn: ${formatFunctionValue(filterFn, context, 'filterFn')},` : '';

        const allParts = [
          'getDenormalizedCountOfReferencesGetValue({',
          collectionNamePart,
          fieldNamePart,
          foreignCollectionNamePart,
          foreignFieldNamePart,
          filterFnPart,
          `\n${spaces(6)}})`,
        ];

        return allParts.join('');
      default:
        return func;
    }
  },
  getLocalStorageId: (context: FieldValueSubstitutionProps) => {
    const { func, collectionName } = context;
    switch (func.name) {
      case 'defaultLocalStorageIdGenerator':
        return `getDefaultLocalStorageIdGenerator('${collectionName}')`;
      default:
        return func;
    }
  },
  filterFn: (context: FieldValueSubstitutionProps) => {
    const { func, fieldName, collectionName } = context;
    if (fieldName === 'voteCount') {
      const originalFilterFnString = stringifyFunctionWithProperImports(func);
      return originalFilterFnString.replace('=== collectionName', `=== '${collectionName}'`);
    }
    
    return func;
  },
  canCreate: (context: FieldValueSubstitutionProps) => {
    const { func, fieldName } = context;
    switch (fieldName) {
      case 'coauthorStatuses':
        return 'userOverNKarmaOrApproved(MINIMUM_COAUTHOR_KARMA)';
      case 'commentsLocked':
      case 'commentsLockedToAccountsCreatedAfter':
        return stringifyFunctionWithProperImports(func);
      default:
        return func;
    }
  },
  canUpdate: (context: FieldValueSubstitutionProps) => {
    const { func, fieldName } = context;
    switch (fieldName) {
      case 'coauthorStatuses':
        return 'userOverNKarmaOrApproved(MINIMUM_COAUTHOR_KARMA)';
      case 'fmCrosspost':
        return 'allOf(userOwns, userPassesCrosspostingKarmaThreshold)';
      case 'showHideKarmaOption':
      case 'bannedUserIds':
        return `userOwnsAndInGroup('trustLevel1')`;
      case 'bannedPersonalUserIds':
        return `userOwnsAndInGroup('canModeratePersonal')`;
      case 'commentsLocked':
      case 'commentsLockedToAccountsCreatedAfter':
        return stringifyFunctionWithProperImports(func);
      default:
        return func;
    }
  },
}

const skipPropertiesForHoistMap = new Set([
  'group',
  'createdAt',
]);

function addToHoistMap(context: FieldValueSubstitutionProps, value: string, propertyName?: string) {
  if (propertyName && skipPropertiesForHoistMap.has(propertyName)) {
    return;
  }

  const { collectionName } = context;
  hoistMap[collectionName] ??= {};
  const hoistMapForCollection = hoistMap[collectionName];
  hoistMapForCollection![value] ??= 0;
  hoistMapForCollection![value]++;
}

function formatFunctionValue(value: Function, context: FieldValueSubstitutionProps, propertyName?: string): string | undefined {
  if (propertyName && propertyName in defaultFieldValueSubstitutions) {
    const substitution = defaultFieldValueSubstitutions[propertyName as keyof typeof defaultFieldValueSubstitutions];
    const substitutedValue = substitution({ ...context, func: value });
    if (!substitutedValue || (substitutedValue !== value && typeof substitutedValue === 'string')) {
      if (substitutedValue) {
        addToHoistMap(context, substitutedValue, propertyName);
      }

      return substitutedValue;
    }
  }

  // Special case for function fields that should preserve their implementation
  const functionImplementationFields = [
    'onCreate',
    'onUpdate',
    'onDelete',
    'getValue',
    // TODO: figure out why this isn't replacing the `resolver` inside of `sqlResolver`
    'resolver',
    'sqlResolver',
    'sqlPostProcess',
    'needsUpdate',
    'hidden',
    'options',
    'group',
    'hintText',
    'inputPrefix',
    'disabled',
    'filterFn',
    'getLocalStorageId',
    'getTitle',
    // 'canRead',
    // 'canCreate',
    // 'canUpdate',
  ];
  const shouldPreserveFunctionImpl = propertyName && functionImplementationFields.includes(propertyName);
  
  if (value === String) return '"String"';
  if (value === Number) return '"Number"';
  if (value === Boolean) return '"Boolean"';
  if (value === Date) return '"Date"';
  if (value === Object) return '"Object"';
  if (value === Array) return '"Array"';
  
  // For function implementation fields, preserve the full implementation
  if (shouldPreserveFunctionImpl) {
    const funcStr = stringifyFunctionWithProperImports(value);
    addToHoistMap(context, funcStr, propertyName);
    return funcStr;
  }
  
  // For named functions, preserve the function name
  if (value.name && value.name !== 'anonymous') {
    return value.name;
  }
  
  // For other functions, use toString but clean up the output
  const funcStr = value.toString();
  // If it's a simple function, extract a meaningful identifier
  if (funcStr.includes('=>')) {
    const simplified = funcStr.replace(/\s+/g, ' ').substring(0, 50);
    return `"function:${simplified}${simplified.length >= 50 ? '...' : ''}"`;
  }
  
  return `"function:${funcStr.substring(0, 50)}${funcStr.length >= 50 ? '...' : ''}"`;
}

// Helper function to properly format a value
function formatValue(value: any, context: Omit<FieldValueSubstitutionProps, 'func'>, propertyName: string): string | undefined {
  if (value === undefined || value === null) {
    return '';
  }

  // Handle arrays specially to properly handle functions within arrays
  if (Array.isArray(value)) {
    // For array items, we don't have property names, so always use simplified function format
    const formattedElements = value.map(element => formatValue(element, context, propertyName));
    return `[${formattedElements.join(', ')}]`;
  }
  
  // Handle functions specially
  if (typeof value === 'function') {
    return formatFunctionValue(value, { ...context, func: value }, propertyName);
  }
  
  // Handle SimpleSchema objects more cleanly
  if (value && typeof value === 'object' && value._constructorOptions) {
    return '"SimpleSchema"';
  }

  if (value && value instanceof RegExp) {
    switch (context.fieldName) {
      case 'ip':
        return 'SimpleSchema.RegEx.IP';
      case 'facebookLink':
      case 'facebookPageLink':
      case 'meetupLink':
      case 'slackLink':
      case 'website':
      case 'eventRegistrationLink':
      case 'joinEventLink':
        return 'SimpleSchema.RegEx.Url';
      case 'email':
        return 'SimpleSchema.RegEx.Email';
      case 'emails':
        return '[new SimpleSchema({ address: { type: String, regEx: SimpleSchema.RegEx.Email, optional: true }, verified: { type: Boolean, optional: true } })]';
      default:
        throw new Error(`Unknown field ${context.fieldName} in ${context.collectionName} when handling RegExp`);
    }
  }
  
  // For regular objects, try to handle them better by inspecting properties
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    if (value === GraphQLJSON) {
      return 'GraphQLJSON';
    }

    if (propertyName && isUserNotificationSettingsField(context) && JSON.stringify(value) === JSON.stringify(defaultNotificationTypeSettings)) {
      if (JSON.stringify(value) === JSON.stringify(defaultNotificationTypeSettings)) {
        return `defaultNotificationTypeSettings`;
      } else if (JSON.stringify(value) === JSON.stringify(legacyMultiChannelDefaultNotificationTypeSettings)) {
        return `multiChannelDefaultNotificationTypeSettings`;
      }
    }

    try {
      // Try to create a more meaningful representation
      const keys = Object.keys(value);
      if (keys.length === 0) return '{}';
      
      const props = keys.map(key => {
        const propValue = formatValue(value[key], context, key);
        if (propValue && propValue.length > 0) {
          return `"${key}": ${propValue}`;
        }
        return undefined;
      }).filter(prop => prop !== undefined);

      return `{${props.join(', ')}}`;
    } catch (e) {
      // Fallback to default JSON if we encounter any issues
      return JSON.stringify(value);
    }
  }
  
  return JSON.stringify(value);
};

function hasSimpleSchemaType(
  context: Omit<FieldValueSubstitutionProps, 'func'>,
) {
  const { fieldName, collectionName } = context;
  const schema = getSchema(collectionName);
  const fieldSchema = schema[fieldName];
  const indexSchema = schema[`${fieldName}.$`];

  return SimpleSchema.isSimpleSchema(fieldSchema.type) || (indexSchema && SimpleSchema.isSimpleSchema(indexSchema.type));
}

function isUserNotificationSettingsField(context: Omit<FieldValueSubstitutionProps, 'func'>) {
  const { fieldName, collectionName } = context;
  return collectionName === 'Users' && fieldName.startsWith('notification');
}

function getSimpleSchemaRepresentation(context: Omit<FieldValueSubstitutionProps, 'func'>) {
  const { field, fieldName, collectionName } = context;
  if (field.editableFieldOptions) {
    return 'RevisionStorageType';
  }

  if (isUserNotificationSettingsField(context)) {
    return 'notificationTypeSettings';
  }

  switch (fieldName) {
    case 'karmaChangeNotifierSettings':
      return 'karmaChangeSettingsType';
    case 'expandedFrontpageSections':
      return 'expandedFrontpageSectionsSettings';
    case 'partiallyReadSequences':
      return '[partiallyReadSequenceItem]';
    case 'theme':
      return 'userTheme';
    case 'originalContents':
      return 'ContentType';
    case 'renderResult':
      return 'RenderResultSchemaType';
    case 'creator':
      return 'creatorSchema';
    case 'topicPreferences':
      return '[topicPreferenceSchema]';
    case 'jobAds':
      return '[jobAdsType]';
    case 'rsvps':
      return '[rsvpType]';
    case 'coauthorStatuses':
      return '[coauthorStatusSchema]';
    case 'socialPreview':
      return 'socialPreviewSchema';
    case 'fmCrosspost':
      return 'crosspostSchema';
    case 'forumEventMetadata':
      return 'ForumEventCommentMetadataSchema';
    case 'recommendationSettings':
      return 'recommendationSettingsSchema';
  }

  return 'FILL_THIS_IN';
}

// Helper function to build a section with properties
function buildSection(
  props: PropsWithOptionalDefaults,
  section: 'database' | 'graphql' | 'form',
  field: CollectionFieldSpecification<CollectionNameString>,
  context: Omit<FieldValueSubstitutionProps, 'func'>,
  isResolverOnlyField = false,
): string[] | undefined {
  if (section === 'form' && (!field.canCreate?.length && !field.canUpdate?.length)) {
    return undefined;
  }

  if (section === 'graphql' && !field.canRead) {
    return [];
  }

  const lines: string[] = [];
  
  for (const prop of props) {
    const propName = typeof prop === 'string' ? prop : prop[0];
    const defaultValue = typeof prop === 'string' ? undefined : prop[1];
    if (propName === 'type' && section === 'database') continue; // Handle type separately for database
    
    // Use type assertion since we know these properties are part of the schema
    const value = (field as any)[propName] ?? defaultValue;

    // Special case for editableFieldOptions, where we want to relocate only `clientOptions` to the form section
    if (section === 'form' && field.editableFieldOptions && propName === 'editableFieldOptions') {
      const { editableFieldOptions: { clientOptions } } = field;
      lines.push(`${spaces(6)}editableFieldOptions: ${formatValue(clientOptions, context, 'clientOptions')},`);
    } else if (section === 'graphql' && field.editableFieldOptions && propName === 'editableFieldOptions') {
      const { editableFieldOptions: { callbackOptions } } = field;
      lines.push(`${spaces(6)}editableFieldOptions: ${formatValue(callbackOptions, context, 'callbackOptions')},`);
    } else if (section === 'graphql' && propName === 'optional') {
      // Skip this here, since we're relocating it to the validation subsection
    } else if (value !== undefined) {
      // Pass the property name to formatValue so it can make context-specific decisions
      const formattedValue = formatValue(value, context, propName);
      if (formattedValue) {
        lines.push(`${spaces(6)}${propName}: ${formattedValue},`);
      }
    }
  }

  if (!isResolverOnlyField && section === 'graphql' && (field.allowedValues || field.regEx || hasSimpleSchemaType(context) || field.optional)) {
    lines.push(`${spaces(6)}validation: {`);
    if (field.allowedValues) {
      lines.push(`${spaces(8)}allowedValues: ${formatValue(field.allowedValues, context, 'allowedValues')},`);
    }
    if (field.regEx) {
      if (context.collectionName === 'Posts') {
        console.log(` ${context.fieldName} when handling regEx: ${field}`);
      }
      lines.push(`${spaces(8)}regEx: ${formatValue(field.regEx, context, 'regEx')},`);
    }
    if (hasSimpleSchemaType(context)) {
      const simpleSchemaRepresentation = getSimpleSchemaRepresentation(context);
      lines.push(`${spaces(8)}simpleSchema: ${simpleSchemaRepresentation},`);
    }
    if (field.optional) {
      lines.push(`${spaces(8)}optional: true,`);
    }
    lines.push(`${spaces(6)}},`);
  }
  
  return lines;
};

function convertResolveAsFunction({
    field,
    fieldName,
    collectionName,
  }: Omit<FieldValueSubstitutionProps<FieldWithResolveAs>, 'func'>,
  propertyName: keyof typeof defaultFieldValueSubstitutions & keyof typeof field['resolveAs'],
) {
  const func = field.resolveAs[propertyName];
  if (!func) {
    throw new Error(`Function ${propertyName} not found in ${fieldName}.resolveAs`);
  }
  
  const substitution = defaultFieldValueSubstitutions[propertyName]({
    func,
    fieldName,
    collectionName,
    field,
  });

  if (substitution !== func) {
    return substitution;
  }

  return stringifyFunctionWithProperImports(func);
}


function extractAdditionalResolverField(context: Omit<FieldValueSubstitutionProps<FieldWithResolveAs>, 'func'>) {
  const { field, fieldName } = context;
  const resolveAsFieldName = field.resolveAs.fieldName || `${fieldName}Resolved`;

  const graphqlResolveAsContent = [];

  if (field.resolveAs.type) {
    graphqlResolveAsContent.push(`    outputType: ${formatValue(field.resolveAs.type, context, 'resolveAs')},`);
  }

  if (field.canRead) {
    graphqlResolveAsContent.push(`    canRead: ${formatValue(field.canRead, context, 'canRead')},`);
  } else {
    graphqlResolveAsContent.push(`    canRead: [],`);
  }

  if (field.resolveAs.arguments) {
    graphqlResolveAsContent.push(`    arguments: ${formatValue(field.resolveAs.arguments, context, 'resolveAs')},`);
  }

  graphqlResolveAsContent.push(`    resolver: ${convertResolveAsFunction(context, 'resolver')},`);

  if (field.resolveAs.sqlResolver) {
    graphqlResolveAsContent.push(`    sqlResolver: ${convertResolveAsFunction(context, 'sqlResolver')},`);
  }

  if (field.resolveAs.sqlPostProcess) {
    graphqlResolveAsContent.push(`    sqlPostProcess: ${convertResolveAsFunction(context, 'sqlPostProcess')},`);
  }

  const resolveAsField = `  ${resolveAsFieldName}: {
    graphql: {
${graphqlResolveAsContent.join('\n')}
    },
  },`;
  return resolveAsField;
}

function convertDatabaseField(
  typeString: string,
  field: CollectionFieldSpecification<CollectionNameString>,
  fieldName: string,
  collectionName: CollectionNameString,
) {
  const context = { field, fieldName, collectionName };
  const databaseSection = buildSection(databaseProps, 'database', field, context) ?? [];
  const graphqlSection = buildSection(graphqlProps, 'graphql', field, context) ?? [];
  const formSection = buildSection(formProps, 'form', field, context);

  const databaseContent = typeString ? [typeString, ...databaseSection] : databaseSection;

  const simpleSchema = getSimpleSchema(collectionName)._schema;
  const outputTypeValueForGraphQL = getGraphQLTypeString(simpleSchema, fieldName, false);
  const inputTypeValue = getGraphQLTypeString(simpleSchema, fieldName, true);
  const includeInputType = outputTypeValueForGraphQL.split(':')[1] !== inputTypeValue.split(':')[1];

  const baseField = `  ${fieldName}: {${databaseContent.length > 0 ? `
    database: {
${databaseContent.join('\n')}
    },` : ''}${graphqlSection.length > 0 ? `
    graphql: {
${outputTypeValueForGraphQL}${includeInputType ? `
${inputTypeValue}` : ''}
${graphqlSection.join('\n')}
    },` : ''}${formSection ? `
    form: {
${formSection.join('\n')}
    },` : ''}
  },`;
  return baseField;
}


function convertResolverOnlyField(
  field: FieldWithResolveAs,
  fieldName: string,
  collectionName: CollectionNameString,
) {
  const context = { field, fieldName, collectionName };
  const result: string[] = [];
  const graphqlSection = buildSection(graphqlProps, 'graphql', field, context, true) ?? [];
  const formSection = buildSection(formProps, 'form', field, context, true) ?? [];

  if (field.resolveAs.arguments) {
    graphqlSection.push(`    arguments: ${formatValue(field.resolveAs.arguments, context, 'resolveAs')},`);
  }

  const graphqlContent = [
    ...graphqlSection,
    `    resolver: ${convertResolveAsFunction(context, 'resolver')},`,
  ];

  if (field.resolveAs.sqlResolver) {
    graphqlContent.push(`    sqlResolver: ${convertResolveAsFunction(context, 'sqlResolver')},`);
  }

  if (field.resolveAs.sqlPostProcess) {
    graphqlContent.push(`    sqlPostProcess: ${convertResolveAsFunction(context, 'sqlPostProcess')},`);
  }

  const simpleSchema = getSimpleSchema(collectionName)._schema;
  const outputTypeValue = field.resolveAs.type
    ? `${spaces(6)}outputType: '${field.resolveAs.type}',`
    : getGraphQLTypeString(simpleSchema, fieldName, false);


  const content = `  ${fieldName}: {
    graphql: {
${outputTypeValue}
${graphqlContent.join('\n')}
    },${formSection.length > 0 ? `
    form: {
${formSection.join('\n')}
    },` : ''}
  },`;

  result.push(content);

  return result;
}

function getGraphQLTypeString(schema: SchemaType<CollectionNameString>, fieldName: string, isInput: boolean) {
  const graphqlType = getGraphQLType(schema, fieldName, isInput);
  const typePolarity = isInput ? 'inputType' : 'outputType';
  return `${spaces(6)}${typePolarity}: '${graphqlType}',`;
}

function getFieldTypeString(
  schema: SchemaType<CollectionNameString>,
  field: CollectionFieldSpecification<CollectionNameString>,
  collectionName: CollectionNameString,
  fieldName: string,
) {
  if (fieldName === '_id' && collectionName !== 'Sessions') {
    return `${spaces(6)}type: 'VARCHAR(27)',`;
  }

  const indexSchema = schema[`${fieldName}.$`];
  const dbType = Type.fromOldSchema(collectionName, fieldName, field, indexSchema, forumTypeSetting.get());
  return `${spaces(6)}type: '${dbType.toConcrete().toString()}',`;
}

/**
 * Converts a field from old CollectionFieldSpecification format to new NewCollectionFieldSpecification format
 * Returns an array of strings, one for the base field and potentially one for the resolveAs field
 */
function convertFieldToNewFormat(
  fieldName: string,
  collectionName: CollectionNameString,
  field: CollectionFieldSpecification<CollectionNameString>,
  schema: SchemaType<CollectionNameString>,
): string[] {
  // Skip array sub-fields that contain $ symbol, as they will be handled differently
  if (fieldName.includes('.$')) {
    return []; // Return empty array for array sub-fields
  }

  const result: string[] = [];

  // Handle resolver-only fields
  if (fieldHasResolveAs(field) && !field.resolveAs.addOriginalField) {
    return convertResolverOnlyField(field, fieldName, collectionName);
  }

  // Special handling for type
  const typeString = getFieldTypeString(schema, field, collectionName, fieldName);

  // Handle regular field (without resolveAs or with resolveAs.addOriginalField=true)
  const baseField = convertDatabaseField(typeString, field, fieldName, collectionName);
  
  result.push(baseField);

  // Create separate entry for resolveAs field
  if (fieldHasResolveAs(field)) {
    const resolveAsField = extractAdditionalResolverField({ field, fieldName, collectionName });
    
    result.push(resolveAsField);
  }

  return result;
}


/**
 * Converts a schema from old format to new format and writes it to a file
 */
async function convertSchemaToNewFormat(collectionName: CollectionNameString) {
  console.log(`Converting schema for ${collectionName}...`);
  
  // Get the schema
  const schema = getSchema(collectionName);
  
  // Build the new schema file content
  let newSchemaContent = `// GENERATED FILE - DO NOT MODIFY DIRECTLY
// This is a generated file that has been converted from the old schema format to the new format.
// The original schema is still in use, this is just for reference.

$REPLACE

$HOISTED_FUNCTIONS

const schema: Record<string, NewCollectionFieldSpecification<'${collectionName}'>> = {
`;

  // Get all the field names, but filter out array sub-fields (those containing .$)
  const regularFieldNames = Object.keys(schema).filter(fieldName => !fieldName.includes('.$'));

  // Convert each field
  for (const fieldName of regularFieldNames) {
    if (Object.prototype.hasOwnProperty.call(schema, fieldName)) {
      const field = schema[fieldName];
      const convertedFields = convertFieldToNewFormat(fieldName, collectionName, field, schema);
      newSchemaContent += convertedFields.join('\n') + '\n';
    }
  }

  newSchemaContent += `};

export default schema;
`;

  // Determine the output path
  const collectionDir = findCollectionDir(collectionName);
  if (!collectionDir) {
    console.warn(`Could not find collection directory for ${collectionName}, skipping...`);
    return;
  }

  const originalSchemaPath = path.join(collectionDir, 'schema.ts');
  const originalTsxSchemaPath = path.join(collectionDir, 'schema.tsx');
  let originalSchemaContent;
  if (fs.existsSync(originalSchemaPath)) {
    originalSchemaContent = fs.readFileSync(originalSchemaPath, 'utf8');
  } else if (fs.existsSync(originalTsxSchemaPath)) {
    originalSchemaContent = fs.readFileSync(originalTsxSchemaPath, 'utf8');
  } else {
    console.warn(`Could not find original schema file for ${collectionName}, skipping...`);
    return;
  }

  const originalSchemaLines = originalSchemaContent.split('\n');
  const lineOfSchemaDeclaration = originalSchemaLines.findIndex(line => line.includes('const schema: SchemaType<'));
  if (lineOfSchemaDeclaration === -1) {
    console.warn(`Could not find schema declaration in ${originalSchemaPath}`);
  }

  const linesAboveSchemaDeclaration = lineOfSchemaDeclaration > 0 ? originalSchemaLines.slice(0, lineOfSchemaDeclaration) : [];
  const linesAboveSchemaDeclarationString = linesAboveSchemaDeclaration.join('\n');
  const hoistMapForCollection = hoistMap[collectionName];
  const hoistedFunctions: string[] = [];
  if (hoistMapForCollection) {
    for (const [key, value] of Object.entries(hoistMapForCollection)) {
      if (value > 2) {
        const placeholderName = `h${randomId(5)}`;
        if (key.length > 15 && (key.startsWith('(') || key.startsWith('async'))) {
          const prefix = `const ${placeholderName} = `;
          const hoistedFunctionString = `${prefix}${key}`;
          hoistedFunctions.push(hoistedFunctionString);
          newSchemaContent = newSchemaContent.split(key).join(placeholderName);;
        }
      }
    }
  }
  newSchemaContent = newSchemaContent.replace('$REPLACE', linesAboveSchemaDeclarationString);
  newSchemaContent = newSchemaContent.replace('$HOISTED_FUNCTIONS', hoistedFunctions.join('\n'));

  // Delete all instances of the strings '_formGroups.', '_instanceSettings.', '_betas.', '_constants.', etc, from the new schema
  newSchemaContent = newSchemaContent.replace(/_formGroups\./g, '');
  newSchemaContent = newSchemaContent.replace(/_instanceSettings\./g, '');
  newSchemaContent = newSchemaContent.replace(/_publicSettings\./g, '');
  newSchemaContent = newSchemaContent.replace(/_betas\./g, '');
  newSchemaContent = newSchemaContent.replace(/_constants\./g, '');
  newSchemaContent = newSchemaContent.replace(/_forumTheme\./g, '');
  newSchemaContent = newSchemaContent.replace(/_schema\./g, '');
  newSchemaContent = newSchemaContent.replace(/_groupTypes\./g, '');
  newSchemaContent = newSchemaContent.replace(/_reviewUtils\./g, '');
  newSchemaContent = newSchemaContent.replace(/_collection[1-9]\./g, '');
  newSchemaContent = newSchemaContent.replace(/_types\./g, '');
  newSchemaContent = newSchemaContent.replace(/_revisionConstants\./g, '');
  newSchemaContent = newSchemaContent.replace(/_utils\./g, '');
  newSchemaContent = newSchemaContent.replace(/_helpers\./g, '');
  newSchemaContent = newSchemaContent.replace(/_underscore\./g, '_.');
  const outputPath = path.join(collectionDir, 'newSchema.ts');
  
  // Write the new schema file
  fs.writeFileSync(outputPath, newSchemaContent);
  console.log(`Wrote new schema to ${outputPath}`);

  console.log('Formatting...');
  await sendCommand('vscode.executeFormatDocumentProvider', [outputPath, { tabSize: 2, indentSize: 2 }]);
  await sleep(5000);
}

/**
 * Find the directory where a collection's schema is stored
 */
function findCollectionDir(collectionName: CollectionNameString): string | null {
  if (collectionName === 'ArbitalCaches') {
    return path.join(collectionBasePath, 'arbitalCache');
  }

  if (collectionName === 'ReadStatuses') {
    return path.join(collectionBasePath, 'readStatus');
  }

  const uncapitalizedCollectionName = collectionName[0].toLowerCase() + collectionName.slice(1);
  if (fs.existsSync(path.join(collectionBasePath, uncapitalizedCollectionName))) {
    return path.join(collectionBasePath, uncapitalizedCollectionName);
  }
  
  // Convert from CamelCase to kebab-case
  const kebabName = collectionName
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .toLowerCase();
  
  // First try the kebab-case version
  const kebabPath = path.join(collectionBasePath, kebabName);
  if (fs.existsSync(kebabPath)) {
    return kebabPath;
  }
  
  // Then try the lowercase version
  const lowerPath = path.join(collectionBasePath, collectionName.toLowerCase());
  if (fs.existsSync(lowerPath)) {
    return lowerPath;
  }
    
  // Try to find directory with similar name
  const dirs = fs.readdirSync(collectionBasePath);
  for (const dir of dirs) {
    if (dir.toLowerCase() === collectionName.toLowerCase() || 
        dir.toLowerCase().replace(/-/g, '') === collectionName.toLowerCase()) {
      return path.join(collectionBasePath, dir);
    }
  }
    
  return null;
}

if (!socketPath || !fs.existsSync(socketPath)) {
  throw new Error('autodebug is not running, so we cannot convert schemas');
} else {
  console.log(`autodebug running on ${socketPath}`);
}

async function sendCommand(command: string, args: any[]) {
  const client = net.createConnection(socketPath!, () => {
    const message = JSON.stringify({
      type: "command",
      command,
      args
    }) + "\n";

    client.write(message);
    client.end();
  });

  client.on('error', (err) => {
    // eslint-disable-next-line no-console
    console.error("Error connecting to socket:", err);
  });
}

export async function convertSchemas() {
  for (const collectionName of Object.keys(allSchemas)) {
    void convertSchemaToNewFormat(collectionName as CollectionNameString);
    await sleep(100);
  }
}

export async function findMissingFormSections() {
  const collectionsWithSmartForms = [
    'CurationNotices',
    'Comments',
    'Posts',
    'Tags',
    'ForumEvents',
    'JargonTerms',
    'Localgroups',
    'Conversations',
    'Messages',
    'ModerationTemplates',
    'Users',
    'RSSFeeds',
    'Books',
    'Chapters',
    'Collections',
    'Sequences',
    'Spotlights',
    'ModeratorActions',
    'Reports',
    'UserRateLimits',
    'SurveySchedules',
    'MultiDocuments',
    'TagFlags',
    'GardenCodes',
  ] as const;

  for (const collectionName of collectionsWithSmartForms) {
    const newSchema = getNewSchema(collectionName);
    const oldSchema = getSchema(collectionName);

    const collectionDir = findCollectionDir(collectionName);
    if (!collectionDir) {
      console.warn(`Could not find collection directory for ${collectionName}, skipping...`);
      continue;
    }
    const newSchemaPath = path.join(collectionDir, 'newSchema.ts');
    const newSchemaContent = await fs.promises.readFile(newSchemaPath, 'utf8');
    const newSchemaLines = newSchemaContent.split('\n');

    for (const fieldName of Object.keys(oldSchema).filter(fieldName => !fieldName.includes('.$'))) {
      const oldField = oldSchema[fieldName];

      if (fieldHasResolveAs(oldField) && !oldField.resolveAs.addOriginalField) {
        continue;
      }

      const context = { field: oldField, fieldName, collectionName };
      const formSection = buildSection(formProps, 'form', oldField, context);

      if (formSection && !newSchema[fieldName].form) {
        console.log(`${collectionName}.${fieldName} is missing form section`);
        let formSectionString = formSection.join('\n');
        if (formSectionString.length > 0) {
          formSectionString = `\n${formSectionString}\n    `;
        }
        const missingFormSection = `    form: {${formSectionString}},`;

        // Find the beginning of the field in the new schema
        const fieldStartLine = newSchemaLines.findIndex(line => line.startsWith(`  ${fieldName}: {`));

        // Walk forward, keeping track of opening and closing braces, until we find the end of the field
        let braceCount = 0;
        let endLine = fieldStartLine;
        for (let i = fieldStartLine; i < newSchemaLines.length; i++) {
          const line = newSchemaLines[i];
          braceCount += (line.match(/[{]/g) || []).length;
          braceCount -= (line.match(/[}]/g) || []).length;
          if (braceCount === 0) {
            endLine = i;
            break;
          }
        }

        // Splice in the missing form section before the last line of the field
        newSchemaLines.splice(endLine, 0, missingFormSection);
        const newFieldLines = newSchemaLines.slice(fieldStartLine, endLine + 2).join('\n');
        // console.log('New field lines:');
        // console.log(missingFormSection);

        // Write the new schema to the file
        await fs.promises.writeFile(newSchemaPath, newSchemaLines.join('\n'));
      }
    }
  }
}

export async function findMissingFormFields() {
  for (const collectionName of Object.keys(allSchemas) as CollectionNameString[]) {
    const newSchema = getNewSchema(collectionName);
    const oldSchema = getSchema(collectionName);

    for (const fieldName of Object.keys(newSchema)) {
      if (!oldSchema[fieldName]) {
        continue;
      }

      const oldField = oldSchema[fieldName];
      const newField = newSchema[fieldName];

      const formFieldsInOldSchema = Object.keys(pick(oldField, formProps)).filter(propKey => oldField[propKey as keyof typeof oldField] !== undefined) as (typeof formProps)[number][];

      if (!newField.form || formFieldsInOldSchema.length === 0) {
        continue;
      }

      const missingFormFields = formFieldsInOldSchema.filter(field => newField.form?.[field] === undefined);
      if (missingFormFields.length > 0) {
        console.log(`${collectionName}.${fieldName} is missing form fields:`);
        console.log(pick(oldField, missingFormFields));
      }
    }
  }
}
