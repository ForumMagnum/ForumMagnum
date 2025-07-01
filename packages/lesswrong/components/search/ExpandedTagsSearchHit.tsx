import { registerComponent } from '../../lib/vulcan-lib/components';
import { Link } from '../../lib/reactRouterWrapper';
import React from 'react';
import type { Hit } from 'react-instantsearch-core';
import { Snippet } from 'react-instantsearch-dom';
import { cloudinaryCloudNameSetting } from '@/lib/instanceSettings';
import { tagGetUrl } from '../../lib/collections/tags/helpers';
import { requireCssVar } from '../../themes/cssVars';

const styles = (theme: ThemeType) => ({
  root: {
    maxWidth: 700,
    paddingTop: 2,
    paddingBottom: 2,
    marginBottom: 18
  },
  link: {
    display: 'block',
    maxWidth: 600,
    [theme.breakpoints.down('sm')]: {
      maxWidth: '80%',
    }
  },
  titleRow: {
    display: "flex",
    flexWrap: 'wrap',
    alignItems: 'baseline',
    columnGap: 16,
    rowGap: '3px',
    color: theme.palette.grey[600],
    fontSize: 12,
    fontFamily: theme.typography.fontFamily,
  },
  metaInfo: {
    display: "flex",
    alignItems: 'center',
    columnGap: 3
  },
  title: {
    fontSize: 18,
    lineHeight: '24px',
    fontFamily: theme.typography.fontFamily,
    color: theme.palette.grey[800],
    fontWeight: 600,
  },
  snippet: {
    overflowWrap: "break-word",
    fontFamily: theme.typography.fontFamily,
    wordBreak: "break-word",
    fontSize: 14,
    lineHeight: '21px',
    color: theme.palette.grey[700],
    marginTop: 5
  }
})

const cloudinaryCloudName = cloudinaryCloudNameSetting.get()

const translucentBackground = requireCssVar("palette", "panelBackground", "translucent3");
const greyBackground = requireCssVar("palette", "grey", 0);

const ExpandedTagsSearchHit = ({hit, classes}: {
  hit: Hit<any>,
  classes: ClassesType<typeof styles>,
}) => {
  const tag = hit as SearchTag

  const style = tag.bannerImageId ? {
    background: `linear-gradient(to left, transparent, ${translucentBackground} 70px, ${greyBackground} 140px), no-repeat right url(https://res.cloudinary.com/${cloudinaryCloudName}/image/upload/c_crop,g_custom/c_fill,h_115,w_140,q_auto,f_auto/${tag.bannerImageId})`
  } : {}

  return <div className={classes.root} style={style}>
    <Link
      to={tagGetUrl(tag)}
      className={classes.link}
    >
      <div className={classes.titleRow}>
        <span className={classes.title}>
          {tag.name}
        </span>
        <span>{tag.postCount ?? 0} post{tag.postCount === 1 ? '' : 's'}</span>
      </div>
      <div className={classes.snippet}>
        <Snippet className={classes.snippet} attribute="description" hit={tag} tagName="mark" />
      </div>
    </Link>
  </div>
}

export default registerComponent("ExpandedTagsSearchHit", ExpandedTagsSearchHit, {styles});



