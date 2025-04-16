/* eslint-disable no-console */
import { getSchema } from "@/lib/schema/allSchemas";
import { getAllCollections } from "../collections/allCollections";
import { join } from "path";
import { existsSync } from "fs";
import { readFile, writeFile } from "fs/promises";
import { userCanCreateField } from "@/lib/vulcan-users/permissions";
import uniq from "lodash/uniq";

function getCollectionPathPart(collectionName: CollectionNameString) {
  switch (collectionName) {
    case 'ArbitalCaches':
      return 'arbitalCache';
    case 'ReadStatuses':
      return 'readStatus';
    default:
      return collectionName[0].toLowerCase() + collectionName.slice(1);
  }
}

function permissionsAllowGuest(permissions: FieldPermissions) {
  if (permissions === 'guests') {
    return true;
  }
  if (Array.isArray(permissions)) {
    for (const perm of permissions) {
      if (permissionsAllowGuest(perm)) {
        return true;
      }
    }
  }
  return false;
}

function fixOutputTypeLine(outputTypeLine: string, needsExternalRequired: boolean, needsInternalRequired: boolean) {
  if (needsExternalRequired && needsInternalRequired) {
    return outputTypeLine.replace(']",', '!]!",');
  }

  if (needsExternalRequired) {
    return outputTypeLine.replace('",', '!",');
  }

  if (needsInternalRequired) {
    return outputTypeLine.replace(']",', '!]",');
  }

  return outputTypeLine;
}

function fixArrayInputTypeLine(inputTypeLine: string) {
  if (inputTypeLine.includes('!]')) {
    return inputTypeLine;
  }

  return inputTypeLine.replace(']', '!]');
}

export async function markFieldsRequired() {
  const collections = getAllCollections();

  for (const collection of collections) {
    const collectionName = collection.collectionName;
    const collectionPathPart = getCollectionPathPart(collectionName);
    const schemaFilePath = join(__dirname, `../../lib/collections/${collectionPathPart}/newSchema.ts`);

    if (!existsSync(schemaFilePath)) {
      console.log(`Schema file not found for collection ${collectionName} at ${schemaFilePath}`);
      continue;
    }

    const fieldsToFix: string[] = [];
    const arrayFieldsToFix: string[] = [];

    const schema = getSchema(collection.collectionName);
    for (const [name, field] of Object.entries(schema)) {
      if (field.graphql) {
        const dbNonnull = field.database && field.database.nullable === false;
        const dbArray = field.database && field.database.type.endsWith('[]');
        const fieldPermissionsGated = field.graphql.canRead && !permissionsAllowGuest(field.graphql.canRead);
        const outputType = field.graphql.outputType;
        const graphqlNullable = (typeof outputType !== 'string') || !outputType.endsWith("!");
        const graphqlInternalNullable = typeof outputType === 'string' && outputType.endsWith(']') && !outputType.endsWith('!]');
        const hasCustomResolver = !!field.graphql.resolver;
        if (graphqlNullable && dbNonnull && !fieldPermissionsGated && !hasCustomResolver) {
          fieldsToFix.push(name);
        }
        if (dbArray && graphqlInternalNullable) {
          arrayFieldsToFix.push(name);
        }
      }
    }

    if (fieldsToFix.length === 0) {
      continue;
    }

    const schemaFileContents = await readFile(schemaFilePath, 'utf8');
    const schemaFileLines = schemaFileContents.split('\n');

    const schemaDeclarationLine = schemaFileLines.findIndex(line => line.startsWith(`const schema = {`));
    if (schemaDeclarationLine === -1) {
      console.log(`Schema declaration not found for collection ${collectionName} at ${schemaFilePath}`);
      continue;
    }

    const schemaEndLine = schemaFileLines.slice(schemaDeclarationLine).findIndex(line => line.startsWith(`} satisfies`)) + schemaDeclarationLine;
    if (schemaEndLine === -1) {
      console.log(`Schema end not found for collection ${collectionName} at ${schemaFilePath}`);
      continue;
    }

    const schemaPrefix = schemaFileLines.slice(0, schemaDeclarationLine).join('\n');
    const schemaDeclarationLines = schemaFileLines.slice(schemaDeclarationLine, schemaEndLine + 1);
    const schemaSuffix = schemaFileLines.slice(schemaEndLine + 1).join('\n');

    // console.log(`Marking fields required for collection ${collectionName}, schema declaration lines start at ${schemaDeclarationLine} and end at ${schemaEndLine}`);
    
    for (const fieldName of uniq([...fieldsToFix, ...arrayFieldsToFix])) {
      const fieldOffsetLineIndex = schemaDeclarationLines.findIndex(line => line.startsWith(`  ${fieldName}: {`) || line.startsWith(`  ${fieldName}: DEFAULT_`));
      if (fieldOffsetLineIndex === -1) {
        console.log(`Field ${fieldName} not found for collection ${collectionName} at ${schemaFilePath}`);
        continue;
      }

      const withinFieldOutputTypeLineIndex = schemaDeclarationLines.slice(fieldOffsetLineIndex).findIndex(line => line.startsWith(`      outputType: "`));
      if (withinFieldOutputTypeLineIndex === -1) {
        console.log(`Field ${fieldName} on collection ${collectionName} output type line not found, can't mark as required`);
        continue;
      }

      const outputTypeLine = schemaDeclarationLines[withinFieldOutputTypeLineIndex + fieldOffsetLineIndex];
      if (!outputTypeLine.endsWith('",')) {
        console.log(`Field ${fieldName} on collection ${collectionName} output type doesn't end with '",', can't reliably mark as required.  Line contents: ${outputTypeLine}`);
        continue;
      }

      const needsExternalRequired = fieldsToFix.includes(fieldName);
      const needsInternalRequired = arrayFieldsToFix.includes(fieldName);

      const newOutputTypeLine = fixOutputTypeLine(outputTypeLine, needsExternalRequired, needsInternalRequired);
      schemaDeclarationLines[withinFieldOutputTypeLineIndex + fieldOffsetLineIndex] = newOutputTypeLine;

      // Handle inputType lines being the same as the new outputType line
      if (schema[fieldName].graphql && 'inputType' in schema[fieldName].graphql!) {
        const withinFieldInputTypeLineIndex = schemaDeclarationLines.slice(fieldOffsetLineIndex).findIndex(line => line.startsWith(`      inputType: "`));
        if (withinFieldInputTypeLineIndex === -1) {
          console.log(`Field ${fieldName} on collection ${collectionName} input type line not found, can't delete if redundant`);
          continue;
        }

        let inputTypeLine = schemaDeclarationLines[withinFieldInputTypeLineIndex + fieldOffsetLineIndex];
        const inputTypeLineSuffix = inputTypeLine.split(': ')[1];
        if (!inputTypeLineSuffix?.endsWith('",')) {
          console.log(`Field ${fieldName} on collection ${collectionName} input type doesn't end with '",', can't delete if redundant.  Line contents: ${inputTypeLine}`);
          continue;
        }

        if (needsInternalRequired) {
          inputTypeLine = fixArrayInputTypeLine(inputTypeLine);
          schemaDeclarationLines[withinFieldInputTypeLineIndex + fieldOffsetLineIndex] = inputTypeLine;
        }

        if (!needsExternalRequired) {
          continue;
        }

        const outputTypeLineSuffix = newOutputTypeLine.split(': ')[1];

        if (inputTypeLineSuffix === outputTypeLineSuffix) {
          schemaDeclarationLines.splice(withinFieldInputTypeLineIndex + fieldOffsetLineIndex, 1);
        } else {
          console.log(`Field ${fieldName} on collection ${collectionName} input type line is different from output type line, not redundant!  Input type line: ${inputTypeLine}, output type line: ${outputTypeLine}`);
        }
      } else {
        // No explicitly specified inputType, so in the case where the outputType used to be nullable and
        // it is in fact plausible that it can be null on create (i.e. because there's a defaultValue in the database)
        // we need to add a nullable inputType to preserve back-compat for creating new records
        const field = schema[fieldName];
        const canCreate = field.graphql?.canCreate;
        const fieldCreateableByMembers = userCanCreateField({} as DbUser, canCreate);

        const isUserId = fieldName === 'userId';
        const isDenormalizedField = !!field.database?.denormalized;
        const hasDefaultValue = typeof field.database?.defaultValue !== 'undefined';
        const needsInputType = isUserId || isDenormalizedField || hasDefaultValue || !fieldCreateableByMembers || await checkOnCreateAlwaysReturnsValue(field, fieldName, collectionName);

        if (needsInputType) {
          const originalOutputTypeLineSuffix = outputTypeLine.split(': ')[1];
          let newInputTypeLine = `      inputType: ${originalOutputTypeLineSuffix}`;
          if (needsInternalRequired) {
            newInputTypeLine = fixArrayInputTypeLine(newInputTypeLine);
          }
          schemaDeclarationLines.splice(withinFieldOutputTypeLineIndex + fieldOffsetLineIndex + 1, 0, newInputTypeLine);
        }
      }
    }

    const newSchemaFileContents = [schemaPrefix, ...schemaDeclarationLines, schemaSuffix].join('\n');
    // console.log(newSchemaFileContents);
    await writeFile(schemaFilePath, newSchemaFileContents);
  }
}

async function checkOnCreateAlwaysReturnsValue(field: CollectionFieldSpecification<CollectionNameString>, fieldName: string, collectionName: CollectionNameString) {
  if (!field.graphql || !('onCreate' in field.graphql) || !field.graphql.onCreate) {
    return false;
  }

  try {
    const value = await field.graphql.onCreate({} as any);
    return typeof value !== 'undefined';
  } catch (e) {
    console.error(`Error calling onCreate for field ${fieldName} on collection ${collectionName}: ${e}`);
    return false;
  }
}
