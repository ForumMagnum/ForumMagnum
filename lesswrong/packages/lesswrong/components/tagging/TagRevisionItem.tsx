import React, {useState} from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import withErrorBoundary from '../common/withErrorBoundary'
import classNames from 'classnames';
import { tagGetRevisionLink } from '@/lib/collections/tags/helpers';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { tagHistoryStyles } from './history/TagHistoryPage';
import CompareRevisions from "@/components/revisions/CompareRevisions";
import TagRevisionItemFullMetadata from "@/components/tagging/TagRevisionItemFullMetadata";
import TagRevisionItemShortMetadata from "@/components/tagging/TagRevisionItemShortMetadata";
import TagDiscussionButton from "@/components/tagging/TagDiscussionButton";
import { ContentStyles } from "@/components/common/ContentStyles";
import ForumIcon from "@/components/common/ForumIcon";
import LWTooltip from "@/components/common/LWTooltip";
import SingleLineFeedEvent from "@/components/common/SingleLineFeedEvent";

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
}: {
  tag: TagBasicInfo,
  collapsed?: boolean,
  headingStyle: "full"|"abridged",
  revision: RevisionHistoryEntry,
  previousRevision?: RevisionHistoryEntry
  documentId: string,
  showDiscussionLink?: boolean,
  noContainer?: boolean,
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
        icon={<ForumIcon className={tagHistoryClasses.feedIcon} icon="Edit"/>}
        frame expands expanded={expanded || !collapsed} setExpanded={setExpanded}
        tooltip={!(expanded || !collapsed) && diffBody}
      >
        <div className={classes.container}>
          {contents}
        </div>
      </SingleLineFeedEvent>
}

const TagRevisionItemComponent = registerComponent("TagRevisionItem", TagRevisionItem, {hocs: [withErrorBoundary]});

declare global {
  interface ComponentTypes {
    TagRevisionItem: typeof TagRevisionItemComponent
  }
}

export default TagRevisionItemComponent;
