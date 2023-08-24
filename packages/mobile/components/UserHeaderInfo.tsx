import React, { FC } from "react";
import { StyleSheet, Button, Text, View } from "react-native";
import { palette } from "../palette";
import { useAuth } from "../hooks/useAuth";

const styles = StyleSheet.create({
  root: {
    marginRight: 20,
  },
});

const UserHeaderInfo: FC = () => {
  const {launchAuthPrompt, user} = useAuth();

  if (!user) {
    return (
      <View style={styles.root}>
        <Button
          color={palette.primary}
          onPress={launchAuthPrompt}
          title="Login"
        />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <Text>{user.decoded.nickname}</Text>
    </View>
  );
}

export default UserHeaderInfo;
