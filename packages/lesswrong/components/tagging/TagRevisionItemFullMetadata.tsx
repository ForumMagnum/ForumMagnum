import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { Link } from '../../lib/reactRouterWrapper';
import { Tags } from '../../lib/collections/tags/collection';

const styles = (theme: ThemeType): JssStyles => ({
  tagName: {
    // same as RecentDiscussionThread-title
    ...theme.typography.display2,
    ...theme.typography.postStyle,
    marginTop: 0,
    marginBottom: 8,
    display: "block",
    fontSize: "1.75rem",
  },
  metadata: {
    color: theme.palette.grey[800],
    marginRight: theme.spacing.unit,
    fontSize: "1.1rem",
    ...theme.typography.commentStyle
  },
  username: {
    ...theme.typography.commentStyle,
    color: "rgba(0,0,0,.87)",
  }
});

const TagRevisionItemFullMetadata = ({tag, revision, classes}: {
  tag: TagBasicInfo,
  revision: RevisionMetadataWithChangeMetrics,
  classes: ClassesType,
}) => {
  const { FormatDate, UsersName, ChangeMetricsDisplay } = Components
  const tagUrl = Tags.getUrl(tag);
  
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
