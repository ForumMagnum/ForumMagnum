import React, { FC } from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";
import { ApolloProvider } from "@apollo/client";
import { apolloClient } from "./apollo";
import {
  useFonts,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import PostsList from "./components/PostsList";
import Loader from "./components/Loader";
import { palette } from "./palette";
import moment from "moment";

moment.updateLocale("en", {
  relativeTime: {
    future: "%s",
    past: "%s",
    s: "now",
    ss: "%ds",
    m: "1m",
    mm: "%dm",
    h: "1h",
    hh: "%dh",
    d: "1d",
    dd: "%dd",
    M: "1mo",
    MM: "%dmo",
    y: "1y",
    yy: "%dy"
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.grey[60],
    alignItems: "center",
    justifyContent: "center",
    fontFamily: palette.fonts.sans.medium,
  },
});

const App: FC = () => {
  const [fontsLoaded] = useFonts({
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <Loader />
    );
  }

  return (
    <ApolloProvider client={apolloClient}>
      <StatusBar style="auto" />
      <View style={styles.container}>
        <PostsList />
      </View>
    </ApolloProvider>
  );
}

export default App;
