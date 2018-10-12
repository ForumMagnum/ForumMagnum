import React, { Component } from 'react';
import truncatise from 'truncatise';
import { Utils } from 'meteor/vulcan:core';

const highlightMaxChars = 2400;
const excerptMaxChars = 300;

export const highlightFromMarkdown = (body, mdi) => {
  const htmlBody = mdi.render(body);
  return highlightFromHTML(htmlBody);
}

export const highlightFromHTML = (html) => {
  return truncatise(html, {
    TruncateLength: highlightMaxChars,
    TruncateBy: "characters",
    Suffix: "... (Read More)",
  });
};

export const excerptFromHTML = (html) => {
  return Utils.sanitize(truncatise(html, {
    TruncateLength: excerptMaxChars,
    TruncateBy: "characters",
    Suffix: '... <a className="read-more" href="#">(Read More)</a>',
  }));
};

export const excerptFromMarkdown = (body, mdi) => {
  const htmlBody = mdi.render(body);
  return excerptFromHTML(htmlBody);
}

export const renderExcerpt = ({key, body, htmlBody, classes, onReadMore}) => {
  if (!htmlBody)
    return null;
  
  const truncatedBody = excerptFromHTML(htmlBody);
  return <div
    className={classes.commentStyling}
    onClick={() => onReadMore()}
    dangerouslySetInnerHTML={{__html: truncatedBody}}
  />
};