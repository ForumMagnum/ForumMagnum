import React from "react";
import { useLocation, useNavigation } from "../../lib/routeUtil";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { useUpdate } from "../../lib/crud/withUpdate";
import { useMulti } from "../../lib/crud/withMulti";
import { forumTypeSetting } from "../../lib/instanceSettings";
import { userCanDo } from "../../lib/vulcan-users";
import { preferredHeadingCase } from "../../lib/forumTypeUtils";
import { randomId } from "../../lib/random";

const styles = (theme: ThemeType): JssStyles => ({
  title: {
    marginTop: 0,
  },
  modInboxLink: {
    color: theme.palette.lwTertiary.main,
    fontSize: 14,
    fontWeight: 600,
    lineHeight: "24px",
  }
})

// The Navigation for the Inbox components
const InboxNavigation2 = ({
  terms,
  currentUser,
  title = preferredHeadingCase("All Messages"),
  selectedConversationId,
  setSelectedConversationId,
  classes,
}: {
  terms: ConversationsViewTerms;
  currentUser: UsersCurrent;
  title?: JSX.Element | String;
  selectedConversationId: string | undefined;
  setSelectedConversationId: React.Dispatch<React.SetStateAction<string | undefined>>;
  classes: ClassesType;
}) => {
  const location = useLocation();
  const { currentRoute, query } = location;
  const { history } = useNavigation();

  const { results, loading, loadMoreProps } = useMulti({
    terms,
    collectionName: "Conversations",
    fragmentName: "conversationsListFragment",
    fetchPolicy: "cache-and-network",
    limit: 50,
  });

  const { mutate: updateConversation } = useUpdate({
    collectionName: "Conversations",
    fragmentName: "conversationsListFragment",
  });

  const {
    SectionTitle,
    ConversationItem2,
    Loading,
    SectionFooter,
    Typography,
    LoadMore,
  } = Components;

  const showModeratorLink = userCanDo(currentUser, "conversations.view.all") && currentRoute.name !== "moderatorInbox";

  return <>
      {/* <SectionTitle title={title} noTopMargin> */}
        {/* TODO add mod inbox back in */}
        {/* {showModeratorLink && <Link to={"/moderatorInbox"} className={classes.modInboxLink}>Mod Inbox</Link>} */}
      {/* </SectionTitle> */}
      {results?.length ? (
        results.map((conversation, idx) => (
          <ConversationItem2
            key={conversation._id + idx}
            conversation={conversation}
            updateConversation={updateConversation}
            currentUser={currentUser}
            selectedConversationId={selectedConversationId}
            setSelectedConversationId={setSelectedConversationId}
          />
        ))
      ) : loading ? (
        <Loading />
      ) : (
        <Typography variant="body2">
          You are all done! You have no more open conversations.
        </Typography>
      )}
      <SectionFooter>
        <LoadMore {...loadMoreProps} sectionFooterStyles />
      </SectionFooter>
  </>;
};

const InboxNavigation2Component = registerComponent("InboxNavigation2", InboxNavigation2, {styles});

declare global {
  interface ComponentTypes {
    InboxNavigation2: typeof InboxNavigation2Component;
  }
}
