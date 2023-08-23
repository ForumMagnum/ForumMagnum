import React, { FC } from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ApolloProvider } from "@apollo/client";
import { apolloClient } from "./apollo";
import { palette } from "./palette";
import {
  useFonts,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import type { RootStackParamList } from "./navigation";
import Loader from "./components/Loader";
import moment from "moment";
import HomeScreen from "./screens/HomeScreen";
import PostScreen from "./screens/PostScreen";
import Header from "./components/Header";

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

const Stack = createNativeStackNavigator<RootStackParamList>();

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
      <StatusBar
        style="light"
        backgroundColor={palette.primary}
      />
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerStyle: {
              backgroundColor: palette.grey[0],
            },
            headerTitle: Header,
          }}
        >
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{title: "EA Forum"}}
          />
          <Stack.Screen
            name="Post"
            component={PostScreen}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </ApolloProvider>
  );
}

export default App;
