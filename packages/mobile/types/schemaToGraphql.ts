import {
  ZodFirstPartyTypeKind,
  ZodObject,
  ZodObjectDef,
  ZodOptionalDef,
  ZodRawShape,
  ZodType,
  ZodTypeDef,
} from "zod";

type TypeDef = ZodTypeDef & {
  typeName: ZodFirstPartyTypeKind,
}

const isZodSpecificType = (def: ZodTypeDef): def is TypeDef =>
  "typeName" in def;

const isOptionalType = (def: TypeDef): def is ZodOptionalDef =>
  def.typeName === "ZodOptional";

const isObjectType = (def: TypeDef): def is ZodObjectDef =>
  def.typeName === "ZodObject";

const simpleTypes = [
  "ZodNumber",
  "ZodString",
  "ZodBoolean",
  "ZodAny",
  "ZodArray",
];

const elementToGraphql = <T extends TypeDef>(name: string, def: T): string => {
  if (isOptionalType(def)) {
    return elementToGraphql(name, def.innerType._def);
  }
  if (isObjectType(def)) {
    return `${name} {\n ${shapeToGraphql(def.shape())} }`;
  }
  if (simpleTypes.includes(def.typeName)) {
    return name;
  }
  console.warn("Invalid type", def.typeName, " for ", name);
  return "";
}

const shapeToGraphql = (shape: Record<string, ZodType>) => {
  const keys = Object.keys(shape);
  let result = "";
  for (const key of keys) {
    const def = shape[key]._def;
    if (isZodSpecificType(def)) {
      result += elementToGraphql(key, def) + "\n";
    } else {
      result += key + "\n";
    }
  }
  return result;
}

export const schemaToGraphql = <T extends ZodRawShape>(schema: ZodObject<T>) =>
  shapeToGraphql(schema._def.shape());

export const compileTerms = (terms: Record<string, unknown>): string =>
  Object
    .keys(terms)
    .map((key) => `${key}: ${JSON.stringify(terms[key])}`)
    .join("\n") + "\n";
