"use client";
import React from 'react';
import { Link } from '../../lib/reactRouterWrapper';
import { headerSubtitleStyles } from '../common/HeaderSubtitle';
import { getAllTagsPath } from '@/lib/pathConstants';
import { useStyles } from '../hooks/useStyles';

export const TagPageSubtitle = ({siteName}: {
  siteName: string
}) => {
  const classes = useStyles(headerSubtitleStyles);
  
  return (<span className={classes.subtitle}>
    <Link to={getAllTagsPath()}>Wikitags</Link>
  </span>);
}
