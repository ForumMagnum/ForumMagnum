import React from 'react';
import { Helmet } from 'react-helmet';

const Head = () => {
  // Helmet.rewind() is deprecated in favour of renderStatic() for better readability
  //@see https://github.com/nfl/react-helmet/releases/tag/5.0.0
  const helmet = Helmet.renderStatic();

  // For any html element type you want to appear in <head>, you have to add it explicitly here
  return (
    <>
      {helmet.title.toComponent()}
      {helmet.meta.toComponent()}
      {helmet.link.toComponent()}
      {helmet.script.toComponent()}
    </>
  );
};
export default Head;
