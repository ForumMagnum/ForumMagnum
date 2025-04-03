import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useSingle } from '../../lib/crud/withSingle';
import React from 'react';
import type { PopperPlacementType } from '@/lib/vendor/@material-ui/core/src/Popper'

/**
 * UsersNameWrapper: You probably should be using UsersName instead.
 *
 * Given a user ID (as documentId), load that user with a graphql request, and
 * display their name. If the nofollow attribute is true OR the user has a
 * spam-risk score below 0.8, the user-page link will be marked nofollow.
 */
const UsersNameWrapper = ({documentId, nofollow=false, simple=false, nowrap=false, className, ...otherProps}: {
  documentId: string,
  nofollow?: boolean,
  simple?: boolean,
  nowrap?: boolean,
  className?: string,
  tooltipPlacement?: PopperPlacementType,
}) => {
  const { document, loading } = useSingle({
    documentId,
    collectionName: "Users",
    fragmentName: 'UsersMinimumInfo',
  });
  if (!document && loading) {
    return <Components.Loading />
  } else if (document) {
    return <Components.UsersNameDisplay user={document} nofollow={nofollow || document.spamRiskScore<0.8} simple={simple} nowrap={nowrap} className={className} {...otherProps}/>
  } else {
    return <Components.UserNameDeleted/>
  }
};

const UsersNameWrapperComponent = registerComponent('UsersNameWrapper', UsersNameWrapper);

declare global {
  interface ComponentTypes {
    UsersNameWrapper: typeof UsersNameWrapperComponent
  }
}
