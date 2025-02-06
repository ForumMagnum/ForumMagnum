import React, {useState} from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import withErrorBoundary from '../common/withErrorBoundary'
import classNames from 'classnames';

const styles = (theme: ThemeType) => ({
  container: {
    background: theme.palette.panelBackground.default,
    border: theme.palette.border.commentBorder,
    padding: 12,
    borderRadius:3,
    marginBottom: 16,
  },
  discussionButtonPositioning: {
    display: "flex",
    marginTop: 16,
    marginRight: 8
  }
});

const TagRevisionItem = ({
  tag,
  collapsed=false,
  headingStyle,
  revision,
  previousRevision,
  documentId,
  showDiscussionLink=true,
  noContainer=false,
  classes,
}: {
  tag: TagBasicInfo,
  collapsed?: boolean,
  headingStyle: "full"|"abridged",
  revision: RevisionHistoryEntry,
  previousRevision?: RevisionHistoryEntry
  documentId: string,
  showDiscussionLink?: boolean,
  noContainer?: boolean,
  classes: ClassesType<typeof styles>,
}) => {
  const { CompareRevisions, TagRevisionItemFullMetadata, TagRevisionItemShortMetadata, TagDiscussionButton, ContentStyles } = Components
  const [expanded, setExpanded] = useState(false);
  if (!documentId || !revision) return null
  const { added, removed } = revision.changeMetrics;

  if (collapsed && !expanded) {
    return <Components.SingleLineFeedEvent expands setExpanded={setExpanded}>
      <TagRevisionItemShortMetadata tag={tag} revision={revision} />
    </Components.SingleLineFeedEvent>
  }

  return <div className={classNames({[classes.container]: !noContainer})}>
    {headingStyle==="full" &&
      <TagRevisionItemFullMetadata tag={tag} revision={revision} />}
    {headingStyle==="abridged" &&
      <div><TagRevisionItemShortMetadata tag={tag} revision={revision} /></div>}

    {!!(added || removed || !previousRevision) && <ContentStyles contentType="comment">
      <CompareRevisions
        trim={true}
        collectionName="Tags" fieldName="description"
        documentId={documentId}
        versionBefore={previousRevision?.version||null}
        versionAfter={revision.version}
      />
    </ContentStyles>}
    {showDiscussionLink && <div className={classes.discussionButtonPositioning}>
      <TagDiscussionButton tag={tag} text={`Discuss this ${tag.wikiOnly ? "wiki" : "tag"}`}/>
    </div>}
  </div>
}

const TagRevisionItemComponent = registerComponent("TagRevisionItem", TagRevisionItem, {styles, hocs: [withErrorBoundary]});

declare global {
  interface ComponentTypes {
    TagRevisionItem: typeof TagRevisionItemComponent
  }
}
