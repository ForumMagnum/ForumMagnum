import React, { CSSProperties } from 'react';
import classNames from 'classnames';
import { EmailContextType, useEmailStyles } from './emailContext';
import { styles, contentStylesClassnames, ContentStyleType } from '@/components/common/ContentStylesValues';

export const EmailContentStyles = ({contentType, className, style, emailContext, children}: {
  contentType: ContentStyleType,
  className?: string,
  style?: CSSProperties,
  emailContext: EmailContextType
  children: React.ReactNode,
}) => {
  const classes = useEmailStyles(styles, emailContext);

  return <div style={style} className={classNames(
    className,
    contentStylesClassnames(classes, contentType),
  )}>
    {children}
  </div>;
}
