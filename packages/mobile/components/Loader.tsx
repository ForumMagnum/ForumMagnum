import React, { FC } from "react";
import { ActivityIndicator } from "react-native";
import { palette } from "../palette";

const Loader: FC = () => {
  return (
    <ActivityIndicator size="large" color={palette.primary} />
  );
}

export default Loader;
