import React from "react";
import { registerComponent, Components } from "../../../lib/vulcan-lib";

/**
 * Wrap certain special characters in `name` with a tooltip explaining them
 */
const DisplayNameWithMarkers = ({ name }: { name: string; }) => {
  const { LWTooltip } = Components;

  // Show a tooltip if they have the 🔸 or 🔹 at the end of their profile
  const tenPercentPledgeIndex = name.lastIndexOf("🔸");
  const trialPledgeIndex = name.lastIndexOf("🔹");

  const lastMarkerIndex = Math.max(tenPercentPledgeIndex, trialPledgeIndex);
  const hasMarker = lastMarkerIndex !== -1;

  const beforeMarker = hasMarker ? name.slice(0, lastMarkerIndex) : name;
  const afterMarker = hasMarker ? name.slice(lastMarkerIndex + 2) : "";

  const marker = hasMarker ? name.slice(lastMarkerIndex, lastMarkerIndex + 2) : "";

  const tooltipTitle = `${[beforeMarker, afterMarker].join("")} has taken the ${
    marker === "🔸" ? "🔸10% Pledge" : "🔹Trial Pledge"
  }`;

  return (
    <span>
      {beforeMarker}
      {hasMarker && (
        <LWTooltip placement="top" title={tooltipTitle}>
          {marker}
        </LWTooltip>
      )}
      {afterMarker}
    </span>
  );
};

const DisplayNameWithMarkersComponent = registerComponent("DisplayNameWithMarkers", DisplayNameWithMarkers, {
  areEqual: "auto",
});

declare global {
  interface ComponentTypes {
    DisplayNameWithMarkers: typeof DisplayNameWithMarkersComponent;
  }
}
