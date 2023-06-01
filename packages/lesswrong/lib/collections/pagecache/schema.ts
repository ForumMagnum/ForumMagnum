const schema: SchemaType<DbAdvisorRequest> = {
  path: {
    type: String
  },
  abTestGroups: {
    // TODO make this a SimpleSchema Record<string, string>
    type: Object,
    blackbox: true
  },
  bundleHash: {
    type: String
  },
  renderedAt: {
    type: Date
  },
  ttlMs: {
    type: Number
  },
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
  renderResult: {
    // TODO make this type as above
    type: Object,
    blackbox: true
  }
};

export default schema;
