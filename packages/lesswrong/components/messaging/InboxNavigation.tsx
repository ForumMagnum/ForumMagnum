import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import qs from 'qs'
import { isLWorAF } from '../../lib/instanceSettings';
import { userCanDo } from '../../lib/vulcan-users/permissions';
import { preferredHeadingCase } from '../../themes/forumTheme';
import type { InboxComponentProps } from './InboxWrapper';
import { Link } from "../../lib/reactRouterWrapper";
import { useLocation, useNavigate } from "../../lib/routeUtil";
import SectionTitle from "../common/SectionTitle";
import SingleColumnSection from "../common/SingleColumnSection";
import ConversationItem from "./ConversationItem";
import Loading from "../vulcan-core/Loading";
import SectionFooter from "../common/SectionFooter";
import SectionFooterCheckbox from "../form-components/SectionFooterCheckbox";
import { Typography } from "../common/Typography";
import LoadMore from "../common/LoadMore";
import { useMutation } from "@apollo/client";
import { gql } from "@/lib/crud/wrapGql";
import { useQueryWithLoadMore } from "@/components/hooks/useQueryWithLoadMore";

const ConversationsListMultiQuery = gql(`
  query multiConversationInboxNavigationQuery($selector: ConversationSelector, $limit: Int, $enableTotal: Boolean) {
    conversations(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...ConversationsList
      }
      totalCount
    }
  }
`);

const ConversationsListUpdateMutation = gql(`
  mutation updateConversationInboxNavigation($selector: SelectorInput!, $data: UpdateConversationDataInput!) {
    updateConversation(selector: $selector, data: $data) {
      data {
        ...ConversationsList
      }
    }
  }
`);

// The Navigation for the Inbox components
const InboxNavigation = ({
  terms,
  currentUser,
  title=preferredHeadingCase("Your Conversations"),
}: InboxComponentProps) => {
  const location = useLocation();
  const { currentRoute, query } = location;
  const navigate = useNavigate();

  const { view, limit, ...selectorTerms } = terms;
  const { data, loading, loadMoreProps } = useQueryWithLoadMore(ConversationsListMultiQuery, {
    variables: {
      selector: { [view]: selectorTerms },
      limit: 50,
      enableTotal: false,
    },
    fetchPolicy: 'cache-and-network',
  });

  const results = data?.conversations?.results;
  
  const [updateConversation] = useMutation(ConversationsListUpdateMutation);
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

export default registerComponent('InboxNavigation', InboxNavigation);


