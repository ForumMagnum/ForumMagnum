import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { useLocation } from "../../lib/routeUtil";
import { useTagBySlug } from "./useTag";
import { isMissingDocumentError } from "../../lib/utils/errorUtil";
import { AnalyticsContext } from "../../lib/analyticsEvents";
import { useSingle } from "../../lib/crud/withSingle";
import { isProduction } from "../../lib/executionEnvironment";

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    marginBottom: 0,
    display: 'flex',
    flexDirection: 'row',
  },
  columnSection: {
    marginBottom: 0,
    width: '100%',
  },
  title: {
    marginLeft: 24,
    marginBottom: 10,
  },
});

export const TagSubforumPage = ({ classes, user }: { classes: ClassesType; user: UsersProfile }) => {
  const { Error404, Loading, SubforumCommentsThread, SectionTitle, SingleColumnSection, Typography } = Components;

  const { params } = useLocation();
  const { slug } = params;
  // TODO-JM: add comment explaining the use of TagPreviewFragment (which loads on hover over tag) to avoid extra round trip
  const { tag, loading, error } = useTagBySlug(slug, "TagPreviewFragment");

  if (loading) {
    return <Loading />;
  }

  // TODO-WH: remove isProduction flag here when we are ready to show this to users
  if (isProduction || !tag || !tag.isSubforum) {
    return <Error404 />;
  }

  if ((error && !isMissingDocumentError(error))) {
    return (
      <SingleColumnSection>
        <Typography variant="body1">{error.message}</Typography>
      </SingleColumnSection>
    );
  }

  return (
    <div className={classes.root}>
      <SingleColumnSection className={classes.columnSection}>
        <SectionTitle title={`${tag.name} Subforum`} className={classes.title} noTopMargin />
        <AnalyticsContext pageSectionContext="commentsSection">
          <SubforumCommentsThread
            tag={tag}
            terms={{ tagId: tag._id, view: "tagSubforumComments", limit: 10 }}
            newForm
          />
        </AnalyticsContext>
      </SingleColumnSection>
    </div>
  );
};

const TagSubforumPageComponent = registerComponent("TagSubforumPage", TagSubforumPage, { styles });

declare global {
  interface ComponentTypes {
    TagSubforumPage: typeof TagSubforumPageComponent;
  }
}
