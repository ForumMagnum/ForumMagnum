import { onError } from '@apollo/client/link/error';

const locationsToStr = (locations:Array<any> = []) => locations.map(({column, line}) => `line ${line}, col ${column}`).join(';');

const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors)
    graphQLErrors.map(({ message, locations, path }) => {
      const locationStr = locations && locationsToStr([...locations])
      // eslint-disable-next-line no-console
      console.log(`[GraphQL error]: Message: ${message}, Location: ${locationStr}, Path: ${path}`);
    });
  if (networkError) {
    // eslint-disable-next-line no-console
    console.log(`[Network error]: ${networkError}`);
  }
});

export default errorLink;
