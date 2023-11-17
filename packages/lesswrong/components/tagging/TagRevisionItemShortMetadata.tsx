import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { Link } from '../../lib/reactRouterWrapper';
import { tagGetRevisionLink } from '../../lib/collections/tags/helpers';
import { Revisions } from '../../lib/collections/revisions/collection';

const styles = (theme: ThemeType): JssStyles => ({
  username: {
    ...theme.typography.commentStyle,
    fontWeight: 600,
    fontSize: "1.16rem",
    color: theme.palette.text.normal,
    marginRight: 12
  }
});

const TagRevisionItemShortMetadata = ({tag, revision, classes}: {
  tag: TagBasicInfo,
  revision: RevisionMetadataWithChangeMetrics,
  classes: ClassesType,
}) => {
  const { FormatDate, UsersName, MetaInfo, LWTooltip, ChangeMetricsDisplay, SmallSideVote } = Components
  const revUrl = tagGetRevisionLink(tag, revision.version);
  
  return <>
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
      collection={Revisions}
    /></MetaInfo>
  </>;
}

const TagRevisionItemShortMetadataComponent = registerComponent("TagRevisionItemShortMetadata", TagRevisionItemShortMetadata, {styles});

declare global {
  interface ComponentTypes {
    TagRevisionItemShortMetadata: typeof TagRevisionItemShortMetadataComponent
  }
}
