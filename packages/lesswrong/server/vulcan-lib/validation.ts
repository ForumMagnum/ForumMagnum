import pickBy from 'lodash/pickBy';
import mapValues from 'lodash/mapValues';
import { userCanCreateField, userCanUpdateField } from '../../lib/vulcan-users/permissions';
import * as _ from 'underscore';
import { collectionNameToTypeName } from '@/lib/generated/collectionTypeNames';

interface SimpleSchemaValidationError {
  type: string;
  [key: string]: number | string;
}

export const dataToModifier = <
  N extends CollectionNameString,
  T extends UpdateInputsByCollectionName[N]['data'] | Partial<ObjectsByCollectionName[N]>
>(data: T, schema: SchemaType<N>): MongoModifier => {
  const modifier: MongoModifier = {
    $set: pickBy(data, f => f !== null),
    $unset: mapValues(pickBy(data, f => f === null), () => true),
  };

  // If the field is a nullable string and we're trying to set it to the
  // empty-string, just unset it to null instead
  for (const field in modifier.$set) {
    const graphQLSpec = schema[field].graphql;
    if (
      modifier.$set[field] === "" &&
      graphQLSpec?.outputType === "String" &&
      graphQLSpec.validation?.optional
    ) {
      modifier.$unset[field] = true;
      delete modifier.$set[field];
    }
  }

  return modifier;
}

export const modifierToData = (modifier: MongoModifier): any => ({
  ...modifier.$set,
  ...mapValues(modifier.$unset, () => null),
});

/*

  If document is not trusted, run validation steps:

  1. Check that the current user has permission to edit each field
  2. Run SimpleSchema validation step

*/
export const validateDocument = <N extends CollectionNameString, D extends {} = CreateInputsByCollectionName[N]['data']>(
  document: D,
  collectionName: N,
  context: ResolverContext,
) => {
  const { currentUser } = context;
  const { getSchema, getSimpleSchema }: typeof import('../../lib/schema/allSchemas') = require('../../lib/schema/allSchemas');

  const schema = getSchema(collectionName);

  let validationErrors: Array<any> = [];

  // Check validity of inserted document
  Object.keys(document).forEach(fieldName => {
    const fieldSchema = schema[fieldName];

    // 1. check that the current user has permission to insert each field
    if (!fieldSchema?.graphql || !userCanCreateField(currentUser, fieldSchema.graphql.canCreate)) {
      validationErrors.push({
        id: 'errors.disallowed_property_detected',
        properties: { name: fieldName },
      });
    }
  });

  // 5. run SS validation
  const validationContext = getSimpleSchema(collectionName).newContext();
  validationContext.validate(document);

  if (!validationContext.isValid()) {
    const errors = validationContext.validationErrors();
    errors.forEach((error: SimpleSchemaValidationError) => {
      // eslint-disable-next-line no-console
      // console.log(error);
      if (error.type.includes('intlError')) {
        const intlError = JSON.parse(error.type.replace('intlError|', ''));
        validationErrors = validationErrors.concat(intlError);
      } else {
        const typeName = collectionNameToTypeName[collectionName];

        validationErrors.push({
          id: `errors.${error.type}`,
          path: error.name,
          properties: {
            collectionName: collectionName,
            typeName: typeName,
            ...error,
          },
        });
      }
    });
  }

  return validationErrors;
};

/*

  If document is not trusted, run validation steps:

  1. Check that the current user has permission to insert each field
  2. Run SimpleSchema validation step
  
*/
const validateModifier = <N extends CollectionNameString>(
  modifier: MongoModifier,
  schema: Record<string, CollectionFieldSpecification<N>>,
  document: any,
  collectionName: N,
  context: ResolverContext,
) => {
  const { currentUser } = context;

  const set = modifier.$set;
  const unset = modifier.$unset;

  let validationErrors: Array<any> = [];

  // 1. check that the current user has permission to edit each field
  const modifiedProperties = _.keys(set).concat(_.keys(unset));
  modifiedProperties.forEach(function(fieldName) {
    var field = schema[fieldName];
    if (!field?.graphql || !userCanUpdateField(currentUser, field.graphql.canUpdate, document)) {
      validationErrors.push({
        id: 'errors.disallowed_property_detected',
        properties: { name: fieldName },
      });
    }
  });

  // 2. run SS validation
  const { getSimpleSchema }: typeof import('../../lib/schema/allSchemas') = require('../../lib/schema/allSchemas');
  const validationContext = getSimpleSchema(collectionName).newContext();
  validationContext.validate({ $set: set, $unset: unset }, { modifier: true });

  if (!validationContext.isValid()) {
    const errors = validationContext.validationErrors();
    errors.forEach((error: SimpleSchemaValidationError) => {
      // eslint-disable-next-line no-console
      // console.log(error);
      if (error.type.includes('intlError')) {
        validationErrors = validationErrors.concat(JSON.parse(error.type.replace('intlError|', '')));
      } else {
        const typeName = collectionNameToTypeName[collectionName];

        validationErrors.push({
          id: `errors.${error.type}`,
          path: error.name,
          properties: {
            collectionName: collectionName,
            typeName: typeName,
            ...error,
          },
        });
      }
    });
  }

  return validationErrors;
};

export const validateData = <N extends CollectionNameString>(
  data: CreateInputsByCollectionName[N]['data'],
  document: ObjectsByCollectionName[N] | DbInsertion<ObjectsByCollectionName[N]>,
  collectionName: N,
  context: ResolverContext,
) => {
  const { getSchema }: typeof import('../../lib/schema/allSchemas') = require('../../lib/schema/allSchemas');
  const schema = getSchema(collectionName);
  const modifier = dataToModifier(data, schema);
  return validateModifier(modifier, schema, document, collectionName, context);
};
