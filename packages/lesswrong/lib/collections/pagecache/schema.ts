import SimpleSchema from "simpl-schema";

// export type RenderResult = {
//   ssrBody: string
//   headers: Array<string>
//   serializedApolloState: string
//   serializedForeignApolloState: string
//   jssSheets: string
//   status: number|undefined,
//   redirectUrl: string|undefined
//   relevantAbTestGroups: RelevantTestGroupAllocation
//   allAbTestGroups: CompleteTestGroupAllocation
//   themeOptions: AbstractThemeOptions,
//   renderedAt: Date,
//   timings: RenderTimings
// }
const RenderResultSchemaType = new SimpleSchema({
  ssrBody: {
    type: String,
  },
  headers: {
    type: Array,
  },
  "headers.$": {
    type: String,
  },
  serializedApolloState: {
    type: String,
  },
  serializedForeignApolloState: {
    type: String,
  },
  jssSheets: {
    type: String,
  },
  status: {
    type: Number,
    optional: true,
  },
  redirectUrl: {
    type: String,
    optional: true,
  },
  relevantAbTestGroups: {
    type: Object,
    blackbox: true,
  },
  allAbTestGroups: {
    type: Object,
    blackbox: true,
  },
  themeOptions: {
    type: Object,
    blackbox: true,
  },
  renderedAt: {
    type: Date,
  },
  timings: {
    type: Object,
    blackbox: true,
  },
});

const schema: SchemaType<DbPageCacheEntry> = {
  path: {
    type: String,
    nullable: false,
  },
  abTestGroups: {
    // This is always a Record<string, string>
    type: Object,
    blackbox: true,
    nullable: false,
  },
  bundleHash: {
    type: String,
    nullable: false,
  },
  renderedAt: {
    type: Date,
    nullable: false,
  },
  expiresAt: {
    type: Date,
    nullable: false,
  },
  ttlMs: {
    // This can be inferred from renderedAt and expiresAt, but it's useful to have for debugging
    type: Number,
    nullable: false,
  },
  renderResult: {
    type: RenderResultSchemaType,
    nullable: false,
  },
};

export default schema;
