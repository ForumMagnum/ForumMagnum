import { frag } from "@/lib/fragments/fragmentWrapper";

export const ElicitQuestionFragment = () => frag`
  fragment ElicitQuestionFragment on ElicitQuestion {
    _id
    title
    notes
    resolution
    resolvesBy
  }
`;
