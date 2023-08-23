import React, { FC } from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import { useMulti } from "./hooks/useMulti";
import { ApolloProvider } from "@apollo/client";
import { apolloClient } from "./apollo";
import Loader from "./components/Loader";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});

const Main: FC = () => {
  const {results, loading} = useMulti();
  console.log(results, loading);
  return (
    <View style={styles.container}>
      <Text>Open up App.tsx to start working on your app!</Text>
      <StatusBar style="auto" />
      <Loader />
    </View>
  );
}

const App: FC = () => {
  return (
    <ApolloProvider client={apolloClient}>
      <Main />
    </ApolloProvider>
  );
}

export default App;
