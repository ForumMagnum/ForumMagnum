import { tagGetUrl } from '../../lib/collections/tags/helpers';
import { Link } from '../../lib/reactRouterWrapper';
import { registerComponent } from '../../lib/vulcan-lib/components';
import FormatDate from "../common/FormatDate";
import UsersName from "../users/UsersName";
import SmallSideVote from "../votes/SmallSideVote";
import ChangeMetricsDisplay from "./ChangeMetricsDisplay";

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
        marginRight: theme.spacing.unit,
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
          showCharacters={false}
          className={classes.changeMetrics}
        />
        {<>
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


