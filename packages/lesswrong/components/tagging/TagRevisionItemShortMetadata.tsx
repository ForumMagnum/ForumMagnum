import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { Link } from '../../lib/reactRouterWrapper';
import { tagGetRevisionLink } from '../../lib/collections/tags/helpers';
import type { TagLens } from '@/lib/arbital/useTagLenses';
import { useDialog } from '../common/withDialog';
import { ArbitalLogo } from '../icons/ArbitalLogo';

const styles = (theme: ThemeType) => ({
  username: {
    ...theme.typography.commentStyle,
    fontWeight: 600,
    fontSize: "1.16rem",
    color: theme.palette.text.normal,
    marginRight: 12
  },
  arbitalLogo: {
    fill: theme.palette.grey[600],
    cursor: "pointer",
    width: 12,
    height: 12,
    marginRight: 16,
    verticalAlign: "baseline",
  },
});

const TagRevisionItemShortMetadata = ({tag, lens, revision, classes}: {
  tag: TagBasicInfo,
  lens?: MultiDocumentContentDisplay | TagLens,
  revision: RevisionHistoryEntry,
  classes: ClassesType<typeof styles>,
}) => {
  const { FormatDate, UsersName, MetaInfo, LWTooltip, ChangeMetricsDisplay, SmallSideVote } = Components
  const revUrl = tagGetRevisionLink(tag, revision.version, lens);
  const { openDialog } = useDialog();
  
  function showArbitalImportDetails() {
    openDialog({
      componentName: "ArbitalImportRevisionDetails",
      componentProps: {
        revision,
      },
    });
  }
  
  return <>
    {/* TODO: should we link to the lens via the lens title? */}
    {lens && <div>Lens: {`${lens.tabTitle}${lens.tabSubtitle ? ` (${lens.tabSubtitle})` : ""}`}</div>}
    <span className={classes.username}>
      <UsersName documentId={revision.userId}/>
    </span>
    {" "}
    <Link to={revUrl}>
      <LWTooltip title="View Selected Revision"><>
        <MetaInfo>
          v{revision.version}
        </MetaInfo>
        <MetaInfo>
          <FormatDate tooltip={false} format={"MMM Do YYYY z"} date={revision.editedAt}/>{" "}
        </MetaInfo>
      </></LWTooltip>
    </Link>
    {" "}
    {revision.legacyData?.arbitalPageId && <>
      <LWTooltip title="Imported from Arbital. Click to view original Markdown.">
        <span onClick={showArbitalImportDetails}>
          <ArbitalLogo className={classes.arbitalLogo} strokeWidth={0.7}/>
        </span>
      </LWTooltip>
    </>}
    <MetaInfo>
      <Link to={revUrl}>
        <ChangeMetricsDisplay changeMetrics={revision.changeMetrics}/>
        {" "}
        {revision.commitMessage}
      </Link>
    </MetaInfo>
    {" "}
    <MetaInfo><SmallSideVote
      document={revision}
      collectionName="Revisions"
    /></MetaInfo>
  </>;
}

const TagRevisionItemShortMetadataComponent = registerComponent("TagRevisionItemShortMetadata", TagRevisionItemShortMetadata, {styles});

declare global {
  interface ComponentTypes {
    TagRevisionItemShortMetadata: typeof TagRevisionItemShortMetadataComponent
  }
}
