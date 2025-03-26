import pickBy from 'lodash/pickBy';
import mapValues from 'lodash/mapValues';
import { userCanCreateField, userCanUpdateField } from '../../lib/vulcan-users/permissions';
import * as _ from 'underscore';

interface SimpleSchemaValidationError {
  type: string;
  [key: string]: number | string;
}

export const dataToModifier = <T extends DbObject>(data: Partial<DbInsertion<T>>): MongoModifier<DbInsertion<T>> => ({ 
  $set: pickBy(data, f => f !== null), 
  $unset: mapValues(pickBy(data, f => f === null), () => true),
});

export const modifierToData = <T extends DbObject>(modifier: MongoModifier<T>): any => ({
  ...modifier.$set,
  ...mapValues(modifier.$unset, () => null),
});

/*

  If document is not trusted, run validation steps:

  1. Check that the current user has permission to edit each field
  2. Run SimpleSchema validation step

*/
export const validateDocument = <N extends CollectionNameString>(
  document: Partial<DbInsertion<ObjectsByCollectionName[N]>>,
  collection: CollectionBase<N>,
  context: ResolverContext,
) => {
  const { currentUser } = context;
  const { getSchema, getSimpleSchema }: typeof import('../../lib/schema/allSchemas') = require('../../lib/schema/allSchemas');

  const schema = getSchema(collection.collectionName);

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
  const validationContext = getSimpleSchema(collection.collectionName).newContext();
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
        validationErrors.push({
          id: `errors.${error.type}`,
          path: error.name,
          properties: {
            collectionName: collection.collectionName,
            typeName: collection.typeName,
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
export const validateModifier = <N extends CollectionNameString>(
  modifier: MongoModifier<DbInsertion<ObjectsByCollectionName[N]>>,
  document: any,
  collection: CollectionBase<N>,
  context: ResolverContext,
) => {
  const { currentUser } = context;

  const { getSchema, getSimpleSchema }: typeof import('../../lib/schema/allSchemas') = require('../../lib/schema/allSchemas');

  const schema = getSchema(collection.collectionName);
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
  const validationContext = getSimpleSchema(collection.collectionName).newContext();
  validationContext.validate({ $set: set, $unset: unset }, { modifier: true });

  if (!validationContext.isValid()) {
    const errors = validationContext.validationErrors();
    errors.forEach((error: SimpleSchemaValidationError) => {
      // eslint-disable-next-line no-console
      // console.log(error);
      if (error.type.includes('intlError')) {
        validationErrors = validationErrors.concat(JSON.parse(error.type.replace('intlError|', '')));
      } else {
        validationErrors.push({
          id: `errors.${error.type}`,
          path: error.name,
          properties: {
            collectionName: collection.collectionName,
            typeName: collection.typeName,
            ...error,
          },
        });
      }
    });
  }

  return validationErrors;
};

export const validateData = <N extends CollectionNameString>(
  data: Partial<DbInsertion<ObjectsByCollectionName[N]>>,
  document: ObjectsByCollectionName[N],
  collection: CollectionBase<N>,
  context: ResolverContext,
) => {
  return validateModifier(dataToModifier(data), document, collection, context);
};
