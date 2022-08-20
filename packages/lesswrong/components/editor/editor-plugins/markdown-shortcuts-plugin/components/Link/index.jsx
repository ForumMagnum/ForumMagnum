import React from 'react';

const Link = (props) => {
  const { href, title } = props.contentState.getEntity(props.entityKey).getData();
  return (
    <a href={href} title={title}>
      {props.children}
    </a>
  );
};

export default Link;
