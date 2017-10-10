import { graphql, gql } from 'react-apollo';

export const withUserAgent = graphql(gql`query userAgent { userAgent }`, {
  props: ({ ownProps, data }) => {
    const { loading, error, userAgent } = data;
    if (loading || error)
      return { loading, error };
    return {
      userAgent
    }
  }
});
