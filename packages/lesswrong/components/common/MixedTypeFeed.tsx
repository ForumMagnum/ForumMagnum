import React from 'react';
import { fragmentTextForQuery, registerComponent, Components } from '../../lib/vulcan-lib';
import { useQuery } from 'react-apollo';
import gql from 'graphql-tag';

/*export const useFeed = ({skip, resolverName, fragmentName, render}: {
  skip: boolean,
  resolverName: string,
  fragmentName: FragmentTypeName,
  variables: any,
  render: any,
}): {
  components: any,
  feed: Array<React.ReactNode>,
  loading: boolean,
  loadMore: any,
} => {
  // TODO
  return {} as any;
}*/

const MixedTypeFeed = ({resolverName, fragmentName, extraVariables, extraVariablesValues, sortKeyType, renderers}: {
  resolverName: string,
  fragmentName: any,
  extraVariables: any,
  extraVariablesValues: any,
  sortKeyType: string,
  renderers: any,
}) => {
  const fragmentsUsed = Object.keys(renderers).map(r => renderers[r].fragmentName);
  const {data, loading} = useQuery(gql`
    query ${resolverName}($limit: Int, $cutoff: Date${Object.keys(extraVariables).map(v=>`, $${v}: ${extraVariables[v]}`)}) {
      ${resolverName}(limit: $limit, cutoff: $cutoff${Object.keys(extraVariables).map(v=>`, ${v}: $${v}`)}) {
        type
        ${Object.keys(renderers).map(rendererName => `${rendererName} { ...${renderers[rendererName].fragmentName} }`)}
      }
    }
    ${fragmentTextForQuery(fragmentsUsed)}
  `, {
    variables: extraVariablesValues,
    ssr: true,
  });
  const { Loading } = Components;
  
  if (loading || !data)
    return <Loading/>
  
  return <>
    {data[resolverName] && data[resolverName].map(result => {
      const renderFn = renderers[result.type].render;
      return renderFn(result[result.type]);
    })}
  </>
}

const MixedTypeFeedComponent = registerComponent('MixedTypeFeed', MixedTypeFeed);

declare global {
  interface ComponentTypes {
    MixedTypeFeed: typeof MixedTypeFeedComponent,
  }
}



