import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import withErrorBoundary from '../common/withErrorBoundary'
import { commentBodyStyles } from '../../themes/stylePiping'
import { Link } from '../../lib/reactRouterWrapper';
import {useSingle} from "../../lib/crud/withSingle";
import Revisions from "../../lib/collections/revisions/collection";
import Tags from "../../lib/collections/tags/collection";

const styles = theme => ({
  root: {
    background: "white",
    border: `solid 1px ${theme.palette.commentBorderGrey}`,
    padding: 12,
    borderRadius:3,
    marginBottom: 16,
    '& CompareRevisions-differences > *': {
      opacity: 0
    },
    '& ins': {
      display: 1
    },
    '& del': {
      display: 1
    },
  },
  charsAdded: {
    color: "#008800",
  },
  charsRemoved: {
    color: "#880000",
  },
  textBody: {
    ...commentBodyStyles(theme),
  },
  username: {
    ...theme.typography.commentStyle,
    color: "rgba(0,0,0,.87)",
    marginRight: 12
  }
});

const TagRevisionItem = ({documentId, revision, classes, previousRevision, getRevisionUrl, showTagTitle}: {
  revision: RevisionMetadataWithChangeMetrics,
  previousRevision: RevisionMetadataWithChangeMetrics | undefined,
  classes: ClassesType,
  documentId: string,
  getRevisionUrl: (rev: RevisionMetadata) => React.ReactNode,
  showTagTitle: Boolean
}) => {
  const { CompareRevisions, FormatDate, UsersName, MetaInfo, LWTooltip } = Components

  const { document: tag } = useSingle({
    documentId: documentId,
    collection: Tags,
    fragmentName: "TagBasicInfo",
    skip: !showTagTitle
    }
  )

  if (!documentId || !revision) return null
  const { added, removed } = revision.changeMetrics;
  return <div className={classes.root}>
    {showTagTitle && !!tag &&
      <div>
        <h1>{tag.name}</h1>
        <Link to={`${Tags.getUrl(tag)}/discussion`}>Discuss this edit<Link/></Link>
      </div>}
    <span className={classes.username}>
        <UsersName documentId={revision.userId}/>
      </span>
      <Link to={getRevisionUrl(revision)}>
        <LWTooltip title="View Selected Revision">
          <>
            <MetaInfo>
              v{revision.version}
            </MetaInfo>
            <MetaInfo>
              <FormatDate tooltip={false} format={"MMM Do YYYY z"} date={revision.editedAt}/>{" "}
            </MetaInfo>
          </>
        </LWTooltip>
      </Link>
      <MetaInfo>
        <Link to={getRevisionUrl(revision)}>
          {(added>0 && removed>0)
            && <>(<span className={classes.charsAdded}>+{added}</span>/<span className={classes.charsRemoved}>-{removed}</span>)</>}
          {(added>0 && removed==0)
            && <span className={classes.charsAdded}>(+{added})</span>}
          {(added==0 && removed>0)
            && <span className={classes.charsRemoved}>(-{removed})</span>}
          {" "}
          {revision.commitMessage}
        </Link>
      </MetaInfo>
      {!!(added || removed || !previousRevision) && <div className={classes.textBody}>
        <CompareRevisions
          trim
          collectionName="Tags" fieldName="description"
          documentId={documentId}
          versionBefore={previousRevision?.version}
          versionAfter={revision.version}
        />
      </div>}
    </div>
}

const TagRevisionItemComponent = registerComponent("TagRevisionItem", TagRevisionItem, {styles, hocs: [withErrorBoundary]});

declare global {
  interface ComponentTypes {
    TagRevisionItem: typeof TagRevisionItemComponent
  }
}
