import React, { FC } from "react";
import { StyleSheet, Button, Text, View } from "react-native";
import { palette } from "../palette";
import { useCurrentUser, useLaunchAuthPrompt } from "../hooks/useCurrentUser";

const styles = StyleSheet.create({
  root: {
    marginRight: 14,
  },
});

const LoginButton: FC = () => {
  const launchAuthPrompt = useLaunchAuthPrompt();
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

const UserHeaderInfo: FC = () => {
  const currentUser = useCurrentUser();
  if (!currentUser) {
    return (
      <LoginButton />
    );
  }
  return (
    <View style={styles.root}>
      <Text>{currentUser.displayName}</Text>
    </View>
  );
}

export default UserHeaderInfo;
