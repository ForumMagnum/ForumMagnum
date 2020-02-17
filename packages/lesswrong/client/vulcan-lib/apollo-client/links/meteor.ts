import { ApolloLink } from 'apollo-link'
import { Accounts } from 'meteor/accounts-base'

// From https://github.com/apollographql/meteor-integration/blob/master/src/client.js
const DEFAULT_HEADER = 'authorization'

const MeteorAccountsLink = ({ headerName = DEFAULT_HEADER } = {}) =>
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

const meteorAccountsLink = MeteorAccountsLink();
export default meteorAccountsLink;
