import { Components, registerComponent } from '../../lib/vulcan-lib';
import { Link, useNavigate } from '../../lib/reactRouterWrapper';
import React from 'react';
import type { Hit } from 'react-instantsearch-core';
import { Snippet } from 'react-instantsearch-dom';
import { cloudinaryCloudNameSetting } from '../../lib/publicSettings';
import { userGetProfileUrlFromSlug } from '../../lib/collections/users/helpers';
import { requireCssVar } from '../../themes/cssVars';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    maxWidth: 700,
    paddingTop: 2,
    paddingBottom: 2,
    marginBottom: 18
  },
  body: {
    display: 'block',
    maxWidth: 600,
    cursor: 'pointer',
    '&:hover': {
      opacity: 0.5
    },
    [theme.breakpoints.down('sm')]: {
      maxWidth: '80%',
    }
  },
  link: {
    '&:hover': {
      opacity: 1
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
    marginTop: 4
  }
})

const cloudinaryCloudName = cloudinaryCloudNameSetting.get()

const translucentBackground = requireCssVar("palette", "panelBackground", "translucent3");
const greyBackground = requireCssVar("palette", "grey", 0);

const ExpandedSequencesSearchHit = ({hit, classes}: {
  hit: Hit<any>,
  classes: ClassesType,
}) => {
  const navigate = useNavigate();
  const { FormatDate, UserNameDeleted } = Components
  const sequence: SearchSequence = hit
  
  const handleClick = () => {
    navigate(`/sequences/${sequence._id}`)
  }
  
  const style = sequence.bannerImageId ? {
    background: `linear-gradient(to left, transparent, ${translucentBackground} 70px, ${greyBackground} 140px), no-repeat right url(https://res.cloudinary.com/${cloudinaryCloudName}/image/upload/c_crop,g_custom/c_fill,h_115,w_140,q_auto,f_auto/${sequence.bannerImageId})`
  } : {}

  return <div className={classes.root} style={style}>
    <div className={classes.body} onClick={handleClick}>
      <div className={classes.titleRow}>
        <span className={classes.title}>
          <Link to={`/sequences/${sequence._id}`} className={classes.link} onClick={(e) => e.stopPropagation()}>
            {sequence.title}
          </Link>
        </span>
        {sequence.authorSlug ? <Link to={userGetProfileUrlFromSlug(sequence.authorSlug)} onClick={(e) => e.stopPropagation()}>
          {sequence.authorDisplayName}
        </Link> : <UserNameDeleted />}
        <FormatDate date={sequence.createdAt} />
      </div>
      <div className={classes.snippet}>
        <Snippet className={classes.snippet} attribute="plaintextDescription" hit={sequence} tagName="mark" />
      </div>
    </div>
  </div>
}

const ExpandedSequencesSearchHitComponent = registerComponent("ExpandedSequencesSearchHit", ExpandedSequencesSearchHit, {styles});

declare global {
  interface ComponentTypes {
    ExpandedSequencesSearchHit: typeof ExpandedSequencesSearchHitComponent
  }
}

