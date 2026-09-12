import React, { useEffect, useState } from 'react';
import classNames from 'classnames';
import { Link } from '@/lib/reactRouterWrapper';
import LinkIcon from '@/lib/vendor/@material-ui/icons/src/Link';
import CheckIcon from '@/lib/vendor/@material-ui/icons/src/Check';
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles('SearchResultLink', (theme: ThemeType) => ({
  link: {
    position: 'absolute',
    inset: 0,
    zIndex: 1,
    borderRadius: 5,
    '&:focus-visible': {outline: `2px solid ${theme.palette.grey[600]}`, outlineOffset: 2},
  },
  button: {
    position: 'absolute',
    right: 4,
    // Stay near the top, but center the hit area vertically in short results.
    top: 'min(4px, calc(50% - 20px))',
    zIndex: 2,
    width: 40,
    height: 40,
    display: 'grid',
    [theme.breakpoints.down('md')]: {display: 'none'},
    placeItems: 'center',
    padding: 0,
    border: 0,
    borderRadius: 4,
    background: 'transparent',
    color: theme.palette.grey[600],
    cursor: 'pointer',
    opacity: 0,
    '*:hover > &, *:focus-within > &, [data-search-selected] &': {opacity: 1},
    transition: 'color 150ms ease',
    '&:hover, &:focus-visible': {color: theme.palette.grey[700]},
    '&::before': {
      content: '""',
      position: 'absolute',
      inset: 6,
      borderRadius: 4,
      backgroundColor: theme.palette.background.paper,
      transition: 'background-color 150ms ease',
    },
    '&:hover::before, &:focus-visible::before': {
      backgroundColor: theme.palette.grey[300],
    },
  },
  icon: {
    position: 'absolute',
    fontSize: 18,
    opacity: 0,
    transform: 'scale(0.25)',
    filter: 'blur(4px)',
    transition: 'opacity 300ms cubic-bezier(0.2, 0, 0, 1), transform 300ms cubic-bezier(0.2, 0, 0, 1), filter 300ms cubic-bezier(0.2, 0, 0, 1)',
    '@media (prefers-reduced-motion: reduce)': {transition: 'none'},
  },
  visible: {opacity: 1, transform: 'scale(1)', filter: 'blur(0px)'},
  status: {
    position: 'absolute',
    width: 1,
    height: 1,
    overflow: 'hidden',
    clipPath: 'inset(50%)',
  },
  error: {
    position: 'relative',
    color: theme.palette.grey[700],
    fontSize: 12,
  },
}));

interface SearchResultLinkProps {
  href: string,
  label: string,
}

export default function SearchResultLink({href, label}: SearchResultLinkProps) {
  const classes = useStyles(styles);
  const [status, setStatus] = useState<'idle' | 'copied' | 'error'>('idle');
  useEffect(() => {
    if (status !== 'copied') return;
    const timeout = setTimeout(() => setStatus('idle'), 2000);
    return () => clearTimeout(timeout);
  }, [status]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(new URL(href, window.location.href).href);
      setStatus('copied');
    } catch {
      setStatus('error');
    }
  };

  return <>
    <Link to={href} className={classes.link}><span className={classes.status}>{label}</span></Link>
    <button type="button" className={classes.button} onClick={copyLink}
      aria-label={status === 'copied' ? 'Link copied' : 'Copy link'}
      title={status === 'copied' ? 'Link copied' : 'Copy link'}>
      <LinkIcon className={classNames(classes.icon, {[classes.visible]: status !== 'copied'})} />
      <CheckIcon className={classNames(classes.icon, {[classes.visible]: status === 'copied'})} />
    </button>
    <span role="status" className={status === 'error' ? classes.error : classes.status}>
      {status === 'copied' ? 'Link copied' : status === 'error' ? 'Could not copy link. Try again or right-click the result to copy its link.' : ''}
    </span>
  </>;
}
