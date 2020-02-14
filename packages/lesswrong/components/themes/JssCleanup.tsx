import React, { useEffect } from 'react';

// Remove the server-side injected CSS.
const JssCleanup = () => {
  useEffect(() => {
    if (!document || !document.getElementById) return;

    const jssStyles = document.getElementById('jss-server-side');
    if (jssStyles && jssStyles.parentNode) {
      jssStyles.parentNode.removeChild(jssStyles);
    }
  });
  return null;
};

export default JssCleanup;
