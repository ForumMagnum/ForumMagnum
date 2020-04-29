import React, { useCallback } from 'react'
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useLocation, useNavigation } from '../../lib/routeUtil';
import { useTagBySlug } from '../tagging/useTag';
import { Link } from '../../lib/reactRouterWrapper';

const styles = theme => ({
});

const TagPageRevisionSelect = ({ classes }: {
  classes: ClassesType
}) => {
  const { params } = useLocation();
  const { slug } = params;
  const { history } = useNavigation();
  const { SingleColumnSection, Loading, RevisionSelect, UsersName, FormatDate } = Components;
  
  const { tag, loading } = useTagBySlug(slug, "TagRevisionsList");
  
  const compareRevs = useCallback(({before,after}: {before: RevisionMetadata, after:RevisionMetadata}) => {
    if (!tag) return;
    history.push(`/compare/tag/${tag.slug}?before=${before.version}&after=${after.version}`);
  }, [history, tag]);
  
  return <SingleColumnSection>
    {loading && <Loading/>}
    {tag && <RevisionSelect
      revisions={tag.descriptionRevisions}
      describeRevision={(rev: RevisionMetadata) => (
        <Link to={`/tag/${tag.slug}?revision=${rev.version}`}>
          {rev.version}{" "}
          <FormatDate format={"LLL z"} date={rev.editedAt}/>{" "}
            <UsersName documentId={rev.userId}/>{" "}
          {rev.commitMessage}
        </Link>
      )}
      onPairSelected={compareRevs}
    />}
  </SingleColumnSection>
}

const TagPageRevisionSelectComponent = registerComponent("TagPageRevisionSelect", TagPageRevisionSelect, {styles});

declare global {
  interface ComponentTypes {
    TagPageRevisionSelectComponent: typeof TagPageRevisionSelect
  }
}
