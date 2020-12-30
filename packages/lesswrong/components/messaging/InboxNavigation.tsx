import React from 'react';
import { useLocation, useNavigation } from '../../lib/routeUtil';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useUpdate } from '../../lib/crud/withUpdate';
import { useMulti } from '../../lib/crud/withMulti';
import qs from 'qs'

// The Navigation for the Inbox components
const InboxNavigation = ({terms, currentUser}: {
  terms: ConversationsViewTerms,
  currentUser: UsersCurrent,
}) => {
  const location = useLocation();
  const { query } = location;
  const { history } = useNavigation();
  
  const { results, loading } = useMulti({
    terms,
    collectionName: "Conversations",
    fragmentName: 'conversationsListFragment',
    fetchPolicy: 'cache-and-network',
    limit: 200,
  });
  
  const { mutate: updateConversation } = useUpdate({
    collectionName: "Conversations",
    fragmentName: 'conversationsListFragment',
  });
  
  const { SectionTitle, SingleColumnSection, ConversationItem, Loading, SectionFooter, SectionFooterCheckbox, Typography } = Components
  const showArchive = query?.showArchive === "true"
  const checkboxClick = () => {
    history.push({...location, search: `?${qs.stringify({showArchive: !showArchive})}`})
  }

  return (
    <SingleColumnSection>
        <SectionTitle title="Your Conversations"/>
        {results?.length ?
          results.map(conversation => <ConversationItem key={conversation._id} conversation={conversation} updateConversation={updateConversation} currentUser={currentUser} />) :
          loading ? <Loading /> : <Typography variant="body2">You are all done! You have no more open conversations. Go and be free.</Typography>
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

const InboxNavigationComponent = registerComponent('InboxNavigation', InboxNavigation);

declare global {
  interface ComponentTypes {
    InboxNavigation: typeof InboxNavigationComponent
  }
}

