import { useCallback, useState } from "react";
import { useMutation } from "@apollo/client/react";
import { gql } from "@/lib/generated/gql-codegen";


export const useRefreshDbSettings = () => {
  const [isRefreshingDbSettings, setIsRefreshingDbSettings] = useState(false);
  const [mutation] = useMutation(gql(`
    mutation RefreshDbSettings {
      RefreshDbSettings
    }
  `));
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
