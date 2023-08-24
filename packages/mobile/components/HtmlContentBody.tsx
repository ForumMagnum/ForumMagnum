import React, { FC } from "react";
import { useWindowDimensions } from "react-native";
import Constants from "expo-constants";
import RenderHtml, {
  MixedStyleDeclaration,
  MixedStyleRecord,
} from "react-native-render-html";
import { palette } from "../palette";

const sansText: MixedStyleDeclaration = {
  fontFamily: palette.fonts.sans.medium,
  fontSize: 15,
  lineHeight: 22,
};

const serifText: MixedStyleDeclaration = {
  fontFamily: palette.fonts.serif.regular,
  fontSize: 15,
  lineHeight: 22,
};

const tagStyles: MixedStyleRecord = {
  h1: {
    ...sansText,
    fontSize: 30,
    marginTop: 14,
    marginBottom: 8,
  },
  h2: sansText,
  h3: sansText,
  h4: sansText,
  h5: sansText,
  h6: sansText,
  p: serifText,
  span: serifText,
  div: serifText,
  i: serifText,
  li: serifText,
  a: {
    color: palette.primary,
  },
  strong: {
    fontFamily: palette.fonts.serif.bold,
  },
  img: {
    maxWidth: 768,
  },
};

const sansTagStyles: MixedStyleRecord = {
  ...tagStyles,
  p: sansText,
  span: sansText,
  div: sansText,
  i: sansText,
  li: sansText,
};

const classStyles: MixedStyleRecord = {
  "footnote-reference": {
    fontSize: 5,
  },
};

const systemFonts: string[] = [
  palette.fonts.serif.regular,
  palette.fonts.sans.medium,
  ...Constants.systemFonts,
];

const HtmlContentBody: FC<{
  html: string,
  sans?: boolean,
}> = ({html, sans}) => {
  const {width} = useWindowDimensions();
  return (
    <RenderHtml
      contentWidth={width}
      source={{html}}
      tagsStyles={sans ? sansTagStyles : tagStyles}
      classesStyles={classStyles}
      systemFonts={systemFonts}
      enableExperimentalMarginCollapsing
      enableExperimentalGhostLinesPrevention
      defaultTextProps={{
        selectable: true,
        selectionColor: palette.primaryLight,
      }}
    />
  );
}

export default HtmlContentBody;
