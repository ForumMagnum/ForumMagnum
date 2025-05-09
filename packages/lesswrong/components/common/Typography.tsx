import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import classNames from 'classnames';

const styles = (theme: ThemeType) => ({
  root: {
    display: "block",
    margin: 0,
  },
  
  display4: theme.typography.display4,
  display3: theme.typography.display3,
  display2: theme.typography.display2,
  display1: theme.typography.display1,
  headline: theme.typography.headline,
  title: theme.typography.title,
  subheading: theme.typography.subheading,
  body2: theme.typography.body2,
  body1: theme.typography.body1,
  
  gutterBottom: {
    marginBottom: "0.35em",
  },
});

type VariantString = "display4"|"display3"|"display2"|"display1"|"headline"|"title"|"subheading"|"body2"|"body1"

const variantToDefaultComponent: Record<VariantString, string> = {
  display4: 'h1',
  display3: 'h1',
  display2: 'h1',
  display1: 'h1',
  headline: 'h1',
  title: 'h2',
  subheading: 'h3',
  body2: 'aside',
  body1: 'p',
};

const TypographyInner = ({children, variant, component, className, onClick, gutterBottom=false, classes, id, htmlFor}: {
  children: React.ReactNode,
  variant: VariantString,
  component?: "div"|"span"|"label"|"aside"|"p",
  className?: string,
  onClick?: any,
  gutterBottom?: boolean,
  classes: ClassesType<typeof styles>,
  id?: string,
  htmlFor?: string,
}) => {
  const Component: any = component || variantToDefaultComponent[variant] || "span";

  return (
    <Component
      id={id}
      htmlFor={htmlFor}
      className={classNames(
        classes.root,
        classes[variant],
        className,
        gutterBottom && classes.gutterBottom,
      )}
      onClick={onClick}
    >
      {children}
    </Component>
  );
}

export const Typography = registerComponent("Typography", TypographyInner, {
  styles,
  stylePriority: -2,
});


