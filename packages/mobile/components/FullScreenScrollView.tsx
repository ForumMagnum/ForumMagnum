import React, { FC, ReactNode } from "react";
import {
  StyleSheet,
  SafeAreaView,
  ScrollView,
  StyleProp,
  ViewStyle,
  RefreshControl,
} from "react-native";
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
  content: {
    alignItems: "center",
  },
});

const FullScreenScrollView: FC<{
  children: ReactNode,
  onRefresh?: () => void,
  refreshing?: boolean,
  style?: StyleProp<ViewStyle>,
}> = ({children, onRefresh, refreshing, style}) => {
  return (
    <SafeAreaView style={styles.safeAreaRoot}>
      <ScrollView
        style={styles.scrollRoot}
        contentContainerStyle={[styles.content, style]}
        refreshControl={
          onRefresh
            ? (
              <RefreshControl
                refreshing={refreshing ?? false}
                onRefresh={onRefresh}
              />
            )
            : undefined
        }
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export default FullScreenScrollView;
