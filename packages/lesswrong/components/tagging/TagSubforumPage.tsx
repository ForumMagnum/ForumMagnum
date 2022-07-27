import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useLocation } from '../../lib/routeUtil'
import { useTagBySlug } from './useTag';
import { isMissingDocumentError } from '../../lib/utils/errorUtil';
import { AnalyticsContext } from '../../lib/analyticsEvents';

const styles = (theme: ThemeType): JssStyles => ({
  root: {

  }
});

export const TagSubforumPage = ({classes, user}: {
  classes: ClassesType,
  user: UsersProfile
}) => {

  const { Error404, Loading, PostsCommentsThread, SingleColumnSection, Typography } = Components

  const { params } = useLocation();
  const { slug } = params;
  // TODO-JM: add comment explaining the use of TagPreviewFragment (which loads on hover over tag) to avoid extra round trip
  const { tag, loading, error } = useTagBySlug(slug, "TagPreviewFragment");

  if (loading) {
    return <Loading />;
  }

  if (error  && !isMissingDocumentError(error)) {
    return <SingleColumnSection>
      <Typography variant="body1">
        {error.message}
      </Typography>
    </SingleColumnSection>
  }

  if (!tag) {
    return <Error404 />
  }

  return <SingleColumnSection className={classes.root}>
    <Typography variant="title">{tag.name} Subforum</Typography>
    <AnalyticsContext pageSectionContext="commentsSection">
      <PostsCommentsThread terms={{postId: tag.subforumShortformPostId}} newForm/>
    </AnalyticsContext>
  </SingleColumnSection>;
}

const TagSubforumPageComponent = registerComponent('TagSubforumPage', TagSubforumPage, {styles});

declare global {
  interface ComponentTypes {
    TagSubforumPage: typeof TagSubforumPageComponent
  }
}

