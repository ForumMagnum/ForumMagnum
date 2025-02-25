import { graphql } from '@apollo/client/react/hoc';
import { useMutation, gql, OperationVariables } from '@apollo/client';
import { getFragment } from '../vulcan-lib/fragments';
import * as _ from 'underscore';

/**
 * HoC for an arbitrary GraphQL mutation, which assembles a graphql query string
 * from parts. DEPRECATED: you probably want to use Apollo's useMutation instead.
 */
export function withMutation({name, args, fragmentName}: {
  name: string,
  args: any,
  fragmentName?: FragmentName,
}) {
  let mutation, fragment, fragmentBlock = '';

  if (fragmentName) {
    fragment = getFragment(fragmentName);
    fragmentBlock = `{
      ...${fragmentName}
    }`;
  }
  
  if (args) {
    const args1 = _.map(args, (type, name) => `$${name}: ${type}`); // e.g. $url: String
    const args2 = _.map(args, (type, name) => `${name}: $${name}`); // e.g. $url: url
    mutation = `
      mutation ${name}(${args1}) {
        ${name}(${args2})${fragmentBlock}
      }
    `;
  } else {
    mutation = `
      mutation ${name} {
        ${name}${fragmentBlock}
      }
    `;
  }
  
  return graphql(gql`${mutation}${fragmentName ? fragment : ''}`, {
    alias: 'withMutation',
    props: ({ownProps, mutate}: any) => ({
      [name]: (vars: any) => {
        return mutate({ 
          variables: vars,
        });
      }
    }),
  });
}

/**
 * Wrapper around Apollo's useMutation which assembles a GraphQL query from
 * pieces. DEPRECATED: This doesn't really provide any value over calling
 * Apollo's `useMutation`, which is more transparent/direct.
 */
export function useNamedMutation<ArgsType extends OperationVariables>({name, graphqlArgs, fragmentName}: {
  name: string,
  graphqlArgs: any,
  fragmentName?: keyof FragmentTypes,
}) {
  let mutation, fragment, fragmentBlock = '';

  if (fragmentName) {
    fragment = getFragment(fragmentName);
    fragmentBlock = `{
      ...${fragmentName}
    }`;
  }
  
  if (graphqlArgs) {
    const args1 = _.map(graphqlArgs, (type, name) => `$${name}: ${type}`); // e.g. $url: String
    const args2 = _.map(graphqlArgs, (type, name) => `${name}: $${name}`); // e.g. $url: url
    mutation = `
      mutation ${name}(${args1}) {
        ${name}(${args2})${fragmentBlock}
      }
    `;
  } else {
    mutation = `
      mutation ${name} {
        ${name}${fragmentBlock}
      }
    `;
  }
  
  const [mutate, { loading }] = useMutation(gql`${mutation}${fragmentName ? fragment : ''}`);
  return {mutate: async (variables: ArgsType) => {
    return await mutate({ variables });
  }, loading};
}

