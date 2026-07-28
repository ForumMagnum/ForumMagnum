import React from 'react';
import { Link } from '@/lib/reactRouterWrapper';
import { classifyLink } from '@/lib/routeUtil';
import AnalyticsTracker from '../common/AnalyticsTracker';

/**
 * A link in user-provided content, rendered without any hover preview of its
 * own: client-side routed when it points at us, and click-tracked when it
 * doesn't. Used by DefaultPreview (whose card is the URL itself) and by
 * HoverPreviewLink when an enclosing custom preview has already claimed the
 * phrase.
 */
const ContentLink = ({ href, onsite, id, rel, className, children }: {
  href: string,
  /** Defaults to classifying the href; pass it when the caller already knows. */
  onsite?: boolean,
  id?: string,
  rel?: string,
  className?: string,
  children: React.ReactNode,
}) => {
  const isOnsite = onsite ?? classifyLink(href) === 'onsite';

  if (isOnsite) {
    return <Link to={href} id={id} rel={rel} className={className}>{children}</Link>
  }

  return <AnalyticsTracker eventType="link" eventProps={{to: href}}>
    <a href={href} id={id} rel={rel} className={className}>
      {children}
    </a>
  </AnalyticsTracker>
}

export default ContentLink;
