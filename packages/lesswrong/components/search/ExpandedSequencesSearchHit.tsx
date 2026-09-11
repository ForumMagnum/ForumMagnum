import SearchResultLink from "./SearchResultLink";
import SearchHighlight from "./SearchHighlight";
import React from 'react';
import type { Hit } from 'react-instantsearch-core';
import { Snippet } from 'react-instantsearch-dom';
import { cloudinaryCloudName } from '@/lib/instanceSettings';
import FormatDate from "../common/FormatDate";
import UserNameDeleted from "../users/UserNameDeleted";
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles("ExpandedSequencesSearchHit", (theme: ThemeType) => ({
  root: {
    position: "relative",
    maxWidth: 700,
    paddingRight: 44,
    paddingTop: 2,
    paddingBottom: 2,
    marginBottom: 18
  },
  body: {
    position: 'relative',
    display: 'block',
    maxWidth: 600,
    cursor: 'pointer',
    [theme.breakpoints.down('sm')]: {
      maxWidth: '80%',
    }
  },
  banner: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 140,
    maxWidth: '30%',
    height: '100%',
    objectFit: 'cover',
    objectPosition: 'right center',
    pointerEvents: 'none',
    maskImage: `linear-gradient(to right, transparent, ${theme.palette.text.alwaysBlack})`,
    WebkitMaskImage: `linear-gradient(to right, transparent, ${theme.palette.text.alwaysBlack})`,
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
}))

const ExpandedSequencesSearchHit = ({hit, icon}: {
  hit: Hit<any>,
  icon?: React.ReactNode,
}) => {
  const classes = useStyles(styles);
  const sequence: SearchSequence = hit

  
  return <div className={classes.root}>
    {sequence.bannerImageId && <img
      className={classes.banner}
      src={`https://res.cloudinary.com/${cloudinaryCloudName}/image/upload/c_crop,g_custom/c_fill,h_115,w_140,q_auto,f_auto/${sequence.bannerImageId}`}
      alt=""
    />}
    <SearchResultLink href={`/sequences/${sequence._id}`} label={sequence.title ?? "Sequence"} />
    {icon}
    <div className={classes.body}>
      <div className={classes.titleRow}>
        <span className={classes.title}>
          <span>
            <SearchHighlight hit={hit} attribute="title">{sequence.title}</SearchHighlight>
          </span>
        </span>
        {sequence.authorSlug ? <span>
          <SearchHighlight hit={hit} attribute="authorDisplayName">{sequence.authorDisplayName}</SearchHighlight>
        </span> : <UserNameDeleted />}
        <span>{Math.round(sequence.baseScore ?? 0)} average post karma</span>
        <FormatDate date={sequence.createdAt} />
      </div>
      <div className={classes.snippet}>
        <Snippet className={classes.snippet} attribute="plaintextDescription" hit={sequence} tagName="mark" />
      </div>
    </div>
  </div>
}

export default ExpandedSequencesSearchHit;
