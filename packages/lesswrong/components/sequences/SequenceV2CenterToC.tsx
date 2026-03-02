"use client";
import React from 'react';
import { Typography } from "../common/Typography";
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import classNames from 'classnames';

const styles = defineStyles("SequenceV2CenterToC", (theme: ThemeType) => ({
  root: {
    marginTop: 18,
    marginBottom: 30,
    width: 400,
    textAlign: "left",
    marginLeft: "auto",
    marginRight: "auto",
    "& a": {
      color: theme.palette.text.normal,
      textDecoration: "none",
    },
    "& a:hover": {
      textDecoration: "none",
    },
  },
  row: {
    marginTop: 6,
    marginBottom: 6,
    ...theme.typography.postStyle,
  },
  chapterRow: {
    marginTop: 24,
    marginBottom: 24,
    fontSize: 30,
    textAlign: "center",
    width: "100%",
  },
  chapterTitle: {
    fontSize: 30,
    textTransform: "uppercase",
    "&:hover": {
      textDecoration: "none",
    },
  },
  postNumber: {
    fontSize: 12,
    width: 24,
    textAlign: "right",
  },
  postTitle: {
    width: 375,
    ...theme.typography.headerStyle,
    fontSize: 18,
    fontWeight: 400,
    lineHeight: 1.4,
    marginBottom: 6,
    marginTop: 6,
    color: theme.palette.text.normal,
    textDecoration: "none",
    "&:hover": {
      textDecoration: "none",
    },
  },
  postRow: {
    display: "flex",
    alignItems: "center",
    gap: 12
  },
}));

const toRomanNumeral = (value: number): string => {
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

const SequenceV2CenterToC = ({sections, sequenceTitle}: {
  sections: Array<{ anchor: string, level: number, title: string }>,
  sequenceTitle: string,
}) => {
  const classes = useStyles(styles);
  let postNumberWithinChapter = 0;


  return <div className={classes.root}>
    {sections.map((section) => {
      const isChapter = section.anchor.startsWith("chapter-");
      if (isChapter && section.title === sequenceTitle) {
        return null;
      }
      if (isChapter) {
        postNumberWithinChapter = 0;
      } else {
        postNumberWithinChapter += 1;
      }
      return <div key={section.anchor} className={classNames(classes.row, isChapter ? classes.chapterRow : classes.postRow)}>
        {!isChapter && <span className={classes.postNumber}>{toRomanNumeral(postNumberWithinChapter)}. </span>}
        <a href={`#${section.anchor}`} className={classNames(isChapter ? classes.chapterTitle : classes.postTitle)}>{section.title}</a>
      </div>
    })}
  </div>
};

export default SequenceV2CenterToC;
