'use client';

import React from 'react';

// The body of a content-item (post, comment etc), starting from HTML and
// rendered with whatever enhancements we can apply to emails. (In a browser,
// this would include things like link hover-preview. In a email, we can't do
// that, so this doesn't currently have any enhancements, but it might in the
// future.)
export const EmailContentItemBody = ({className, dangerouslySetInnerHTML}: {
  className?: string,
  dangerouslySetInnerHTML: any
}) => {
  return <div className={className} dangerouslySetInnerHTML={dangerouslySetInnerHTML}/>
}
