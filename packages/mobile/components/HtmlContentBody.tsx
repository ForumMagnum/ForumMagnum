import React, { FC } from "react";
import { useWindowDimensions } from "react-native";
import Constants from "expo-constants";
import RenderHtml, { MixedStyleRecord } from "react-native-render-html";
import { palette } from "../palette";

const tagStyles: MixedStyleRecord = {
  p: {
    fontFamily: palette.fonts.serif.regular,
  },
  li: {
    fontFamily: palette.fonts.serif.regular,
  },
  div: {
    fontFamily: palette.fonts.serif.regular,
  },
  span: {
    fontFamily: palette.fonts.serif.regular,
  },
  a: {
    color: palette.primary,
  },
};

const systemFonts: string[] = [
  palette.fonts.serif.regular,
  ...Constants.systemFonts,
];

const HtmlContentBody: FC<{html: string}> = ({html}) => {
  const {width} = useWindowDimensions();
  return (
    <RenderHtml
      contentWidth={width}
      source={{html}}
      tagsStyles={tagStyles}
      systemFonts={systemFonts}
      enableExperimentalMarginCollapsing
      enableExperimentalGhostLinesPrevention
    />
  );
}

export default HtmlContentBody;
