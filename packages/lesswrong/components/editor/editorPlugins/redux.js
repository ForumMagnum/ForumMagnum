/*

Redux

*/

import { addAction, addReducer } from 'meteor/vulcan:core';

addAction({
  showAdvancedEditor: {
    toggle: () => ({
      type: 'TOGGLE_ADVANCED',
    }),
  },
});

addReducer({
  showAdvancedEditor: (state = false, action) => {
    if (action.type === 'TOGGLE_ADVANCED') {
      return !state
    } else {
      return state
    }
  },
});
