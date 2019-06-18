/*

The Navigation for the Inbox components

*/

import React from 'react';
import { withRouter } from '../../lib/reactRouterWrapper.js';
import { Components, registerComponent, withList, withUpdate } from 'meteor/vulcan:core';
import Conversations from '../../lib/collections/conversations/collection.js';
import Typography from '@material-ui/core/Typography';
import withUser from '../common/withUser';

const InboxNavigation = ({results, loading, updateConversation, location, router}) => {
  const { SectionTitle, SingleColumnSection, ConversationItem, Loading, SectionFooter, SectionFooterCheckbox } = Components
  if (loading) return <Loading />

  const showArchive = location?.query?.showArchive === "true"
  const checkboxClick = () => {
    router.push({...location, query: {showArchive: !showArchive}})
  }

  return (
    <SingleColumnSection>
        <SectionTitle title="Your Conversations"/>
        {results?.length ?
          results.map(conversation => <ConversationItem key={conversation._id} conversation={conversation} updateConversation={updateConversation} />) :
          <Typography variant="body2">You are all done! You have no more open conversations. Go and be free.</Typography>
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
  limit: 200,
  enableTotal: false,
};

const withUpdateOptions = {
  collection: Conversations,
  fragmentName: 'conversationsListFragment',
};

registerComponent('InboxNavigation', InboxNavigation, [withList, conversationOptions],
  withUser, withRouter,[withUpdate, withUpdateOptions]);
