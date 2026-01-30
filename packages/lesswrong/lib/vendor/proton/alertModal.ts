import React from 'react';

export const useGenericAlertModal = (): [React.ReactElement | null, (props: { title: string; translatedMessage: string }) => void] => {
  const show = (_props: { title: string; translatedMessage: string }) => {};
  return [null, show];
};
