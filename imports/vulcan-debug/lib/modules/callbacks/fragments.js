import { registerFragment } from 'vulcan:lib';

registerFragment(`
  fragment CallbacksFragment on Callback {
    name
    iterator
    properties
    runs
    returns
    description
    hooks
  }
`);
