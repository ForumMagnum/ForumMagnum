import React from 'react';
import classNames from 'classnames';
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';
import SearchResultLink from './SearchResultLink';

const styles = defineStyles('SearchResultRow', (theme: ThemeType) => ({
  root: {position: 'relative'},
  withIcon: {padding: '10px 16px 10px 42px', [theme.breakpoints.down('sm')]: {padding: '8px 8px 8px 36px'}},
  compact: {padding: '4px 8px 4px 36px'},
  body: {minWidth: 0},
}));

export default function SearchResultRow({href, label, icon, compact, className, children}: {
  href: string;
  label: string;
  icon?: React.ReactNode;
  compact?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const classes = useStyles(styles);
  return <div className={classNames(classes.root, {[classes.withIcon]: !!icon, [classes.compact]: !!compact})}>
    <SearchResultLink href={href} label={label} />
    {icon}
    <div className={classNames(classes.body, className)}>{children}</div>
  </div>;
}
