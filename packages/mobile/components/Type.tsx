import React, { FC } from "react";
import { StyleSheet, Text, TextProps } from "react-native";
import { palette } from "../palette";

const styles = StyleSheet.create({
  text: {
    fontFamily: palette.fonts.sans.medium,
  },
});

const Type: FC<TextProps> = ({style, children, ...props}) => {
  return (
    <Text style={[styles.text, style]} {...props} >
      {children}
    </Text>
  );
}

export default Type;
