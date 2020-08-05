import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import withErrorBoundary from '../common/withErrorBoundary'
import { commentBodyStyles } from '../../themes/stylePiping'
import { Link } from '../../lib/reactRouterWrapper';

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
  }
});

const TagRevisionItem = ({documentId, revision, classes, previousRevision, getRevisionUrl}: {
  revision: RevisionMetadataWithChangeMetrics,
  previousRevision: RevisionMetadataWithChangeMetrics
  classes: ClassesType,
  documentId: string,
  getRevisionUrl: (rev: RevisionMetadata) => React.ReactNode,
}) => {
  const { CompareRevisions, FormatDate, UsersName, MetaInfo } = Components

  if (!documentId || !revision || !previousRevision) return null
  const { added, removed } = revision.changeMetrics;

  return <div className={classes.root}>
      <MetaInfo>
        <Link to={getRevisionUrl(revision)}>
          {revision.version}{" "}
          <FormatDate format={"LLL z"} date={revision.editedAt}/>{" "}
        </Link>
        <UsersName documentId={revision.userId}/>{" "}
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
      {!!(added || removed) && <div className={classes.textBody}>
        <CompareRevisions
          trim
          collectionName="Tags" fieldName="description"
          documentId={documentId}
          versionBefore={previousRevision.version}
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
