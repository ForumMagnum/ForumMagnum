import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { Link } from '../../lib/reactRouterWrapper';
import { tagGetUrl } from '../../lib/collections/tags/helpers';
import { Revisions } from '../../lib/collections/revisions/collection';
import { isEAForum } from '../../lib/instanceSettings';

const styles = (theme: ThemeType): JssStyles => ({
  tagName: {
    // same as RecentDiscussionThread-title
    ...theme.typography.display2,
    ...theme.typography.postStyle,
    marginTop: 0,
    marginBottom: 8,
    display: "block",
    fontSize: "1.75rem",
    ...(isEAForum && {
      fontFamily: theme.palette.fonts.sansSerifStack,
    }),
  },
  metadata: {
    color: theme.palette.grey[800],
    marginRight: theme.spacing.unit,
    fontSize: "1.1rem",
    ...theme.typography.commentStyle
  },
  username: {
    ...theme.typography.commentStyle,
    color: theme.palette.text.normal,
  }
});

const TagRevisionItemFullMetadata = ({tag, revision, classes}: {
  tag: TagBasicInfo,
  revision: RevisionMetadataWithChangeMetrics,
  classes: ClassesType,
}) => {
  const { FormatDate, UsersName, ChangeMetricsDisplay, SmallSideVote } = Components
  const tagUrl = tagGetUrl(tag);
  
  return <div>
    <div className={classes.tagName}>
      <Link to={tagUrl}>
        {tag.name}
      </Link>
    </div>
    <div className={classes.metadata}>
      Edited by
      {" "}
      <span className={classes.username}>
        <UsersName documentId={revision.userId}/>
      </span>
      {" "}
      <ChangeMetricsDisplay changeMetrics={revision.changeMetrics}/>
      {" "}
      <FormatDate tooltip={false} format={"MMM Do YYYY z"} date={revision.editedAt}/>{" "}
      {" "}
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
