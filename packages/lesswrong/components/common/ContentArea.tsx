import { Components, registerComponent } from '../../lib/vulcan-lib';
import React from 'react';
import { SECTION_WIDTH } from './SingleColumnSection'

const styles = (theme) => ({
  root: {
    marginLeft: "auto",
    marginRight: "auto",
    marginTop: -50,
    padding: 75,
    paddingTop: 50,
    maxWidth: SECTION_WIDTH + 150,
    background: "rgba(245,245,245,.5)",
    boxShadow: "0 0 100px rgb(245,245,245)",
    position: "relative",
    left:40,
  }
})

const ContentArea = ({classes, children}: {
  classes: ClassesType,
  children?: React.ReactNode,
}) => {

  return (
    <Components.ErrorBoundary>
      <div className={classes.root}>
        { children }
      </div>
    </Components.ErrorBoundary>
  )
};

const ContentAreaComponent = registerComponent('ContentArea', ContentArea, {styles});

declare global {
  interface ComponentTypes {
    ContentArea: typeof ContentAreaComponent
  }
}
