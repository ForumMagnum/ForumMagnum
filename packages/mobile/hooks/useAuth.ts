import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";
import { useAsyncStorage } from "@react-native-async-storage/async-storage";
import { useAuthRequest, makeRedirectUri } from "expo-auth-session";
import { AUTH0_CLIENT_ID, AUTH0_DOMAIN } from "../config";
import jwtDecode from "jwt-decode";

const domain = "https://" + AUTH0_DOMAIN;
const authorizationEndpoint = `${domain}/authorize`;
const tokenEndpoint = `${domain}/oauth/token`;

const redirectUri = makeRedirectUri({
  scheme: "eaforum",
  path: "root",
});

export type DecodedUserToken = {
  aud: string,
  exp: number,
  iat: number,
  iss: string,
  name: string,
  nickname: string,
  nonce?: string,
  picture: string,
  sid: string,
  sub: string,
  updated_at: string,
}

export type UserToken = {
  token: string,
  decoded: DecodedUserToken,
}

export const useAuth = () => {
  const [user, setUser] = useState<UserToken | null>(null);

  const {
    getItem: getCachedToken,
    setItem: setToken,
    removeItem: removeToken,
  } = useAsyncStorage("jwtToken");

  const [request, response, promptAsync] = useAuthRequest({
    redirectUri,
    clientId: AUTH0_CLIENT_ID,
    responseType: "id_token",
    scopes: ["openid", "profile"],
    extraParams: {
      nonce: "nonce",
    },
  }, {
    authorizationEndpoint,
  });

  const decodeAndStoreJwt = useCallback((token: string) => {
    if (token) {
      const decoded: DecodedUserToken = jwtDecode(token);
      setUser({token, decoded});
      setToken(token);
    } else {
      setUser(null);
      removeToken();
    }
  }, [setUser, setToken, removeToken]);

  const readTokenFromStorage = useCallback(async () => {
    const tokenString = await getCachedToken();
    if (!tokenString) {
      return;
    }
    decodeAndStoreJwt(tokenString);
  }, [getCachedToken, tokenEndpoint, setToken, setUser]);

  useEffect(() => {
    readTokenFromStorage();

    if (response) {
      if ((response as any)?.error) {
        Alert.alert(
          "Authentication Error",
          (response as any).params?.error_description || "something went wrong",
        );
        return;
      }

      if (response.type === "success") {
        decodeAndStoreJwt(response.params.id_token);
      }
    }
  }, [response]);

  const launchAuthPrompt = useCallback(() => {
    void promptAsync();
  }, [request]);

  return {
    launchAuthPrompt,
    user,
  };
}
