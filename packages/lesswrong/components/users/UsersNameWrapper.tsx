import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import type { Placement as PopperPlacementType } from "popper.js"
import Loading from "../vulcan-core/Loading";
import UsersNameDisplay from "./UsersNameDisplay";
import UserNameDeleted from "./UserNameDeleted";
import { gql } from "@/lib/generated/gql-codegen";
import { useQuery } from "@/lib/crud/useQuery";

const UsersMinimumInfoQuery = gql(`
  query UsersNameWrapper($documentId: String) {
    user(input: { selector: { documentId: $documentId } }) {
      result {
        ...UsersMinimumInfo
      }
    }
  }
`);

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
  const { loading, data } = useQuery(UsersMinimumInfoQuery, {
    variables: { documentId: documentId },
  });
  const document = data?.user?.result;
  if (!document && loading) {
    return <Loading />
  } else if (document) {
    return <UsersNameDisplay user={document} nofollow={nofollow || document.spamRiskScore<0.8} simple={simple} nowrap={nowrap} className={className} {...otherProps}/>
  } else {
    return <UserNameDeleted/>
  }
};

export default registerComponent('UsersNameWrapper', UsersNameWrapper);


