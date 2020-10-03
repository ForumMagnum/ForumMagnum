import React, {useRef} from 'react';
import { fragmentTextForQuery, registerComponent, Components } from '../../lib/vulcan-lib';
import { FeedRequest, FeedResponse } from './InfiniteScroller'
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

interface FeedRenderer<FragmentName extends keyof FragmentTypes> {
  fragmentName: FragmentName,
  render: (result: FragmentTypes[FragmentName]) => React.ReactNode,
}

// An infinitely scrolling feed of elements, which may be of multiple types.
// This should have a corresponding server-side resolver created using
// `defineFeedResolver`.
const MixedTypeFeed = (args: {
  resolverName: string,
  
  // Types for parameters given to the resolver, as an object mapping from
  // argument names to graphQL type strings.
  resolverArgs?: Partial<Record<string,string>>,
  
  // Values for parameters given to the resolver, as an object mapping
  // from argument names to graphQL type strings.
  resolverArgsValues?: Partial<Record<string,any>>,
  
  // Types for extra arguments used in result fragments, as an object mapping
  // from argument names to graphQL type strings.
  fragmentArgs?: Partial<Record<string,string>>,
  
  // Values for extra arguments used in result fragments, as an object mapping
  // from argument names to argument values.
  fragmentArgsValues?: Partial<Record<string,any>>,
  
  // GraphQL name of the type results are sorted by.
  sortKeyType: string,
  
  // Renderers to convert results into React nodes.
  renderers: Partial<Record<string,FeedRenderer<any>>>,
  
  // The number of elements on the first page, which is included with SSR.
  firstPageSize?: number,
  
  // The number of elements per page, on pages other than the first page.
  pageSize?: number
}) => {
  const { resolverName, resolverArgs=null, resolverArgsValues=null, fragmentArgs=null, fragmentArgsValues=null, sortKeyType, renderers, firstPageSize=20, pageSize=20 } = args;
  const {InfiniteScroller, Loading} = Components;
  const query = getQuery({resolverName, resolverArgs, fragmentArgs, sortKeyType, renderers});
  
  const {data: firstPageData, error: firstPageError} = useQuery(query, {
    variables: {
      ...resolverArgsValues,
      cutoff: null,
      limit: firstPageSize,
    },
    ssr: true,
  });
  const firstPageResult: FeedResponse<Date,any>|null = firstPageData && firstPageData[resolverName] ? {
    results: firstPageData[resolverName].results,
    cutoff: firstPageData[resolverName].cutoff,
    error: firstPageError,
  } : null;
  
  return firstPageResult ? <InfiniteScroller
    firstPage={firstPageResult}
    LoaderComponent={
      function FeedLoaderComponent({request, onLoadFinished}: {
        request: FeedRequest<Date>,
        onLoadFinished: (result: FeedResponse<Date,any>) => void
      }) {
        const callbackInvoked = useRef({invoked:false});
        const {data, error} = useQuery(query, {
          variables: {
            ...resolverArgsValues,
            ...fragmentArgsValues,
            cutoff: request.cutoff,
            limit: request.limit,
          },
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
      const renderFn = renderers[result.type]?.render;
      return renderFn ? renderFn(result[result.type]) : result[result.type];
    }}
    endReached={<div>
      
    </div>}
    pageSize={pageSize}
  /> : <Loading/>
}

const MixedTypeFeedComponent = registerComponent('MixedTypeFeed', MixedTypeFeed);

declare global {
  interface ComponentTypes {
    MixedTypeFeed: typeof MixedTypeFeedComponent,
  }
}

