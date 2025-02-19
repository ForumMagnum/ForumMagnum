import { useCallback, useState } from "react";
import { gql, useMutation } from "@apollo/client";

const refreshDbSettingsMutation = gql`
  mutation RefreshDbSettings {
    RefreshDbSettings
  }
`;

export const useRefreshDbSettings = () => {
  const [isRefreshingDbSettings, setIsRefreshingDbSettings] = useState(false);
  const [mutation] = useMutation(refreshDbSettingsMutation);
  const refreshDbSettings = useCallback(async () => {
    setIsRefreshingDbSettings(true);
    await mutation();
    window.location.reload();
  }, [mutation]);
  return {
    refreshDbSettings,
    isRefreshingDbSettings,
  };
}
