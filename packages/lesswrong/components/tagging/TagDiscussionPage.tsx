import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useLocation } from '../../lib/routeUtil'
import { useTagBySlug } from './useTag';
import { tagGetUrl } from '../../lib/collections/tags/helpers';
import { Link } from '../../lib/reactRouterWrapper';
import { taggingNameIsSet, taggingNameSetting } from '../../lib/instanceSettings';
import SingleColumnSection from "../common/SingleColumnSection";
import TagDiscussionSection from "./TagDiscussionSection";
import ContentStyles from "../common/ContentStyles";

const styles = (theme: ThemeType) => ({
  title: {
    ...theme.typography.display3,
    ...theme.typography.commentStyle,
    marginTop: 0,
    fontWeight: theme.isFriendlyUI ? 700 : 600,
    ...theme.typography.smallCaps,
  },
  description: {
    marginBottom: 18,
  },
});

const TagDiscussionPage = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const { params } = useLocation();
  const { slug } = params;
  const { tag } = useTagBySlug(slug, "TagFragment");
  return (
    <SingleColumnSection>
      { tag && <Link to={tagGetUrl(tag)}><h1 className={classes.title}>{tag.name}</h1></Link>}
      <ContentStyles contentType="comment" className={classes.description}>
        Discuss the {taggingNameIsSet.get() ? taggingNameSetting.get() : 'wiki-tag'} on this page.
        Here is the place to ask questions and propose changes.
      </ContentStyles>
      {tag && <TagDiscussionSection
        tag={tag}
      />}
    </SingleColumnSection>
  );
}

export default registerComponent("TagDiscussionPage", TagDiscussionPage, {styles});



