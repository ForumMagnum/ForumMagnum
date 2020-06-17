import { Components, registerComponent } from '../../lib/vulcan-lib';
import React from 'react';
import classNames from 'classnames';

export const SECTION_WIDTH = 800

const styles = (theme) => ({
  root: {
    marginBottom: theme.spacing.unit*6,
    marginLeft: "auto",
    marginRight: "auto",
    maxWidth: SECTION_WIDTH,
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

const SingleColumnSectionComponent = registerComponent('SingleColumnSection', SingleColumnSection, {styles});

declare global {
  interface ComponentTypes {
    SingleColumnSection: typeof SingleColumnSectionComponent
  }
}
