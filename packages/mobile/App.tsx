import React, { FC, ReactNode } from "react";
import { maybeCompleteAuthSession } from "expo-web-browser";
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
import {
  Merriweather_400Regular,
  Merriweather_700Bold,
} from "@expo-google-fonts/merriweather";
import type { RootStackParamList } from "./hooks/useNavigation";
import Loader from "./components/Loader";
import moment from "moment";
import HomeScreen from "./screens/HomeScreen";
import PostScreen from "./screens/PostScreen";
import Header from "./components/Header";
import UserHeaderInfo from "./components/UserHeaderInfo";

maybeCompleteAuthSession();

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

const Providers: FC<{children: ReactNode}> = ({children}) => {
  return (
    <ApolloProvider client={apolloClient}>
      {children}
    </ApolloProvider>
  )
}

const App: FC = () => {
  const [fontsLoaded] = useFonts({
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Merriweather_400Regular,
    Merriweather_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <Loader />
    );
  }

  return (
    <Providers>
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
            headerRight: UserHeaderInfo,
          }}
        >
          <Stack.Screen
            name="Home"
            component={HomeScreen}
          />
          <Stack.Screen
            name="Post"
            component={PostScreen}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </Providers>
  );
}

export default App;
