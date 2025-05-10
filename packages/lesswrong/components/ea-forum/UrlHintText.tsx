import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { Link } from "../../lib/reactRouterWrapper";
import { useNavigate } from "../../lib/routeUtil";

const linkPostPostPath = '/posts/8yDsenRQhNF4HEDwu/link-posting-is-an-act-of-community-service'

/** Need a whole damn component to insert a link */
const UrlHintTextInner = () => {
  const navigate = useNavigate();

  return <>
    Please write what you liked about the post, and consider sharing some relevant excerpts. If you have permission from the author, you can also copy in the entire post text. If you know the author's username you can add them as a co-author of this post in the "Options" menu below. You can find more guidelines{' '}
    <Link
      to={linkPostPostPath}
      // This link gets removed as soon as focus shifts from the input,
      // mousedown shifts focus from the input, and prevents the link from
      // being clicked, so we immediately click the link on mouseDown.
      onMouseDown={e => {
        if (e.ctrlKey || e.metaKey) {
          window.open(linkPostPostPath, '_blank');
          return
        }
        // ...which requires manually using navigate, which is why we need
        // our own component here
        navigate(linkPostPostPath)
      }}
      // Clicking should be handled by onMouseDown. Prevent accidental double effects.
      onClick={e => {
        e.preventDefault();
      }}
    >
      here
    </Link>.
  </>;
}

export const UrlHintText = registerComponent("UrlHintText", UrlHintTextInner);


