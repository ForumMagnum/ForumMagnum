import { makeExecutableSchema } from "graphql-tools";
import { typeDefs, resolvers } from "../vulcan-lib/apollo-server/initGraphQL";
import { GraphQLInputObjectType, GraphQLObjectType, InputObjectTypeDefinitionNode, ObjectTypeDefinitionNode, TypeNode } from "graphql";
import { graphqlTypeToCollectionName } from "@/lib/vulcan-lib/collections";
import { isValidCollectionName, getAllCollections } from "../collections/allCollections";
import { typeNameToCollectionName } from "@/lib/generated/collectionTypeNames";

interface ParsedType {
  type: string;
  nullable: boolean;
}

function convertParsedTypeNodeToTypescriptType(parsedType: ParsedType): string {
  const nullableSuffix = parsedType.nullable ? ' | null' : '';
  switch (parsedType.type) {
    case 'Int':
      return 'number' + nullableSuffix;
    case 'Boolean':
      return 'boolean' + nullableSuffix;
    case 'String':
      return 'string' + nullableSuffix;
    case 'Date':
      return 'Date' + nullableSuffix;
    case 'Float':
      return 'number' + nullableSuffix;
    case 'JSON':
      return 'any';
    default: {
      if (isValidCollectionName(graphqlTypeToCollectionName(parsedType.type))) {
        return `Update${parsedType.type}DataInput${nullableSuffix}`;
      } else {
        return parsedType.type + nullableSuffix;
      }
    }
  }
}

function parseTypeNode(typeNode: TypeNode): ParsedType {
  switch (typeNode.kind) {
    case 'NamedType': {
      return { type: typeNode.name.value, nullable: true };
    }
    case 'ListType': {
      const childType = parseTypeNode(typeNode.type);
      const childTypeString = convertParsedTypeNodeToTypescriptType(childType);
      return { type: `Array<${childTypeString}>`, nullable: true };
    }
    case 'NonNullType': {
      const childType = parseTypeNode(typeNode.type);
      return { type: childType.type, nullable: false };
    }
  }
}

function generateInputType(inputType: InputObjectTypeDefinitionNode | ObjectTypeDefinitionNode) {
  const fields = inputType.fields ?? [];
  if (fields.length === 0) {
    return {
      interfaceString: 'never',
      typeName: inputType.name.value,
    };
  }
  const fieldTypes = fields.map(field => {
    const parsedType = parseTypeNode(field.type);
    const convertedType = convertParsedTypeNodeToTypescriptType(parsedType);
    const convertedTypeIsAny = convertedType === 'any';
    const typeIsNullable = parsedType.nullable;
    const makeOptional = (convertedTypeIsAny || typeIsNullable) ? '?' : '';
    return `${field.name.value}${makeOptional}: ${convertedType}`;
  });

  const interfaceString = `interface ${inputType.name.value} {\n  ${fieldTypes.join(';\n  ')};\n}`;
  return {
    interfaceString,
    typeName: inputType.name.value,
  }
}

type GeneratableObjectType =
  | GraphQLInputObjectType & { astNode: InputObjectTypeDefinitionNode }
  | GraphQLObjectType & { astNode: ObjectTypeDefinitionNode };

export function generateInputTypes() {
  const schema = makeExecutableSchema({ typeDefs, resolvers });
  const types = Object.values(schema.getTypeMap());
  const inputTypes = types.filter((t): t is GeneratableObjectType => {
    return t.astNode?.kind === 'InputObjectTypeDefinition' || t.astNode?.kind === 'ObjectTypeDefinition';
  });

  const nonCollectionTypes = inputTypes.filter(t => !isValidCollectionName(graphqlTypeToCollectionName(t.astNode.name.value)));
  const inputTypeDefinitions = inputTypes.map(t => generateInputType(t.astNode));
  const inputTypesString = inputTypeDefinitions.filter(t => t.interfaceString !== 'never').map(t => t.interfaceString).join('\n\n');
  const typeNames = inputTypeDefinitions.map(t => t.typeName);

  const allCollectionNames = getAllCollections().map(c => c.collectionName);

  const createInputTypeNames = typeNames.filter((t): t is keyof typeof typeNameToCollectionName => (
    t.startsWith('Create')
    && t.endsWith('Input')
    && isValidCollectionName(typeNameToCollectionName[t.slice(6, -5) as keyof typeof typeNameToCollectionName])
  ));

  const createInputTypeNamePairs = createInputTypeNames.map(t => [t, typeNameToCollectionName[t.slice(6, -5) as keyof typeof typeNameToCollectionName]] as const);

  // const createInputCollectionNames = createInputTypeNames.map(t => graphqlTypeToCollectionName(t.slice(6, -5)));

  const createInputMapFields = createInputTypeNamePairs.map(([t, c]) => `${c}: ${t}`).join(';\n  ');
  const createInputNeverMapFields = allCollectionNames.filter(c => !createInputTypeNamePairs.some(([_, c2]) => c2 === c)).map(c => `${c}: never`).join(';\n  ');
  const createInputByCollectionName = `interface CreateInputsByCollectionName {\n  ${createInputMapFields};\n  ${createInputNeverMapFields};\n}`;

  const updateInputTypeNames = typeNames.filter((t): t is keyof typeof typeNameToCollectionName => (
    t.startsWith('Update')
    && t.endsWith('Input')
    && isValidCollectionName(typeNameToCollectionName[t.slice(6, -5) as keyof typeof typeNameToCollectionName])
  ));

  const updateInputTypeNamePairs = updateInputTypeNames.map(t => [t, typeNameToCollectionName[t.slice(6, -5) as keyof typeof typeNameToCollectionName]] as const);

  const updateInputMapFields = updateInputTypeNamePairs.map(([t, c]) => `${c}: ${t}`).join(';\n  ');
  const updateInputNeverMapFields = allCollectionNames.filter(c => !updateInputTypeNamePairs.some(([_, c2]) => c2 === c)).map(c => `${c}: never`).join(';\n  ');
  const updateInputByCollectionName = `interface UpdateInputsByCollectionName {\n  ${updateInputMapFields};\n  ${updateInputNeverMapFields};\n}`;
  
  const typeMapString = `interface GraphQLTypeMap {\n  ${typeNames.map(t => `${t}: ${t}`).join(';\n  ')};\n}`;
  return inputTypesString + '\n\n' + typeMapString + '\n\n' + createInputByCollectionName + '\n\n' + updateInputByCollectionName + '\n';
}
