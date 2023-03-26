import { Components, registerComponent } from '../../lib/vulcan-lib';
import React from 'react';
import classNames from 'classnames';

export const SECTION_WIDTH = 765

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    marginBottom: theme.spacing.unit*4,
    maxWidth: SECTION_WIDTH,
    marginLeft: "auto",
    marginRight: "auto",
    position: "relative",
    zIndex: theme.zIndexes.singleColumnSection,
    [theme.breakpoints.up('md')]: {
      width: SECTION_WIDTH // TODO: replace this hacky solution with a more comprehensive refactoring of SingleColumnSection. 
      // (SingleColumnLayout should probably be replaced by grid-css in Layout.tsx)
    }
  }
})

const SingleColumnSection = ({classes, className, children}: {
  classes: ClassesType,
  className?: string,
  children?: React.ReactNode,
}) => {

  return (
    <Components.ErrorBoundary>
      <div className={classNames(classes.root, className)}>
        { children }
      </div>
    </Components.ErrorBoundary>
  )
};

const SingleColumnSectionComponent = registerComponent('SingleColumnSection', SingleColumnSection, {styles, stylePriority: -1});

declare global {
  interface ComponentTypes {
    SingleColumnSection: typeof SingleColumnSectionComponent
  }
}
