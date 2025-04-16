import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { Link } from '../../lib/reactRouterWrapper';
import { tagGetUrl } from '../../lib/collections/tags/helpers';
import { isFriendlyUI } from '../../themes/forumTheme';

const styles = (theme: ThemeType) => ({
  root: {
    marginBottom: isFriendlyUI ? 12 : undefined,
  },
  tagName: isFriendlyUI
    ? {
      fontFamily: theme.palette.fonts.sansSerifStack,
      fontSize: 16,
      fontWeight: 600,
      marginBottom: 10,
    }
    : {
      // same as RecentDiscussionThread-title
      ...theme.typography.display2,
      ...theme.typography.postStyle,
      marginTop: 0,
      marginBottom: 8,
      display: "block",
      fontSize: "1.75rem",
    },
  metadata: isFriendlyUI
    ? {
      fontFamily: theme.palette.fonts.sansSerifStack,
      fontSize: 14,
      fontWeight: 500,
      color: theme.palette.grey[600],
      marginRight: theme.spacing.unit,
    }
    : {
      color: theme.palette.grey[800],
      marginRight: theme.spacing.unit,
      fontSize: "1.1rem",
      ...theme.typography.commentStyle
    },
  metadataText: {
    fontStyle: isFriendlyUI ? "italic" : undefined,
  },
  username: {
    ...theme.typography.commentStyle,
    color: theme.palette.text.normal,
  },
  changeMetrics: {
    marginRight: isFriendlyUI ? 8 : undefined,
  },
});

const TagRevisionItemFullMetadata = ({tag, revision, classes}: {
  tag: TagBasicInfo,
  revision: RevisionMetadataWithChangeMetrics,
  classes: ClassesType<typeof styles>,
}) => {
  const {FormatDate, UsersName, ChangeMetricsDisplay, SmallSideVote} = Components;
  const tagUrl = tagGetUrl(tag);

  return <div className={classes.root}>
    <div className={classes.tagName}>
      <Link to={tagUrl}>
        {tag.name}
      </Link>
    </div>
    <div className={classes.metadata}>
      <span className={classes.metadataText}>
        Edited by
        {" "}
        <span className={classes.username}>
          <UsersName documentId={revision.userId ?? undefined}/>
        </span>
        {" "}
        <ChangeMetricsDisplay
          changeMetrics={revision.changeMetrics}
          showCharacters={isFriendlyUI}
          className={classes.changeMetrics}
        />
        {!isFriendlyUI &&
          <>
            {" "}
            <FormatDate
              tooltip={false}
              format={"MMM Do YYYY z"}
              date={revision.editedAt}
            />
            {" "}
          </>
        }
        {" "}
      </span>
      <SmallSideVote
        document={revision}
        collectionName="Revisions"
      />
      {" "}
      {revision.commitMessage}
    </div>
  </div>;
}

const TagRevisionItemFullMetadataComponent = registerComponent("TagRevisionItemFullMetadata", TagRevisionItemFullMetadata, {styles});

declare global {
  interface ComponentTypes {
    TagRevisionItemFullMetadata: typeof TagRevisionItemFullMetadataComponent
  }
}
