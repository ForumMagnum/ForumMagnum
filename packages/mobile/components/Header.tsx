import React, { FC } from "react";
import { StyleSheet, View, Image } from "react-native";
// import { useRoute } from "@react-navigation/native";
import Type from "./Type";

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
  // TODO: Should we have custom titles?
  // const {params} = useRoute();
  // const title = (params as any)?.title ?? "EA Forum";
  const title = "EA Forum";
  return (
    <View style={styles.root}>
      <Image
        style={styles.logo}
        source={require("../assets/ea_forum_logo.png")}
      />
      <Type style={styles.title} numberOfLines={1}>
        {title}
      </Type>
      <View style={{alignSelf: "flex-end"}}>
      </View>
    </View>
  );
}

export default Header;
