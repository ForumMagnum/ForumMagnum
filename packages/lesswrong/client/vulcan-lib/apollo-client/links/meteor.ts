import { ApolloLink } from 'apollo-link'
import { Accounts } from '../../../../lib/meteorAccounts';

// From https://github.com/apollographql/meteor-integration/blob/master/src/client.js
const DEFAULT_HEADER = 'authorization'

const createMeteorAccountsLink = ({ headerName = DEFAULT_HEADER } = {}) =>
  new ApolloLink((operation: any, forward: any) => {
    const token = Accounts._storedLoginToken()

    if (token) {
      operation.setContext(() => ({
        headers: {
          [headerName]: token
        }
      }))
    }

    return forward(operation)
  })

const meteorAccountsLink = createMeteorAccountsLink();
export default meteorAccountsLink;
