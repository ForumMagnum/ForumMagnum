import { useCallback, useState } from "react";
import { gql, useMutation } from "@apollo/client";

export const useRefreshDbSettings = () => {
  const [isRefreshingDbSettings, setIsRefreshingDbSettings] = useState(false);
  const [mutation] = useMutation(gql`
    mutation RefreshDbSettings {
      RefreshDbSettings
    }
  `);
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
