import React from 'react';
import defineComponent from '../../lib/defineComponent';

const Footer = props => {
  return (
    <div className="footer"><a href="/about">Made with heart and brain for humanity</a></div>
  )
}

export default defineComponent({
  name: 'Footer',
  component: Footer
});
