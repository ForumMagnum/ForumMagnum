import React from 'react';
import { Components, registerComponent } from '@/lib/vulcan-lib/components';

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
 *       return <LoadingOrErrorPage found={!!document} loading={loading} error={error}/>
 *     }
 *   }
 *
 */
const LoadingOrErrorPage = ({found, loading, error}: {
  found: boolean
  loading: boolean
  error: any
}) => {
  const {SingleColumnSection, Loading, ErrorPage, Error404} = Components;

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

const LoadingOrErrorPageComponent = registerComponent('LoadingOrErrorPage', LoadingOrErrorPage);

declare global {
  interface ComponentTypes {
    LoadingOrErrorPage: typeof LoadingOrErrorPageComponent
  }
}

