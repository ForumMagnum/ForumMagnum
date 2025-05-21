import React from 'react';
import { Typography } from "../common/Typography";

export const EmailTokenResult = ({message}: {
  message: string,
}) => {
  return <Typography variant="body2">{message}</Typography>
}
