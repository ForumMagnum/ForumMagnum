import React, { Component } from 'react';
import truncatise from 'truncatise';
import { Utils } from 'meteor/vulcan:core';

const highlightMaxChars = 2400;
export const excerptMaxChars = 700;
export const postExcerptMaxChars = 600;

export const highlightFromMarkdown = (body, mdi) => {
  const htmlBody = mdi.render(body);
  return highlightFromHTML(htmlBody);
}

export const highlightFromHTML = (html) => {
  return Utils.sanitize(truncatise(html, {
    TruncateLength: highlightMaxChars,
    TruncateBy: "characters",
    Suffix: "...",
  }));
};

export const postExcerptFromHTML = (html, truncationCharCount) => {
  if(!html) return ""
  const styles = html.match(/<style[\s\S]*?<\/style>/g) || ""
  const htmlRemovedStyles = html.replace(/<style[\s\S]*?<\/style>/g, '');

  return Utils.sanitize(truncatise(htmlRemovedStyles, {
    TruncateLength: truncationCharCount || postExcerptMaxChars,
    TruncateBy: "characters",
    Suffix: `... <a class="read-more-default">(Read more)</a>${styles}`,
  }));
};

export const commentExcerptFromHTML = (html, truncationCharCount) => {
  if(!html) return ""
  const styles = html.match(/<style[\s\S]*?<\/style>/g) || ""
  const htmlRemovedStyles = html.replace(/<style[\s\S]*?<\/style>/g, '');

  return Utils.sanitize(truncatise(htmlRemovedStyles, {
    // We want the amount comments get truncated to to be less than the threshold at which they are truncated, so that users don't have the experience of expanding a comment only to see a couple more words (which just feels silly).

    // This varies by the size of the comment or truncation amount, and reducing it by 1/4th seems about right.
    TruncateLength: Math.floor(truncationCharCount - truncationCharCount/4) || excerptMaxChars,
    TruncateBy: "characters",
    Suffix: `... <span class="read-more"><a class="read-more-default">(Read more)</a><a class="read-more-tooltip">(Click to expand thread)</a></span>${styles}`,
  }));
};

export const excerptFromMarkdown = (body, mdi) => {
  const htmlBody = mdi.render(body);
  return commentExcerptFromHTML(htmlBody);
}
