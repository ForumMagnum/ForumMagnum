"use client";

import React from 'react';
import { useTagBySlug } from './useTag';
import { tagGetPageUrl } from '../../lib/collections/tags/helpers';
import { Link } from '../../lib/reactRouterWrapper';
import SingleColumnSection from "../common/SingleColumnSection";
import TagDiscussionSection from "./TagDiscussionSection";
import ContentStyles from "../common/ContentStyles";
import { useStyles } from '../hooks/useStyles';
import { defineStyles } from '../hooks/defineStyles';

const styles = defineStyles("TagDiscussionPage", (theme: ThemeType) => ({
  title: {
    ...theme.typography.display3,
    ...theme.typography.commentStyle,
    marginTop: 0,
    fontWeight: 600,
    ...theme.typography.smallCaps,
  },
  description: {
    marginBottom: 18,
  },
}));

const TagDiscussionPage = ({slug}: {slug: string}) => {
  const classes = useStyles(styles);
  const { tag } = useTagBySlug(slug, "TagFragment");
  return (
    <SingleColumnSection>
      { tag && <Link to={tagGetPageUrl(tag)}><h1 className={classes.title}>{tag.name}</h1></Link>}
      <ContentStyles contentType="comment" className={classes.description}>
        Discuss the wikitag on this page.
        Here is the place to ask questions and propose changes.
      </ContentStyles>
      {tag && <TagDiscussionSection
        tag={tag}
      />}
    </SingleColumnSection>
  );
}

export default TagDiscussionPage;
