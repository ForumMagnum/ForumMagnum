"use client";
import React from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import ChapterTitle from "./ChapterTitle";
import ContentStyles from "../common/ContentStyles";
import { ContentItemBody } from "../contents/ContentItemBody";
import { Typography } from "../common/Typography";

const styles = defineStyles("SequenceV2ChapterSection", (theme: ThemeType) => ({
  root: {
    marginTop: 40,
    marginBottom: 24,
    textAlign: "center",
  },
  subtitle: {
    marginTop: 10,
    fontStyle: "italic",
    color: theme.palette.text.dim,
  },
  description: {
    marginTop: 16,
    maxWidth: 720,
    marginLeft: "auto",
    marginRight: "auto",
    textAlign: "left",
  },
}));

const SequenceV2ChapterSection = ({anchor, title, subtitle, descriptionHtml}: {
  anchor: string,
  title?: string|null,
  subtitle?: string|null,
  descriptionHtml?: string|null,
}) => {
  const classes = useStyles(styles);
  const hasAnything = !!(title || subtitle || descriptionHtml);
  return <div id={anchor} className={hasAnything ? classes.root : undefined}>
    {title && <ChapterTitle title={title} large/>}
    {subtitle && <Typography variant="body2" className={classes.subtitle}>{subtitle}</Typography>}
    {descriptionHtml && <ContentStyles contentType="post" className={classes.description}>
      <ContentItemBody
        dangerouslySetInnerHTML={{__html: descriptionHtml}}
        description={`chapter ${anchor}`}
      />
    </ContentStyles>}
  </div>
};

export default SequenceV2ChapterSection;
