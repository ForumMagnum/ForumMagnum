import React from "react";
import { registerComponent, Components } from "../../../lib/vulcan-lib";

export const tenPercentPledgeDiamond = "🔸";
export const trialPledgeDiamond = "🔹";

const styles = (_theme: ThemeType) => ({
  tooltipPopper: {
    maxWidth: 200,
    textAlign: 'center'
  },
});

/**
 * Wrap certain special characters with a tooltip explaining them
 */
const DisplayNameWithMarkers = ({ name, classes }: { name: string; classes: ClassesType<typeof styles> }) => {
  const { LWTooltip } = Components;

  // Show a tooltip if they have the 10% or Trial pledge diamond at the end of their profile
  const tenPercentPledgeIndex = name.lastIndexOf(tenPercentPledgeDiamond);
  const trialPledgeIndex = name.lastIndexOf(trialPledgeDiamond);

  const lastMarkerIndex = Math.max(tenPercentPledgeIndex, trialPledgeIndex);
  const hasMarker = lastMarkerIndex !== -1;

  const beforeMarker = hasMarker ? name.slice(0, lastMarkerIndex) : name;
  const afterMarker = hasMarker ? name.slice(lastMarkerIndex + 2) : "";

  const marker = hasMarker ? name.slice(lastMarkerIndex, lastMarkerIndex + 2) : "";

  const tooltipTitle = `${[beforeMarker, afterMarker].join("")} has taken the ${
    marker === tenPercentPledgeDiamond ? `${tenPercentPledgeDiamond}10% Pledge` : `${trialPledgeDiamond}Trial Pledge`
  }`;

  return (
    <span>
      {beforeMarker}
      {hasMarker && (
        <LWTooltip placement="top" title={tooltipTitle} popperClassName={classes.tooltipPopper}>
          {marker}
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
