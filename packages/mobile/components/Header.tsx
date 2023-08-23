import React, { FC } from "react";
import { StyleSheet, View, Image } from "react-native";
import { useRoute } from "@react-navigation/native";
import Type from "./Type";

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  logo: {
    width: 30,
    height: 30,
  },
  title: {
    fontSize: 18,
  },
});

const Header: FC = () => {
  const {params} = useRoute();
  const title = (params as any)?.title ?? "EA Forum";
  return (
    <View style={styles.root}>
      <Image
        style={styles.logo}
        source={require("../assets/ea_forum_logo.png")}
      />
      <Type style={styles.title} numberOfLines={1}>
        {title}
      </Type>
    </View>
  );
}

export default Header;
