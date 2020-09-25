import React, {useRef} from 'react';
import { fragmentTextForQuery, registerComponent, Components } from '../../lib/vulcan-lib';
import { FeedRequest, FeedResponse, FeedLoaderComponent } from './InfiniteScroller'
import { useQuery } from 'react-apollo';
import gql from 'graphql-tag';

const getQuery = ({resolverName, resolverArgs, fragmentArgs, sortKeyType, renderers}: {
  resolverName: string,
  resolverArgs: any,
  fragmentArgs: any,
  sortKeyType: string,
  renderers: any,
}) => {
  const fragmentsUsed = Object.keys(renderers).map(r => renderers[r].fragmentName);
  const queryArgsList=["$limit: Int", "$cutoff: Date",
    ...(resolverArgs ? Object.keys(resolverArgs).map(k => `$${k}: ${resolverArgs[k]}`) : []),
    ...(fragmentArgs ? Object.keys(fragmentArgs).map(k => `$${k}: ${fragmentArgs[k]}`) : []),
  ];
  const resolverArgsList=["limit: $limit", "cutoff: $cutoff",
    ...(resolverArgs ? Object.keys(resolverArgs).map(k => `${k}: $${k}`) : []),
  ];
  
  return gql`
    query ${resolverName}Query(${queryArgsList.join(", ")}) {
      ${resolverName}(${resolverArgsList.join(", ")}) {
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

const MixedTypeFeed = (args: {
  resolverName: string,
  resolverArgs?: Partial<Record<string,string>>,
  resolverArgsValues?: Partial<Record<string,any>>,
  fragmentArgs?: Partial<Record<string,string>>,
  fragmentArgsValues?: Partial<Record<string,any>>,
  sortKeyType: string,
  renderers: any,
  limit?: number, pageSize?: number
}) => {
  const { resolverName, resolverArgs=null, resolverArgsValues=null, fragmentArgs=null, fragmentArgsValues=null, sortKeyType, renderers, limit=20, pageSize=20 } = args;
  const {InfiniteScroller} = Components;
  
  return <InfiniteScroller
    LoaderComponent={
      function FeedLoaderComponent({request, onLoadFinished}: {
        request: FeedRequest<Date>,
        onLoadFinished: (result: FeedResponse<Date,any>) => void
      }) {
        const query = getQuery({resolverName, resolverArgs, fragmentArgs, sortKeyType, renderers});
        const callbackInvoked = useRef({invoked:false});
        const {data, loading, error} = useQuery(query, {
          variables: {
            ...resolverArgsValues,
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

