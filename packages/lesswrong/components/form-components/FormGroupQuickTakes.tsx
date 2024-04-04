import React from 'react'
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { FormGroupLayoutProps } from './FormGroupLayout';


const styles = (theme: ThemeType) => ({
  root: {
    display: 'contents',
    '& .form-component-FormComponentQuickTakesTags': {
      order: 100
    }
  },
});

const FormGroupQuickTakes = ({ children, classes }: FormGroupLayoutProps & { classes: ClassesType<typeof styles> }) => {
  console.log('children', children)
  const childrenArray = React.Children.toArray(children);
  const [tabs, ...otherChildren] = childrenArray;

  const { GoogleDocImportButton } = Components;

  return (
    <div className={classes.root}>
      {children}
    </div>
  );
};

const FormGroupQuickTakesComponent = registerComponent('FormGroupQuickTakes', FormGroupQuickTakes, { styles })

declare global {
  interface ComponentTypes {
    FormGroupQuickTakes: typeof FormGroupQuickTakesComponent
  }
}
