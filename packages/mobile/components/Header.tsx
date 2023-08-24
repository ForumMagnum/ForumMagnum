import React, { FC, useCallback } from "react";
import { StyleSheet, View, Image } from "react-native";
import { useNavigation } from "../hooks/useNavigation";
import Type from "./Type";
import Touchable from "./Touchable";

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    width: "100%",
    maxWidth: "100%",
  },
  logo: {
    width: 30,
    height: 30,
  },
  title: {
    fontSize: 18,
    flexGrow: 1,
  },
});

const Header: FC = () => {
  const navigation = useNavigation();
  const onPress = useCallback(() => {
    navigation.navigate("Home", {});
  }, [navigation]);
  return (
    <Touchable onPress={onPress}>
      <View style={styles.root}>
        <Image
          style={styles.logo}
          source={require("../assets/ea_forum_logo.png")}
        />
        <Type style={styles.title} numberOfLines={1}>
          EA Forum
        </Type>
      </View>
    </Touchable>
  );
}

export default Header;
