import React, {useState} from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import withErrorBoundary from '../common/withErrorBoundary'
import classNames from 'classnames';
import { tagGetRevisionLink } from '@/lib/collections/tags/helpers';
import { defineStyles, useStyles } from "../hooks/useStyles";
import { tagHistoryStyles } from './history/TagHistoryPage';
import SingleLineFeedEvent from "../common/SingleLineFeedEvent";
import CompareRevisions from "../revisions/CompareRevisions";
import TagRevisionItemFullMetadata from "./TagRevisionItemFullMetadata";
import TagRevisionItemShortMetadata from "./TagRevisionItemShortMetadata";
import TagDiscussionButton from "./TagDiscussionButton";
import ContentStyles from "../common/ContentStyles";
import ForumIcon from "../common/ForumIcon";
import LWTooltip from "../common/LWTooltip";

const styles = defineStyles("TagRevisionItem", (theme: ThemeType) => ({
  container: {
  },
  discussionButtonPositioning: {
    display: "flex",
    marginTop: 16,
    marginRight: 8
  }
}));

const TagRevisionItem = ({
  tag,
  collapsed=false,
  headingStyle,
  revision,
  previousRevision,
  documentId,
  showDiscussionLink=true,
  noContainer=false,
  showIcon=false
}: {
  tag: TagBasicInfo,
  collapsed?: boolean,
  headingStyle: "full"|"abridged",
  revision: RevisionHistoryEntry,
  previousRevision?: RevisionHistoryEntry
  documentId: string,
  showDiscussionLink?: boolean,
  noContainer?: boolean,
  showIcon?: boolean
}) => {
  const classes = useStyles(styles);
  const tagHistoryClasses = useStyles(tagHistoryStyles);
  const [expanded, setExpanded] = useState(false);
  if (!documentId || !revision) return null
  const { added, removed } = revision.changeMetrics;
  const url = tagGetRevisionLink(tag, revision.version);
  
  const diffBody = !!(added || removed || !previousRevision) && <ContentStyles contentType="comment">
    <CompareRevisions
      trim={true}
      collectionName="Tags" fieldName="description"
      documentId={documentId}
      versionBefore={previousRevision?.version||null}
      versionAfter={revision.version}
      revisionAfter={revision}
    />
  </ContentStyles>

  const contents = (collapsed && !expanded)
    ? <TagRevisionItemShortMetadata tag={tag} revision={revision} url={url} />
    : <>
        {headingStyle==="full" &&
          <TagRevisionItemFullMetadata tag={tag} revision={revision} />}
        {headingStyle==="abridged" &&
          <div><TagRevisionItemShortMetadata tag={tag} revision={revision} url={url} /></div>}
    
        {diffBody}
        {showDiscussionLink && <div className={classes.discussionButtonPositioning}>
          <TagDiscussionButton tag={tag} text={`Discuss this ${tag.wikiOnly ? "wiki" : "tag"}`}/>
        </div>}
      </>
  return noContainer
    ? contents
    : <SingleLineFeedEvent
        icon={showIcon ? <ForumIcon className={tagHistoryClasses.feedIcon} icon="Edit"/> : undefined}
        frame expands expanded={expanded || !collapsed} setExpanded={setExpanded}
        tooltip={!(expanded || !collapsed) && diffBody}
      >
        <div className={classes.container}>
          {contents}
        </div>
      </SingleLineFeedEvent>
}

export default registerComponent("TagRevisionItem", TagRevisionItem, {hocs: [withErrorBoundary]});


