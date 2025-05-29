import React, { useContext } from 'react';
import { Helmet as RawHelmet } from 'react-helmet-async';

export const SentHeadBlocksContext = React.createContext<(name: string) => void>(()=>{});

export const Helmet = ({name, children}: {
  name: string
  children: React.ReactNode
}) => {
  const onSendHeadBlock = useContext(SentHeadBlocksContext);
  onSendHeadBlock(name);

  return <RawHelmet>
    {children}
  </RawHelmet>
}


