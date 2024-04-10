import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useLocation } from '../../lib/routeUtil'
import { useTagBySlug } from './useTag';
import { tagGetUrl } from '../../lib/collections/tags/helpers';
import { Link } from '../../lib/reactRouterWrapper';
import { taggingNameIsSet, taggingNameSetting } from '../../lib/instanceSettings';
import { isFriendlyUI } from '../../themes/forumTheme';

const styles = (theme: ThemeType): JssStyles => ({
  title: {
    ...theme.typography.display3,
    ...theme.typography.commentStyle,
    marginTop: 0,
    fontWeight: isFriendlyUI ? 700 : 600,
    ...theme.typography.smallCaps,
  },
  description: {
    marginBottom: 18,
  },
});

const TagDiscussionPage = ({classes}: {
  classes: ClassesType,
}) => {
  const { params } = useLocation();
  const { slug } = params;
  const { tag } = useTagBySlug(slug, "TagFragment");
  const {SingleColumnSection, TagDiscussionSection, ContentStyles} = Components;
  
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

const TagDiscussionPageComponent = registerComponent("TagDiscussionPage", TagDiscussionPage, {styles});


declare global {
  interface ComponentTypes {
    TagDiscussionPage: typeof TagDiscussionPageComponent
  }
}
