import React from 'react'
import { registerComponent } from '../../lib/vulcan-lib';
import { FormGroupLayoutProps } from './FormGroupLayout';

const styles = (theme: ThemeType) => ({
  root: {
    display: 'flex',
    flexWrap: 'wrap',
    borderBottom: theme.palette.border.normal,
    margin: '16px 16px',
    alignItems: 'center',
    flexDirection: "column",
    '& .form-input': {
      margin: 0,
    },
    [theme.breakpoints.up('md')]: {
      flexDirection: "row",
    },
  },
  tabs: {
    order: 2,
    marginRight: 'auto',
    [theme.breakpoints.up('md')]: {
      order: 1,
      flexBasis: 'auto',
    },
  },
  otherChildren: {
    order: 1,
    marginLeft: 'auto',
    [theme.breakpoints.up('md')]: {
      order: 2,
      flexBasis: 'auto',
    },
  },
});

const FormGroupPostTopBar = ({ children, classes }: FormGroupLayoutProps & { classes: ClassesType<typeof styles> }) => {
  const childrenArray = React.Children.toArray(children);
  const [tabs, ...otherChildren] = childrenArray;

  return (
    <div className={classes.root}>
      <div className={classes.tabs}>{tabs}</div>
      <div className={classes.otherChildren}>{otherChildren}</div>
    </div>
  );
};

const FormGroupPostTopBarComponent = registerComponent('FormGroupPostTopBar', FormGroupPostTopBar, { styles })

declare global {
  interface ComponentTypes {
    FormGroupPostTopBar: typeof FormGroupPostTopBarComponent
  }
}
