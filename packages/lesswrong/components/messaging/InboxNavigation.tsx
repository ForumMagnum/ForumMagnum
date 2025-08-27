import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import qs from 'qs'
import { isLWorAF } from '../../lib/instanceSettings';
import { userCanDo } from '../../lib/vulcan-users/permissions';
import { preferredHeadingCase } from '../../themes/forumTheme';
import type { InboxComponentProps } from './InboxWrapper';
import { Link } from "../../lib/reactRouterWrapper";
import { useLocation, useNavigate } from "../../lib/routeUtil";
import { useDialog } from '../common/withDialog';
import SectionTitle from "../common/SectionTitle";
import SingleColumnSection from "../common/SingleColumnSection";
import ConversationItem from "./ConversationItem";
import Loading from "../vulcan-core/Loading";
import SectionFooter from "../common/SectionFooter";
import SectionFooterCheckbox from "../form-components/SectionFooterCheckbox";
import { Typography } from "../common/Typography";
import LoadMore from "../common/LoadMore";
import { gql } from "@/lib/generated/gql-codegen/gql";
import { useQueryWithLoadMore } from "@/components/hooks/useQueryWithLoadMore";
import NewConversationDialog from "./NewConversationDialog";
import { defineStyles, useStyles } from '../hooks/useStyles';

const styles = defineStyles("InboxNavigation", (theme: ThemeType) => ({
  newConversationButton: {
    ...theme.typography.commentStyle,
    color: theme.palette.primary.main,
    cursor: "pointer",
  }
}))

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

// The Navigation for the Inbox components
const InboxNavigation = ({
  terms,
  currentUser,
  title=preferredHeadingCase("Your Conversations"),
}: InboxComponentProps) => {
  const location = useLocation();
  const classes = useStyles(styles);
  const { pathname, query } = location;
  const navigate = useNavigate();
  const { openDialog } = useDialog();

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
  
  const showArchive = query?.showArchive === "true"
  const expanded = query?.expanded === "true"

  const showArchiveCheckboxClick = () => {
    navigate({...location, search: `?${qs.stringify({showArchive: !showArchive})}`})
  }

  const expandCheckboxClick = () => {
    navigate({...location, search: `?${qs.stringify({expanded: !expanded})}`})
  }

  const openNewConversationDialog = () => {
    openDialog({
      name: "NewConversationDialog",
      contents: ({onClose}) => <NewConversationDialog
        onClose={onClose}
      />
    });
  }

  const showModeratorLink = userCanDo(currentUser, 'conversations.view.all') && pathname !== "/moderatorInbox"

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
            <div onClick={openNewConversationDialog} className={classes.newConversationButton}>
              New Conversation
            </div>
          </SectionFooter>
        </SectionTitle>
        {results?.length ?
          results.map(conversation => <ConversationItem key={conversation._id} conversation={conversation} currentUser={currentUser} expanded={expanded}/>
          ) :
          loading ? <Loading /> : <Typography variant="body2">You are all done! You have no more open conversations.{isLWorAF() && " Go and be free."}</Typography>
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


