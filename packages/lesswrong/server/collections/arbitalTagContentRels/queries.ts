import schema from "@/lib/collections/arbitalTagContentRels/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";
import { CollectionViewSet } from "@/lib/views/collectionViewSet";

export const graphqlArbitalTagContentRelQueryTypeDefs = gql`
  type ArbitalTagContentRel ${ getAllGraphQLFields(schema) }
  
  input SingleArbitalTagContentRelInput {
    selector: SelectorInput
    resolverArgs: JSON
  }
  
  type SingleArbitalTagContentRelOutput {
    result: ArbitalTagContentRel
  }
  
  input ArbitalTagContentRelViewInput
  
  input ArbitalTagContentRelSelector @oneOf {
    default: ArbitalTagContentRelViewInput
  }
  
  input MultiArbitalTagContentRelInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
  }
  
  type MultiArbitalTagContentRelOutput {
    results: [ArbitalTagContentRel]
    totalCount: Int
  }
  
  extend type Query {
    arbitalTagContentRel(
      input: SingleArbitalTagContentRelInput @deprecated(reason: "Use the selector field instead"),
      selector: SelectorInput
    ): SingleArbitalTagContentRelOutput
    arbitalTagContentRels(
      input: MultiArbitalTagContentRelInput @deprecated(reason: "Use the selector field instead"),
      selector: ArbitalTagContentRelSelector,
      limit: Int,
      offset: Int,
      enableTotal: Boolean
    ): MultiArbitalTagContentRelOutput
  }
`;
export const arbitalTagContentRelGqlQueryHandlers = getDefaultResolvers('ArbitalTagContentRels', new CollectionViewSet('ArbitalTagContentRels', {}));
export const arbitalTagContentRelGqlFieldResolvers = getFieldGqlResolvers('ArbitalTagContentRels', schema);
