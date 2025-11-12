"use client";

import React from 'react';
import { defineStyles } from '../hooks/useStyles';
import UltraFeed from "../ultraFeed/UltraFeed";

const styles = defineStyles("UltraFeedPage", (theme: ThemeType) => ({
  loginMessage: {
    textAlign: 'center',
    padding: 20,
  },
}));

const UltraFeedPage = () => {
  return <UltraFeed alwaysShow hideTitle />;
};

export default UltraFeedPage;

 
