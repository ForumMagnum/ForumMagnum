import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { Link } from '../../lib/reactRouterWrapper';
import { tagGetUrl } from '../../lib/collections/tags/helpers';
import { Revisions } from '../../lib/collections/revisions/collection';
import { isEAForum } from '../../lib/instanceSettings';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    marginBottom: isEAForum ? 12 : undefined,
  },
  tagName: isEAForum
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
  metadata: isEAForum
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
    fontStyle: isEAForum ? "italic" : undefined,
  },
  username: {
    ...theme.typography.commentStyle,
    color: theme.palette.text.normal,
  },
  changeMetrics: {
    marginRight: isEAForum ? 8 : undefined,
  },
});

const TagRevisionItemFullMetadata = ({tag, revision, classes}: {
  tag: TagBasicInfo,
  revision: RevisionMetadataWithChangeMetrics,
  classes: ClassesType,
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
          <UsersName documentId={revision.userId}/>
        </span>
        {" "}
        <ChangeMetricsDisplay
          changeMetrics={revision.changeMetrics}
          showCharacters={isEAForum}
          className={classes.changeMetrics}
        />
        {!isEAForum &&
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
        collection={Revisions}
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
