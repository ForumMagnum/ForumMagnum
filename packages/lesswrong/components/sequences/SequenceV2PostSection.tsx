"use client";
import React from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import ContentStyles from "../common/ContentStyles";
import { ContentItemBody } from "../contents/ContentItemBody";
import { Typography } from "../common/Typography";

const styles = defineStyles("SequenceV2PostSection", (theme: ThemeType) => ({
  root: {
    marginTop: 44,
  },
  title: {
    marginBottom: 8,
    fontSize: 50,
    maxWidth: 720,
    marginLeft: "auto",
    marginRight: "auto",
    ...theme.typography.headerStyle,
  },
  author: {
    textAlign: "center",
    color: theme.palette.text.dim,
    marginBottom: 18,
  },
  body: {
    maxWidth: 720,
    marginLeft: "auto",
    marginRight: "auto",
  },
}));

const SequenceV2PostSection = ({anchor, title, html, showAuthor, authorName}: {
  anchor: string,
  title: string,
  html: string,
  showAuthor: boolean,
  authorName?: string|null,
}) => {
  const classes = useStyles(styles);
  return <div id={anchor} className={classes.root}>
    <Typography variant="display2" className={classes.title}>{title}</Typography>
    {showAuthor && authorName && <div className={classes.author}>{authorName}</div>}
    <ContentStyles contentType="post" className={classes.body}>
      <ContentItemBody
        dangerouslySetInnerHTML={{__html: html}}
        description={`post ${anchor}`}
      />
    </ContentStyles>
  </div>
};

export default SequenceV2PostSection;
