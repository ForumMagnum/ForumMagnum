import React, { FC, ReactNode } from "react";
import { StyleSheet, SafeAreaView, ScrollView } from "react-native";
import { palette } from "../palette";

const styles = StyleSheet.create({
  safeAreaRoot: {
    flex: 1,
    backgroundColor: palette.grey[60],
    alignItems: "center",
    fontFamily: palette.fonts.sans.medium,
  },
  scrollRoot: {
    width: "100%",
    height: "100%",
  },
});

const FullScreenScrollView: FC<{children: ReactNode}> = ({children}) => {
  return (
    <SafeAreaView style={styles.safeAreaRoot}>
      <ScrollView style={styles.scrollRoot}>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export default FullScreenScrollView;
