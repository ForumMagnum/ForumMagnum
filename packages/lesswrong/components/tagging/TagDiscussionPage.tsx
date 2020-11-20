import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useLocation } from '../../lib/routeUtil'
import { useTagBySlug } from './useTag';
import { commentBodyStyles } from '../../themes/stylePiping';
import { tagGetUrl } from '../../lib/collections/tags/helpers';
import { Link } from '../../lib/reactRouterWrapper';

const styles = (theme: ThemeType): JssStyles => ({
  title: {
    ...theme.typography.display3,
    ...theme.typography.commentStyle,
    marginTop: 0,
    fontWeight: 600,
    fontVariant: "small-caps"
  },
  description: {
    marginTop: 18,
    ...commentBodyStyles(theme),
    marginBottom: 18,
  },
});

const TagDiscussionPage = ({classes}: {
  classes: ClassesType,
}) => {
  const { params } = useLocation();
  const { slug } = params;
  const { tag } = useTagBySlug(slug, "TagFragment");
  const {SingleColumnSection, TagDiscussionSection } = Components;
  
  return (
    <SingleColumnSection>
      { tag && <Link to={tagGetUrl(tag)}><h1 className={classes.title}>{tag.name}</h1></Link>}
      <p className={classes.description}>
        Use this page to discuss problems with the tag, ask for clarification about the tag, propose 
        merging or splitting the tag, or just discuss edits you want to make to the tag
      </p>
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
