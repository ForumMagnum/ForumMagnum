import React, { useContext } from 'react';
import { Helmet as RawHelmet } from 'react-helmet-async';

export const SSRResponseContext = React.createContext<{
  onSendHeadBlock: (name: string) => void
  setStructuredData: (generate: () => Record<string,AnyBecauseHard>) => void
}>({
  onSendHeadBlock: ()=>{},
  setStructuredData: ()=>{},
});

export const Helmet = ({name, children}: {
  name: string
  children: React.ReactNode
}) => {
  const { onSendHeadBlock } = useContext(SSRResponseContext);
  onSendHeadBlock(name);

  return <RawHelmet>
    {children}
  </RawHelmet>
}


