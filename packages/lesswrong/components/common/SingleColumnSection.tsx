import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import classNames from 'classnames';

export const SECTION_WIDTH = 765

const styles = (theme: ThemeType) => ({
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

const SingleColumnSectionInner = ({classes, className, children}: {
  classes: ClassesType<typeof styles>,
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

export const SingleColumnSection = registerComponent('SingleColumnSection', SingleColumnSectionInner, {styles, stylePriority: -1});

declare global {
  interface ComponentTypes {
    SingleColumnSection: typeof SingleColumnSection
  }
}
