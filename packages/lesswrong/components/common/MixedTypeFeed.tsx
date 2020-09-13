import React, {useRef} from 'react';
import { fragmentTextForQuery, registerComponent, Components } from '../../lib/vulcan-lib';
import { FeedRequest, FeedResponse, FeedLoaderComponent } from './InfiniteScroller'
import { useQuery } from 'react-apollo';
import gql from 'graphql-tag';

const getQuery = ({resolverName, extraVariables, sortKeyType, renderers}: {
  resolverName: string,
  extraVariables: any,
  sortKeyType: string,
  renderers: any,
}) => {
  const fragmentsUsed = Object.keys(renderers).map(r => renderers[r].fragmentName);
  return gql`
    query ${resolverName}Query($limit: Int, $cutoff: ${sortKeyType}${Object.keys(extraVariables).map(v=>`, $${v}: ${extraVariables[v]}`)}) {
      ${resolverName}(limit: $limit, cutoff: $cutoff${Object.keys(extraVariables).map(v=>`, ${v}: $${v}`)}) {
        cutoff
        results {
          type
          ${Object.keys(renderers).map(rendererName => `${rendererName} { ...${renderers[rendererName].fragmentName} }`)}
        }
      }
    }
    ${fragmentTextForQuery(fragmentsUsed)}
  `
}

const MixedTypeFeed = ({
  resolverName, extraVariables, extraVariablesValues, sortKeyType, renderers,
  limit=20, pageSize=20
}) => {
  const {InfiniteScroller} = Components;
  
  return <InfiniteScroller
    LoaderComponent={
      function FeedLoaderComponent({request, onLoadFinished}: {
        request: FeedRequest<Date>,
        onLoadFinished: (result: FeedResponse<Date,any>) => void
      }) {
        const query = getQuery({resolverName, extraVariables, sortKeyType, renderers});
        const callbackInvoked = useRef({invoked:false});
        const {data, loading, error} = useQuery(query, {
          variables: {
            ...extraVariablesValues,
            cutoff: request.cutoff,
            limit: request.limit,
          },
          ssr: true,
        });
        if (data && data[resolverName]) {
          if (!(callbackInvoked.current?.invoked)) {
            callbackInvoked.current.invoked = true;
            onLoadFinished({
              results: data[resolverName].results,
              cutoff: data[resolverName].cutoff,
              error,
            });
          }
        }
        return null;
      }
    }
    renderResult={(result: any) => {
      const renderFn = renderers[result.type].render;
      return renderFn(result[result.type]);
    }}
    endReached={<div>
      
    </div>}
    initialLimit={limit}
    pageSize={pageSize}
  />
}

const MixedTypeFeedComponent = registerComponent('MixedTypeFeed', MixedTypeFeed);

declare global {
  interface ComponentTypes {
    MixedTypeFeed: typeof MixedTypeFeedComponent,
  }
}

