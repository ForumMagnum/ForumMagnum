import React from 'react';
import { registerComponent } from '@/lib/vulcan-lib/components';
import { SingleColumnSection } from "./SingleColumnSection";
import { Loading } from "../vulcan-core/Loading";
import { ErrorPage } from "./ErrorPage";
import { Error404 } from "./Error404";

/**
 * A component for handling the case where you have a page that loads something
 * with a useSingle resulting in a loading flag, an optional result object, and
 * an optional error object, and if the result object is missing you want to
 * choose between a loading state, a 404 page, or an error page.
 *
 * An example usage would be:
 *   const SamplePage() {
 *     const { document, loading, error } = useSingle(...);
 *     if (!document) {
 *       return <LoadingOrErrorPage loading={loading} error={error}/>
 *     }
 *   }
 *
 */
const LoadingOrErrorPageInner = ({loading, error}: {
  loading: boolean
  error: any
}) => {
  if (loading) {
    return <SingleColumnSection>
      <Loading/>
    </SingleColumnSection>
  } else if (error) {
    return <ErrorPage error={error}/>
  } else {
    return <Error404/>
  }
}

export const LoadingOrErrorPage = registerComponent('LoadingOrErrorPage', LoadingOrErrorPageInner);

declare global {
  interface ComponentTypes {
    LoadingOrErrorPage: typeof LoadingOrErrorPage
  }
}

