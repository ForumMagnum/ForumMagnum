import { canRequireCommentApprovalGroup } from "../../permissions";

canRequireCommentApprovalGroup.can([
  'commentapproval.create',
  'commentapproval.update.own',
]);
