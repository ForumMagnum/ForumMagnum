import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { Link } from '../../lib/reactRouterWrapper';
import { useDialog } from '../common/withDialog';
import { ArbitalLogo } from '../icons/ArbitalLogo';
import ArbitalImportRevisionDetails from "./history/ArbitalImportRevisionDetails";
import FormatDate from "../common/FormatDate";
import UsersNameDisplay from "../users/UsersNameDisplay";
import MetaInfo from "../common/MetaInfo";
import LWTooltip from "../common/LWTooltip";
import ChangeMetricsDisplay from "./ChangeMetricsDisplay";
import SmallSideVote from "../votes/SmallSideVote";
import ForumIcon from "../common/ForumIcon";

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
  skippedIcon: {
    cursor: "pointer",
    "--icon-size": "20px",
    verticalAlign: "middle",
    marginRight: 16,
  },
});

const TagRevisionItemShortMetadata = ({tag, url, itemDescription, revision, classes}: {
  tag: TagBasicInfo,
  url: string,
  itemDescription?: React.ReactNode,
  revision: RevisionHistoryEntry,
  classes: ClassesType<typeof styles>,
}) => {
  const { openDialog } = useDialog();
  
  function showArbitalImportDetails() {
    openDialog({
      name: "ArbitalImportRevisionDetails",
      contents: ({onClose}) => <ArbitalImportRevisionDetails
        onClose={onClose}
        revision={revision}
      />
    });
  }
  
  return <>
    {itemDescription}
    <span className={classes.username}>
      <UsersNameDisplay user={revision.user}/>
    </span>
    {" "}
    <Link to={url}>
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
    {revision.skipAttributions && <>
      <LWTooltip title="Excluded from author-attribution.">
        <span className={classes.skippedIcon}>
          <ForumIcon icon="Clear"/>
        </span>
      </LWTooltip>
    </>}
    {revision.legacyData?.arbitalPageId && <>
      <LWTooltip title="Imported from Arbital. Click to view original Markdown.">
        <span onClick={showArbitalImportDetails}>
          <ArbitalLogo className={classes.arbitalLogo} strokeWidth={0.7}/>
        </span>
      </LWTooltip>
    </>}
    <MetaInfo>
      <Link to={url}>
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

export default registerComponent("TagRevisionItemShortMetadata", TagRevisionItemShortMetadata, {styles});


