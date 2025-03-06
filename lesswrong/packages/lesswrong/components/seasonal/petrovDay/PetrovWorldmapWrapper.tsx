import React from 'react';
import { registerComponent } from '@/lib/vulcan-lib/components.tsx';
import ReactMapGL from 'react-map-gl';
import { mapboxAPIKeySetting } from '@/lib/publicSettings';
import { Helmet } from '@/lib/utils/componentsWithChildren';
import { useMapStyle } from '@/components/hooks/useMapStyle';

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

  const mapStyle = useMapStyle()
  return <div className={classes.root}>
      <Helmet> 
        <link href='https://api.tiles.mapbox.com/mapbox-gl-js/v1.3.1/mapbox-gl.css' rel='stylesheet' />
      </Helmet>
      <ReactMapGL
        zoom={2}
        width="100%"
        height="100%"
        mapStyle={mapStyle}
        mapboxApiAccessToken={mapboxAPIKeySetting.get() || undefined}
      />
      <div className={classes.panelBacking}>
        <div className={classes.panel}>
          {children}
        </div>
      </div>
  </div>;
}

const PetrovWorldmapWrapperComponent = registerComponent('PetrovWorldmapWrapper', PetrovWorldmapWrapper, {styles});

declare global {
  interface ComponentTypes {
    PetrovWorldmapWrapper: typeof PetrovWorldmapWrapperComponent
  }
}

export default PetrovWorldmapWrapperComponent;
