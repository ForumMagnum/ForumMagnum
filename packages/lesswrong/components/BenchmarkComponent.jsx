import { Components, registerComponent } from 'meteor/vulcan:core';
import gql from 'graphql-tag';
import { useQuery } from 'react-apollo';

const BenchmarkComponent = () => {
  useQuery(gql`
    query asyncBenchmarkQuery {
      currentUser {
        asyncBenchmark
      }
    }
  `, {
    fetchPolicy: 'cache-then-network',
    variables: { input: { } },
    ssr: true,
  });
  
  return null;
}

registerComponent("BenchmarkComponent", BenchmarkComponent);
