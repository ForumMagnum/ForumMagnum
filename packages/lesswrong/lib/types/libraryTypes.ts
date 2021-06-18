
declare module "deepmerge" {
  export default function deepmerge(a: any, b: any, options?: {isMergeableObject: any}): any
}

declare module "@shelf/jest-mongodb/setup" {
  export default function jestMongoSetup(): Promise<void>
}
