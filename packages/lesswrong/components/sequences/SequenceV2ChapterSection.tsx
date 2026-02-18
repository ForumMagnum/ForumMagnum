"use client";
import React from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import ChapterTitle from "./ChapterTitle";
import ContentStyles from "../common/ContentStyles";
import { ContentItemBody } from "../contents/ContentItemBody";
import { Typography } from "../common/Typography";
import { postBodyStyles } from '@/themes/stylePiping';
import { toRomanNumeral } from './SequenceV2PostSection';
import Divider from '../common/Divider';

const styles = defineStyles("SequenceV2ChapterSection", (theme: ThemeType) => ({
  root: {
    marginTop: 128,
    marginBottom: 250,
    textAlign: "center",
  },
  number: {
    ...theme.typography.body1,
    ...theme.typography.headerStyle,
    fontSize: 20,
    marginTop: 64,
    marginBottom: 12,
  },
  title: {
    textTransform: "uppercase",
    fontSize: 50,
    maxWidth: 720,
    marginLeft: "auto",
    marginRight: "auto",
    textAlign: "center",
  },
  subtitle: {
    marginTop: 10,
    fontStyle: "italic",
    ...theme.typography.body1,
    ...postBodyStyles(theme),
    color: theme.palette.text.dim,
    marginLeft: "auto",
    marginRight: "auto",
    textWrap: "balance",
    width: 540,
  },
  description: {
    marginTop: 16,
    maxWidth: 720,
    marginLeft: "auto",
    marginRight: "auto",
    textAlign: "left",
  },
}));

const SequenceV2ChapterSection = ({anchor, title, subtitle, descriptionHtml, index}: {
  anchor: string,
  title?: string|null,
  subtitle?: string|null,
  descriptionHtml?: string|null,
  index?: number,
}) => {
  const classes = useStyles(styles);
  const hasAnything = !!(title || subtitle || descriptionHtml);
  return <div id={anchor} className={hasAnything ? classes.root : undefined}>
    <Typography variant="body1" className={classes.number}>
      Part {toRomanNumeral((index ?? 0) + 1)}
    </Typography>

    {title && <div className={classes.title}>{title}</div>}
    {subtitle && <Typography variant="body2" className={classes.subtitle}>{subtitle}</Typography>}
    {descriptionHtml && <ContentStyles contentType="post" className={classes.description}>
      <ContentItemBody
        dangerouslySetInnerHTML={{__html: descriptionHtml}}
        description={`chapter ${anchor}`}
      />
    </ContentStyles>}
      <Divider margin={128}  />
  </div>
};

export default SequenceV2ChapterSection;
