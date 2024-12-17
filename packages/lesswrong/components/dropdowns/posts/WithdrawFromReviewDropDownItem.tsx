import React from "react";
import { registerComponent, Components } from "../../../lib/vulcan-lib";
import { useCurrentUser } from "../../common/withUser";
import { canWithdrawFromReview } from "@/lib/reviewUtils";

const WithdrawFromReviewDropdownItem = ({post, closeMenu}: {
  post: PostsList|SunshinePostsList,
  closeMenu?: () => void,
}) => {
  const currentUser = useCurrentUser();


  if (!canWithdrawFromReview(currentUser, post)) {
    return null;
  }

  const withdrawFromReview = () => {
    
  }

  const {DropdownItem} = Components;
  return (
    <DropdownItem
      title="Withdraw from Review"
      onClick={withdrawFromReview}
    />
  );
}

const WithdrawFromReviewDropdownItemComponent = registerComponent(
  "WithdrawFromReviewDropdownItem",
  WithdrawFromReviewDropdownItem,
);

declare global {
  interface ComponentTypes {
    WithdrawFromReviewDropdownItem: typeof WithdrawFromReviewDropdownItemComponent
  }
}
