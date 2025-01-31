// TODO: Import component in components.ts
import React, { useEffect, useState } from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { ToCData, ToCSection } from '@/lib/tableOfContents';
import { Link, useNavigate } from '@/lib/reactRouterWrapper';
import { getSectionsWithOffsets, jumpToAnchorGeneric } from '../posts/TableOfContents/FixedPositionToC';
import { useLocation } from '@/lib/routeUtil';

export const sectionStyles = (theme: ThemeType) => ({
  marginTop: theme.spacing.unit * 1.5,
  display: '-webkit-box',
  maxHeight: '3em',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  WebkitLineClamp: 2, // Limit to two lines
  WebkitBoxOrient: 'vertical',
  lineHeight: '1.25em',
});

const styles = (theme: ThemeType) => ({
  root: {
    padding: theme.spacing.unit * 2,
    marginBottom: theme.spacing.unit,
    borderRadius: 3,
    marginTop: theme.spacing.unit * 1.5,
    marginLeft: -6,
    background: theme.palette.background.primaryTranslucent
  },
  section: {
    ...sectionStyles(theme),
  },
  title: {
    fontWeight: 'bold',
  }
});

export const ThinkSidePost = ({classes, post, sectionData}: {
  classes: ClassesType<typeof styles>,
  post: PostsPage,
  sectionData?: ToCData | null
}) => {
  const navigate = useNavigate();
  const { query } = useLocation();
  const jumpToAnchor = (anchor: string) => jumpToAnchorGeneric(anchor, navigate, query);
  const [sections, setSections] = useState<ToCSection[]>([]);

  useEffect(() => {
    const postContent = document.getElementById('postContent');
    const newNormalizedSections = postContent ? getSectionsWithOffsets(postContent, sectionData?.sections ?? []) : sectionData?.sections ?? [];
    const level1Count = newNormalizedSections.filter(section => section.level === 1).length ?? 0;
    const level2Count = newNormalizedSections.filter(section => section.level === 2).length ?? 0;
    const level3Count = newNormalizedSections.filter(section => section.level === 3).length ?? 0;
    let sections: ToCSection[] = []
    if (level1Count > 10) { 
      sections = newNormalizedSections.filter(section => section.level === 1) ?? [] 
    } else if (level2Count + level3Count > 10) {
      sections = newNormalizedSections.filter(section => section.level < 3) ?? []
    } else {
      sections = newNormalizedSections ?? []
    } 
    setSections(sections)
  }, [sectionData]);

  return <div className={classes.root}>
    {post.title && <div className={classes.title}>{post.title}</div>}
    {sections?.map((section, index) => (
      <Link key={index} className={classes.section} to={`#${section.anchor}`} onClick={() => jumpToAnchor(section.anchor)} style={{marginLeft: (section.level - 1) * 12}}>
        {section.title}
      </Link>
    ))}
  </div>;
}

const ThinkSidePostComponent = registerComponent('ThinkSidePost', ThinkSidePost, {styles});

declare global {
  interface ComponentTypes {
    ThinkSidePost: typeof ThinkSidePostComponent
  }
}
