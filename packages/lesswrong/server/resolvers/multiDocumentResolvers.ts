import { MultiDocuments } from "@/lib/collections/multiDocuments/collection";
import { GraphQLJSON } from "graphql-type-json";

import { augmentFieldsDict } from "@/lib/utils/schemaUtils";
import { getToCforMultiDocument } from "../tableOfContents";

augmentFieldsDict(MultiDocuments, {
  tableOfContents: {
    resolveAs: {
      arguments: 'version: String',
      type: GraphQLJSON,
      resolver: async (document: DbMultiDocument, args: { version: string | null }, context: ResolverContext) => {
        return await getToCforMultiDocument({ document, version: args.version, context });
      },
    },
  },
});
