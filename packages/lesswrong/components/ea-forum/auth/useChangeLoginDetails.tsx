import { useMutation, gql } from "@apollo/client";
import { useCallback } from "react";

const canChangeDetailsMutation = gql`
  mutation CanChangeLoginDetailsTo($email: String!, $password: String!) {
    CanChangeLoginDetailsTo(email: $email, password: $password)
  }
`;

const changeDetailsMutation = gql`
  mutation ChangeLoginDetailsTo($email: String!, $password: String!) {
    ChangeLoginDetailsTo(email: $email, password: $password)
  }
`;

export const useChangeLoginDetails = () => {
  const [checkLoginDetails, canChangeResult] = useMutation<{ CanChangeLoginDetailsTo: boolean }>(
    canChangeDetailsMutation
  );

  const [changeLoginDetails, changeResult] = useMutation<{ ChangeLoginDetailsTo: boolean }>(
    changeDetailsMutation
  );

  const canChangeLoginDetailsTo = useCallback(async (email: string, password: string) => {
    const res = await checkLoginDetails({ variables: { email, password } });
    return res?.data?.CanChangeLoginDetailsTo;
  }, [checkLoginDetails]);


  const changeLoginDetailsTo = useCallback(async (email: string, password: string) => {
    const res = await changeLoginDetails({ variables: { email, password } });
    return res?.data?.ChangeLoginDetailsTo;
  }, [changeLoginDetails]);

  return { canChangeLoginDetailsTo, changeLoginDetailsTo, canChangeResult, changeResult };
};
