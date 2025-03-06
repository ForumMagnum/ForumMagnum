import React from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib/components";
import LWTooltip from "@/components/common/LWTooltip";

export const tenPercentPledgeDiamond = "🔸";
export const trialPledgeDiamond = "🔹";

const styles = (_theme: ThemeType) => ({
  tooltipPopper: {
    maxWidth: 200,
    textAlign: 'center'
  },
});

type Marker = {
  text: string;
  tooltip: (name: string) => string;
};

const MARKERS: Marker[] = [
  {text: tenPercentPledgeDiamond, tooltip: (name: string) => `${name} has taken the ${tenPercentPledgeDiamond}10% Pledge`},
  {text: trialPledgeDiamond, tooltip: (name: string) => `${name} has taken the ${trialPledgeDiamond}Trial Pledge`},
];

/**
 * Wrap certain special characters with a tooltip explaining them. Currently only allows one tooltip, preferring
 * the one closest to the end of their name.
 */
const DisplayNameWithMarkers = ({ name, classes }: { name: string; classes: ClassesType<typeof styles> }) => {
  const markerIndices = MARKERS.map(marker => name.lastIndexOf(marker.text)).filter(i => i !== -1);

  const lastMarkerIndex = Math.max(...markerIndices);
  const hasMarker = lastMarkerIndex >= 0;

  if (!hasMarker) {
    return <span>{name}</span>
  }

  const beforeMarker = name.slice(0, lastMarkerIndex);
  const afterMarker = name.slice(lastMarkerIndex + 2);

  const markerStr = name.slice(lastMarkerIndex, lastMarkerIndex + 2);
  const markerObject = MARKERS.find(marker => marker.text === markerStr);

  const tooltipTitle = markerObject!.tooltip([beforeMarker, afterMarker].join(''));

  return (
    <span>
      {beforeMarker}
      {hasMarker && (
        <LWTooltip placement="top" title={tooltipTitle} popperClassName={classes.tooltipPopper}>
          {markerStr}
        </LWTooltip>
      )}
      {afterMarker}
    </span>
  );
};

const DisplayNameWithMarkersComponent = registerComponent("DisplayNameWithMarkers", DisplayNameWithMarkers, {
  styles,
  areEqual: "auto",
});

declare global {
  interface ComponentTypes {
    DisplayNameWithMarkers: typeof DisplayNameWithMarkersComponent;
  }
}

export default DisplayNameWithMarkersComponent;
