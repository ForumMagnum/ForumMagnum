import React from 'react';
import { registerComponent, Components } from 'meteor/vulcan:core'
import { algoliaIndexNames } from '../../lib/algoliaIndexNames.js';

const UsersSearchAutoComplete = ({clickAction, label}) => {
  return <Components.SearchAutoComplete
    indexName={algoliaIndexNames.Users}
    clickAction={suggestion => clickAction(suggestion.objectID)}
    renderSuggestion={hit => <Components.UsersAutoCompleteHit document={hit} />}
    placeholder={label || "Search for Users"}
  />
}

registerComponent("UsersSearchAutoComplete", UsersSearchAutoComplete);
