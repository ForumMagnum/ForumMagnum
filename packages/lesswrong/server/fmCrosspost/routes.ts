import { fmCrosspostBaseUrlSetting } from "../../lib/instanceSettings";
import { combineUrls } from "../../lib/vulcan-lib/utils";
import { ConnectCrossposterRequestValidator, ConnectCrossposterResponseValidator, CrosspostRequestValidator, CrosspostResponseValidator, CrosspostTokenResponseValidator, GetCrosspostRequestValidator, GetCrosspostResponseValidator, UnlinkCrossposterRequestValidator, UnlinkedCrossposterResponseValidator, UpdateCrosspostRequestValidator, UpdateCrosspostResponseValidator } from "./types";

export const makeApiUrl = (route: ApiRoute) => combineUrls(fmCrosspostBaseUrlSetting.get() ?? "", route);

export const validatedGetRoutes = {
  crosspostToken: {
    path: "/api/crosspostToken",
    responseValidator: CrosspostTokenResponseValidator
  },
} as const;

export const validatedPostRoutes = {
  connectCrossposter: {
    path: "/api/connectCrossposter",
    requestValidator: ConnectCrossposterRequestValidator,
    responseValidator: ConnectCrossposterResponseValidator
  },
  unlinkCrossposter: {
    path: "/api/unlinkCrossposter",
    requestValidator: UnlinkCrossposterRequestValidator,
    responseValidator: UnlinkedCrossposterResponseValidator
  },
  crosspost: {
    path: "/api/crosspost",
    requestValidator: CrosspostRequestValidator,
    responseValidator: CrosspostResponseValidator
  },
  updateCrosspost: {
    path: "/api/updateCrosspost",
    requestValidator: UpdateCrosspostRequestValidator,
    responseValidator: UpdateCrosspostResponseValidator
  },
  getCrosspost: {
    path: "/api/getCrosspost",
    requestValidator: GetCrosspostRequestValidator,
    responseValidator: GetCrosspostResponseValidator
  }
} as const;


type ValidatedGetRouteName = keyof typeof validatedGetRoutes;
type ValidatedGetRoutes = typeof validatedGetRoutes;

export type ValidatedPostRouteName = keyof typeof validatedPostRoutes;
export type ValidatedPostRoutes = typeof validatedPostRoutes;

// In io-ts, _A is the type validated by a successful decoding/type guarding operation (`.decode`/`.is`)
export type GetResponseTypes<T extends ValidatedGetRouteName> = ValidatedGetRoutes[T]['responseValidator']['_A'];
export type PostRequestTypes<T extends ValidatedPostRouteName> = ValidatedPostRoutes[T]['requestValidator']['_A'];
export type PostResponseTypes<T extends ValidatedPostRouteName> = ValidatedPostRoutes[T]['responseValidator']['_A'];

export type ApiRoute = ValidatedGetRoutes[ValidatedGetRouteName]['path'] | ValidatedPostRoutes[ValidatedPostRouteName]['path'];

