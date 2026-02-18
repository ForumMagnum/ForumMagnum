"use client";
import React from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import ContentStyles from "../common/ContentStyles";
import { ContentItemBody } from "../contents/ContentItemBody";
import { Typography } from "../common/Typography";
import Divider from '../common/Divider';
import { LW_POST_TITLE_FONT_SIZE } from '../posts/PostsPage/PostsPageTitle';

const styles = defineStyles("SequenceV2PostSection", (theme: ThemeType) => ({
  root: {
    marginTop: 64,
  },
  number: {
    ...theme.typography.body1,
    ...theme.typography.headerStyle,
    fontSize: 20,
    marginTop: 64,
    marginBottom: 0,
  },
  title: {
    marginTop: 24,
    marginBottom: 64,
    fontSize: LW_POST_TITLE_FONT_SIZE,
    maxWidth: 720,
    marginLeft: "auto",
    marginRight: "auto",
    textAlign: "center",
    textWrap: "balance",
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
    textAlign: "left",
  },
}));

export const toRomanNumeral = (value: number): string => {
  const romanNumeralPairs = [
    { value: 1000, numeral: "M" },
    { value: 900, numeral: "CM" },
    { value: 500, numeral: "D" },
    { value: 400, numeral: "CD" },
    { value: 100, numeral: "C" },
    { value: 90, numeral: "XC" },
    { value: 50, numeral: "L" },
    { value: 40, numeral: "XL" },
    { value: 10, numeral: "X" },
    { value: 9, numeral: "IX" },
    { value: 5, numeral: "V" },
    { value: 4, numeral: "IV" },
    { value: 1, numeral: "I" },
  ];
  let remainingValue = value;
  let romanNumeral = "";
  for (const romanNumeralPair of romanNumeralPairs) {
    while (remainingValue >= romanNumeralPair.value) {
      romanNumeral += romanNumeralPair.numeral;
      remainingValue -= romanNumeralPair.value;
    }
  }
  return romanNumeral;
};

const SequenceV2PostSection = ({anchor, title, html, showAuthor, authorName, index}: {
  anchor: string,
  title: string,
  html: string,
  showAuthor: boolean,
  authorName?: string|null,
  index: number,
}) => {
  const classes = useStyles(styles);
  return <div id={anchor} className={classes.root}>
    <Typography variant="body1" className={classes.number}>{toRomanNumeral(index + 1)}</Typography>
    {title && <Typography variant="display2" className={classes.title}>{title}</Typography>}
    {showAuthor && authorName && <div className={classes.author}>{authorName}</div>}

    <ContentStyles contentType="post" className={classes.body}>
      <ContentItemBody
        dangerouslySetInnerHTML={{__html: html}}
        description={`post ${anchor}`}
      />
    </ContentStyles>
    <Divider />
  </div>
};

export default SequenceV2PostSection;
