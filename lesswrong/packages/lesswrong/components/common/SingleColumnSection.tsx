import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import classNames from 'classnames';
import ErrorBoundary from "@/components/common/ErrorBoundary";

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

const SingleColumnSection = ({classes, className, children}: {
  classes: ClassesType<typeof styles>,
  className?: string,
  children?: React.ReactNode,
}) => {

  return (
    <ErrorBoundary>
      <div className={classNames(classes.root, className)}>
        { children }
      </div>
    </ErrorBoundary>
  )
};

const SingleColumnSectionComponent = registerComponent('SingleColumnSection', SingleColumnSection, {styles, stylePriority: -1});

declare global {
  interface ComponentTypes {
    SingleColumnSection: typeof SingleColumnSectionComponent
  }
}

export default SingleColumnSectionComponent;
