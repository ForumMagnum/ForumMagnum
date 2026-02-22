import LWTooltip, { LWTooltipProps } from "./LWTooltip";

export const THIN_HOVER_OVER_WIDTH = 270;
export const HOVER_OVER_WIDTH = 340;

const HoverOver = (props: LWTooltipProps) => {
  const Tooltip = LWTooltip;
  return (
    <Tooltip {...props} />
  );
}

export default HoverOver;

