import { useMutation, gql } from '@apollo/client';
import { getFragmentText } from '../../lib/vulcan-lib';
import { randomId } from '../../lib/random';
import {useCurrentUser} from '../common/withUser';

interface UpsertDialogueCheckArgs {
  targetUserId: string;
  checked?: boolean | null;
  hideInRecommendations?: boolean | null;
  checkId?: string;
}

export const useUpsertDialogueCheck = () => {
  const currentUser = useCurrentUser();
  const currentUserId = currentUser?._id;

  const [upsertDialogueCheck] = useMutation(gql`
    mutation upsertUserDialogueCheck($targetUserId: String!, $checked: Boolean, $hideInRecommendations: Boolean) {
      upsertUserDialogueCheck(targetUserId: $targetUserId, checked: $checked, hideInRecommendations: $hideInRecommendations) {
        ...DialogueCheckInfo
      }
    }
    ${getFragmentText('DialogueCheckInfo')}
    ${getFragmentText('DialogueMatchPreferencesDefaultFragment')}
  `);

  const upsert = async ({ targetUserId, checked = null, hideInRecommendations = null, checkId }: UpsertDialogueCheckArgs) => {
    if (typeof checked === typeof hideInRecommendations) {
      throw new Error("Exactly one of checked or hideInRecommendations must be provided");
    }

    const response = await upsertDialogueCheck({
      variables: {
        targetUserId,
        checked,
        hideInRecommendations
      },
      update(cache, { data }) {
        if (!checkId) {
          cache.modify({
            fields: {
              dialogueChecks(existingChecksRef) {
                const newCheckRef = cache.writeFragment({
                  data: data.upsertUserDialogueCheck,
                  fragment: gql`
                    ${getFragmentText('DialogueCheckInfo')}
                    ${getFragmentText('DialogueMatchPreferencesDefaultFragment')}
                  `,
                  fragmentName: 'DialogueCheckInfo'
                });
                return {
                  ...existingChecksRef,
                  results: [...existingChecksRef.results, newCheckRef]
                }
              }
            }
          });
        }
      },
      optimisticResponse: {
        upsertUserDialogueCheck: {
          _id: checkId ?? randomId(),
          __typename: 'DialogueCheck',
          userId: currentUserId,
          targetUserId,
          checked: checked,
          checkedAt: new Date(),
          hideInRecommendations: hideInRecommendations,
          match: false,
          matchPreference: null,
          reciprocalMatchPreference: null
        }
      }
    });

    return response;
  };

  return upsert;
};
