/*

The Navigation for the Inbox components

*/

import React from 'react';
import { useLocation, useNavigation } from '../../lib/routeUtil';
import { Components, registerComponent, withList, withUpdate } from 'meteor/vulcan:core';
import Conversations from '../../lib/collections/conversations/collection.js';
import Typography from '@material-ui/core/Typography';
import withUser from '../common/withUser';
import qs from 'qs'

const InboxNavigation = ({results, loading, updateConversation}) => {
  const location = useLocation();
  const { query } = location;
  const { history } = useNavigation();
  
  const { SectionTitle, SingleColumnSection, ConversationItem, Loading, SectionFooter, SectionFooterCheckbox } = Components
  const showArchive = query?.showArchive === "true"
  const checkboxClick = () => {
    history.push({...location, search: `?${qs.stringify({showArchive: !showArchive})}`})
  }

  return (
    <SingleColumnSection>
        <SectionTitle title="Your Conversations"/>
        {results?.length ?
          results.map(conversation => <ConversationItem key={conversation._id} conversation={conversation} updateConversation={updateConversation} />) :
          loading ? <Loading /> : <Typography variant="body1">You are all done! You have no more open conversations. Go and be free.</Typography>
        }
        <SectionFooter>
          <SectionFooterCheckbox
            onClick={checkboxClick}
            value={showArchive}
            label={"Show Archived Conversations"}
          />
        </SectionFooter>
    </SingleColumnSection>
  )
}

const conversationOptions = {
  collection: Conversations,
  queryName: 'conversationsListQuery',
  fragmentName: 'conversationsListFragment',
  fetchPolicy: 'cache-and-network',
  limit: 200,
};

const withUpdateOptions = {
  collection: Conversations,
  fragmentName: 'conversationsListFragment',
};

registerComponent('InboxNavigation', InboxNavigation, [withList, conversationOptions],
  withUser, [withUpdate, withUpdateOptions]);
