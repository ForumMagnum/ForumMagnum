import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { Link } from '../../lib/reactRouterWrapper';
import { tagGetUrl } from '../../lib/collections/tags/helpers';
import { isFriendlyUI } from '../../themes/forumTheme';
import FormatDate from "../common/FormatDate";
import UsersName from "../users/UsersName";
import ChangeMetricsDisplay from "./ChangeMetricsDisplay";
import SmallSideVote from "../votes/SmallSideVote";

const styles = (theme: ThemeType) => ({
  root: {
},
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
    marginRight: 8,
    fontSize: "1.1rem",
    ...theme.typography.commentStyle
  },
  metadataText: {
  },
  username: {
    ...theme.typography.commentStyle,
    color: theme.palette.text.normal,
  },
  changeMetrics: {
  },
});

const TagRevisionItemFullMetadata = ({tag, revision, classes}: {
  tag: TagBasicInfo,
  revision: RevisionMetadataWithChangeMetrics,
  classes: ClassesType<typeof styles>,
}) => {
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
          showCharacters={isFriendlyUI()}
          className={classes.changeMetrics}
        />
        {!isFriendlyUI() &&
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

export default registerComponent("TagRevisionItemFullMetadata", TagRevisionItemFullMetadata, {styles});


