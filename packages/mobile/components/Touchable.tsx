import React, { FC } from "react";
import { TouchableOpacity, TouchableWithoutFeedbackProps } from "react-native";

const Touchable: FC<TouchableWithoutFeedbackProps> = ({children, ...props}) => {
  return (
    <TouchableOpacity activeOpacity={0.5} {...props}>
      {children}
    </TouchableOpacity>
  );
}

export default Touchable;
