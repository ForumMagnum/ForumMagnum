import React, { FC, ReactNode } from "react";
import { StyleProp, StyleSheet, Text, TextStyle } from "react-native";
import { palette } from "../palette";

const styles = StyleSheet.create({
  text: {
    fontFamily: palette.fonts.sans.medium,
  },
});

const Type: FC<{
  style?: StyleProp<TextStyle>,
  children: ReactNode,
}> = ({style = {}, children}) => {
  return (
    <Text style={[styles.text, style]}>
      {children}
    </Text>
  );
}

export default Type;
