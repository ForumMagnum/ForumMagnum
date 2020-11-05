import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { Link } from '../../lib/reactRouterWrapper';
import { tagGetRevisionLink } from '../../lib/collections/tags/helpers';

const styles = (theme: ThemeType): JssStyles => ({
  username: {
    ...theme.typography.commentStyle,
    color: "rgba(0,0,0,.87)",
    marginRight: 12
  }
});

const TagRevisionItemShortMetadata = ({tag, revision, classes}: {
  tag: TagBasicInfo,
  revision: RevisionMetadataWithChangeMetrics,
  classes: ClassesType,
}) => {
  const { FormatDate, UsersName, MetaInfo, LWTooltip, ChangeMetricsDisplay } = Components
  const revUrl = tagGetRevisionLink(tag, revision.version);
  
  return <div>
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
  </div>;
}

const TagRevisionItemShortMetadataComponent = registerComponent("TagRevisionItemShortMetadata", TagRevisionItemShortMetadata, {styles});

declare global {
  interface ComponentTypes {
    TagRevisionItemShortMetadata: typeof TagRevisionItemShortMetadataComponent
  }
}
