import { NativeStackNavigationProp } from "react-native-screens/native-stack";
import { useNavigation as useNav } from "@react-navigation/native";

export type RootStackParamList = {
  Home: {},
  Post: {postId: string, title: string},
};

export const useNavigation = useNav<NativeStackNavigationProp<RootStackParamList>>;
