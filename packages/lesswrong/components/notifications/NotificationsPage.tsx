import React, { FC, useCallback, useState } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { useCurrentUser } from "../common/withUser";
import { useUpdateCurrentUser } from "../hooks/useUpdateCurrentUser";
import { useSingle } from "../../lib/crud/withSingle";
import { Link } from "../../lib/reactRouterWrapper";
import { postGetPageUrl } from "../../lib/collections/posts/helpers";
import { commentGetPageUrlFromIds } from "../../lib/collections/comments/helpers";
import { tagGetUrl } from "../../lib/collections/tags/helpers";
import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";
import classNames from "classnames";
import type {
  CommentKarmaChange,
  PostKarmaChange,
  TagRevisionKarmaChange,
} from "../../lib/types/karmaChangesTypes";

const styles = (theme: ThemeType) => ({
  root: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    width: 760,
    maxWidth: "100%",
    margin: "0 auto",
  },
  title: {
    fontSize: 28,
    fontWeight: 600,
    margin: "40px 0",
  },
  tabs: {
    marginBottom: 16,
    "& .MuiTabs-flexContainer": {
      gap: "32px",
    },
    "& .MuiTab-root": {
      minWidth: 100,
      [theme.breakpoints.down("xs")]: {
        minWidth: 50,
      },
    },
    "& .MuiTab-labelContainer": {
      fontSize: 14,
      fontWeight: 700,
      letterSpacing: "0.28px",
      textTransform: "uppercase",
    },
  },
  content: {
    display: "flex",
    flexDirection :"column",
    gap: "24px",
    marginTop: 24,
  },
  secondaryText: {
    color: theme.palette.grey[600],
    fontSize: 14,
    fontWeight: 500,
    "& a": {
      color: theme.palette.primary.main,
      fontWeight: 600,
      marginLeft: 10,
    },
  },
  karmaChange: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  karmaStar: {
    color: theme.palette.icon.yellow,
  },
  karmaChangeAmount: {
    whiteSpace: "nowrap",
  },
  karmaChangeLink: {
    color: theme.palette.grey[1000],
    fontSize: 14,
    fontWeight: 500,
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
    overflow: "hidden",
  },
});

const tabs = [
  {
    name: "all",
  },
  {
    name: "karma",
  },
  {
    name: "comments",
  },
  {
    name: "reactions",
  },
  {
    name: "new posts",
  },
] as const;

type TabType = typeof tabs[number]["name"];

const KarmaChange: FC<{
  scoreChange: number,
  description: string,
  href: string,
  classes: ClassesType<typeof styles>,
}> = ({scoreChange, description, href, classes}) => {
  const amountText = scoreChange > 0 ? `+${scoreChange}` : String(scoreChange);
  console.log("mark", href);
  const {ForumIcon} = Components;
  return (
    <div className={classes.karmaChange}>
      <ForumIcon icon="Star" className={classes.karmaStar} />
      <div className={classNames(classes.secondaryText, classes.karmaChangeAmount)}>
        {amountText} karma
      </div>
      <div className={classes.karmaChangeLink}>
        <Link to={href}>{description}</Link>
      </div>
    </div>
  );
}

const NotificationsPageKarma: FC<{
  karmaChanges?: UserKarmaChanges,
  classes: ClassesType<typeof styles>,
}> = ({karmaChanges, classes}) => {
  if (!karmaChanges?.karmaChanges) {
    return null;
  }
  const {posts, comments, tagRevisions, updateFrequency} = karmaChanges.karmaChanges;
  const batchedText = updateFrequency === "realtime"
    ? "in real time"
    : `batched ${updateFrequency}`;
  return (
    <div className={classes.content}>
      <div className={classes.secondaryText}>
        Karma notifications are {batchedText}
        <Link to="/account">Change settings</Link>
      </div>
      {posts.map((postKarmaChange: PostKarmaChange) => (
        <KarmaChange
          scoreChange={postKarmaChange.scoreChange}
          description={postKarmaChange.title}
          href={postGetPageUrl(postKarmaChange)}
          classes={classes}
        />
      ))}
      {comments.map(({
        _id,
        scoreChange,
        description,
        postId,
        tagSlug,
        tagCommentType,
      }: CommentKarmaChange) => (
        <KarmaChange
          scoreChange={scoreChange}
          description={description ?? ""}
          href={commentGetPageUrlFromIds({
            commentId: _id,
            postId,
            tagSlug,
            tagCommentType,
          })}
          classes={classes}
        />
      ))}
      {tagRevisions.map(({
        tagSlug,
        tagName,
        scoreChange,
      }: TagRevisionKarmaChange) => (
        <KarmaChange
          scoreChange={scoreChange}
          description={tagName ?? ""}
          href={tagGetUrl({slug: tagSlug ?? ""})}
          classes={classes}
        />
      ))}
    </div>
  );
}

export const NotificationsPage = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const currentUser = useCurrentUser();
  const updateCurrentUser = useUpdateCurrentUser();
  const [tab, setTab] = useState<TabType>(tabs[0].name);

  const {document: karmaChanges} = useSingle({
    documentId: currentUser?._id,
    collectionName: "Users",
    fragmentName: "UserKarmaChanges",
    skip: !currentUser,
  });

  const onChangeTab = useCallback((_: React.ChangeEvent, value: TabType) => {
    setTab(value);

    if (value === "karma" && karmaChanges?.karmaChanges) {
      void updateCurrentUser({
        karmaChangeLastOpened: karmaChanges.karmaChanges.endDate,
        karmaChangeBatchStart: karmaChanges.karmaChanges.startDate,
      });
    }
  }, []);

  if (!currentUser) {
    const {WrappedLoginForm} = Components;
    return (
      <WrappedLoginForm />
    );
  }

  return (
    <div className={classes.root}>
      <div className={classes.title}>Notifications</div>
      <Tabs
        value={tab}
        onChange={onChangeTab}
        className={classes.tabs}
        textColor="primary"
        aria-label="select notification type"
        scrollable
        scrollButtons="off"
      >
        {tabs.map(({name}) => (
          <Tab label={name} value={name} key={name} />
        ))}
      </Tabs>
      {tab === "karma" && karmaChanges &&
        <NotificationsPageKarma karmaChanges={karmaChanges} classes={classes} />
      }
    </div>
  );
}

const NotificationsPageComponent = registerComponent(
  "NotificationsPage",
  NotificationsPage,
  {styles},
);

declare global {
  interface ComponentTypes {
    NotificationsPage: typeof NotificationsPageComponent
  }
}
