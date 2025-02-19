import React from 'react';
import { useLocation } from '../../lib/routeUtil';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useUpdate } from '../../lib/crud/withUpdate';
import { useMulti } from '../../lib/crud/withMulti';
import qs from 'qs'
import { isLWorAF } from '../../lib/instanceSettings';
import { Link, useNavigate } from '../../lib/reactRouterWrapper';
import { userCanDo } from '../../lib/vulcan-users';
import { preferredHeadingCase } from '../../themes/forumTheme';
import type { InboxComponentProps } from './InboxWrapper';

// The Navigation for the Inbox components
const InboxNavigation = ({
  terms,
  currentUser,
  title=preferredHeadingCase("Your Conversations"),
}: InboxComponentProps) => {
  const location = useLocation();
  const { currentRoute, query } = location;
  const navigate = useNavigate();

  const { results, loading, loadMoreProps } = useMulti({
    terms,
    collectionName: "Conversations",
    fragmentName: 'ConversationsList',
    fetchPolicy: 'cache-and-network',
    limit: 50,
  });
  
  const { mutate: updateConversation } = useUpdate({
    collectionName: "Conversations",
    fragmentName: 'ConversationsList',
  });
  
  const { SectionTitle, SingleColumnSection, ConversationItem, Loading, SectionFooter, SectionFooterCheckbox, Typography, LoadMore } = Components
  
  const showArchive = query?.showArchive === "true"
  const expanded = query?.expanded === "true"

  const showArchiveCheckboxClick = () => {
    navigate({...location, search: `?${qs.stringify({showArchive: !showArchive})}`})
  }

  const expandCheckboxClick = () => {
    navigate({...location, search: `?${qs.stringify({expanded: !expanded})}`})
  }

  const showModeratorLink = userCanDo(currentUser, 'conversations.view.all') && currentRoute?.name !== "moderatorInbox"

  return (
    <SingleColumnSection>
        <SectionTitle title={title}>
          <SectionFooter>
            <SectionFooterCheckbox
              onClick={expandCheckboxClick}
              value={expanded}
              label={"Expand"}
            />
            {showModeratorLink && <Link to={"/moderatorInbox"}>Mod Inbox</Link>}
          </SectionFooter>
        </SectionTitle>
        {results?.length ?
          results.map(conversation => <ConversationItem key={conversation._id} conversation={conversation} updateConversation={updateConversation} currentUser={currentUser} expanded={expanded}/>
          ) :
          loading ? <Loading /> : <Typography variant="body2">You are all done! You have no more open conversations.{isLWorAF && " Go and be free."}</Typography>
        }
        <SectionFooter>
          <LoadMore {...loadMoreProps} sectionFooterStyles/>
          <SectionFooterCheckbox
            onClick={showArchiveCheckboxClick}
            value={showArchive}
            label={preferredHeadingCase("Show Archived Conversations")}
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
