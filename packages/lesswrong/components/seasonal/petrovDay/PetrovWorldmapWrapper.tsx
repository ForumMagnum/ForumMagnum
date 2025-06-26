import React from 'react';
import { registerComponent } from '@/lib/vulcan-lib/components';
import { WrappedReactMapGL } from '@/components/community/WrappedReactMapGL';

const styles = (theme: ThemeType) => ({
  root: {
    ...theme.typography.commentStyle,
    zIndex: theme.zIndexes.petrovDayButton,
    position:"relative",
    height: 520,
  },
  panelBacking: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: 520,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.palette.panelBackground.darken40,
  },
  panel: {
    backgroundColor: theme.palette.grey[100],
    paddingTop: theme.spacing.unit*2,
    paddingLeft: theme.spacing.unit*3,
    paddingRight: theme.spacing.unit*3,
    paddingBottom: theme.spacing.unit*2,
    borderRadius: 5,
    boxShadow: `0 0 10px ${theme.palette.grey[800]}`,
    display: "flex",
    flexDirection: "column",
    alignItems: "center"
  },
});

export const PetrovWorldmapWrapper = ({classes, children}: {
  classes: ClassesType<typeof styles>,
  children: React.ReactNode
}) => {

  return <div className={classes.root}>
      <WrappedReactMapGL
        zoom={2}
        width="100%"
        height="100%"
      />
      <div className={classes.panelBacking}>
        <div className={classes.panel}>
          {children}
        </div>
      </div>
  </div>;
}

export default registerComponent('PetrovWorldmapWrapper', PetrovWorldmapWrapper, {styles});


