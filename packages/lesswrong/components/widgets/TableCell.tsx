import React, { useContext } from 'react';
import classNames from 'classnames';
import { darken, fade, lighten } from '@/lib/vendor/@material-ui/core/src/styles/colorManipulator';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { TableLvl2Context } from './TableBody';

export const styles = defineStyles("TableCell", theme => ({
  /* Styles applied to the root element. */
  root: {
    display: 'table-cell',
    verticalAlign: 'inherit',
    // Workaround for a rendering bug with spanned columns in Chrome 62.0.
    // Removes the alpha (sets it to 1), and lightens or darkens the theme color.
    borderBottom: `1px solid
    ${
      theme.palette.type === 'light'
        ? lighten(fade(theme.palette.greyAlpha(0.12), 1), 0.88)
        : darken(fade(theme.palette.greyAlpha(0.12), 1), 0.8)
    }`,
    textAlign: 'left',
    padding: '4px 56px 4px 24px',
    '&:last-child': {
      paddingRight: 24,
    },
  },
  /* Styles applied to the root element if `variant="head"` or `context.table.head`. */
  head: {
    color: theme.palette.text.secondary,
    fontSize: "0.75rem",
    fontWeight: 500,
  },
  /* Styles applied to the root element if `variant="body"` or `context.table.body`. */
  body: {
    color: theme.palette.text.primary,
    fontWeight: 400,
    fontSize: 14.3,
    lineHeight: "19.5px",
    paddingLeft: 16,
    paddingRight: 16,
    paddingTop: 12,
    paddingBottom: 12,
    marginTop: 0,
    marginBottom: 0,
    wordBreak: "normal",
  },
  /* Styles applied to the root element if `variant="footer"` or `context.table.footer`. */
  footer: {
    borderBottom: 0,
    color: theme.palette.text.secondary,
    fontSize: "0.75rem",
  },
}));

export function TableCell(props: {
  children?: React.ReactNode,
  className?: string
}) {
  const classes = useStyles(styles);
  const {
    children,
    className: classNameProp,
    ...other
  } = props;

  const tablelvl2 = useContext(TableLvl2Context);
  const Component = tablelvl2 && tablelvl2 === 'head' ? 'th' : 'td';

  let scope = undefined;
  if (tablelvl2 && tablelvl2 === 'head') {
    scope = 'col';
  }

  const className = classNames(
    classes.root,
    {
      [classes.head]: tablelvl2 && tablelvl2 === 'head',
      [classes.body]: tablelvl2 && tablelvl2 === 'body',
      [classes.footer]: tablelvl2 && tablelvl2 === 'footer',
    },
    classNameProp,
  );

  return (
    <Component className={className} scope={scope} {...other}>
      {children}
    </Component>
  );
}
