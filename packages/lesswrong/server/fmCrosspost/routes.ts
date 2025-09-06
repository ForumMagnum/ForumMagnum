import { fmCrosspostBaseUrlSetting } from "../../lib/instanceSettings";
import { combineUrls } from "../../lib/vulcan-lib/utils";
import { Application, Request, json } from "express";
import {
  onCrosspostTokenRequest,
  onConnectCrossposterRequest,
  onUnlinkCrossposterRequest,
  onCrosspostRequest,
  onUpdateCrosspostRequest,
  onGetCrosspostRequest,
} from "./requestHandlers";
import { isLeft } from "@/lib/utils/typeGuardUtils";
import { ConnectCrossposterRequestValidator, ConnectCrossposterResponseValidator, CrosspostRequestValidator, CrosspostResponseValidator, CrosspostTokenResponseValidator, GetCrosspostRequestValidator, GetCrosspostResponseValidator, UnlinkCrossposterRequestValidator, UnlinkedCrossposterResponseValidator, UpdateCrosspostRequestValidator, UpdateCrosspostResponseValidator } from "./types";
import { ApiError } from "./errors";

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

export type GetRouteOf<T extends ValidatedGetRouteName> = (req: Request) => Promise<GetResponseTypes<T>>;
export type PostRouteOf<T extends ValidatedPostRouteName> = (req: PostRequestTypes<T>) => Promise<PostResponseTypes<T>>;

export type ApiRoute = ValidatedGetRoutes[ValidatedGetRouteName]['path'] | ValidatedPostRoutes[ValidatedPostRouteName]['path'];

export const addCrosspostRoutes = (app: Application) => {
  const addGetRoute = <RouteName extends ValidatedGetRouteName>(route: ValidatedGetRoutes[RouteName], callback: GetRouteOf<RouteName>) => {
    app.get(route.path, async (req, res) => {
      let response: GetResponseTypes<RouteName>;
      try {
        response = await callback(req);
      } catch (e) {
          // eslint-disable-next-line no-console
        console.error('Error when making cross-site GET request', { route: route.path, error: e });
        const errorCode = e instanceof ApiError ? e.code : 501;
        // Return a 200 to avoid this triggering a health check failure,
        // the error is still handled in makeCrossSiteRequest on the server making the request
        return res
          .status(200)
          .send({error: {message: e.message ?? "An unknown error occurred", code: errorCode}})
      }

      const decodedResponse = route.responseValidator.decode(response);

      if (isLeft(decodedResponse)) {
          // eslint-disable-next-line no-console
        console.error('Invalid response body when making cross-site GET request', { response, errors: decodedResponse.left.flatMap(e => e.context) });
        // Return a 200 to avoid this triggering a health check failure,
        // the error is still handled in makeCrossSiteRequest on the server making the request
        return res.status(200).send({ error: {message: 'An unknown error occurred' , code: 501 }});
      }

      return res.send(response);
    });
  };

  const addPostRoute = <RouteName extends ValidatedPostRouteName>(route: ValidatedPostRoutes[RouteName], callback: PostRouteOf<RouteName>) => {
    app.use(route.path, json({ limit: "1mb" }));
    app.post(route.path, async (req, res) => {
      const validatedRequestBody = route.requestValidator.decode(req.body);
      if (isLeft(validatedRequestBody)) {
        // eslint-disable-next-line no-console
        console.error('Invalid request body in cross-site POST request', { body: req.body, path: route.path });
        return res.status(400).send({ error: 'Invalid request body' });
      }
      let response: PostResponseTypes<RouteName>;
      try {
        response = await callback(validatedRequestBody.right);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Error when making cross-site POST request', { route: route.path, error: e });
        const errorCode = e instanceof ApiError ? e.code : 501;
        // Return a 200 to avoid this triggering a health check failure,
        // the error is still handled in makeCrossSiteRequest on the server making the request
        return res
          .status(200)
          .send({error: {message: e.message ?? "An unknown error occurred", code: errorCode }})
      }

      const decodedResponse = route.responseValidator.decode(response);

      if (isLeft(decodedResponse)) {
        // eslint-disable-next-line no-console
        console.error('Invalid response body when making cross-site GET request', { response, errors: decodedResponse.left.flatMap(e => e.context) });
        // Return a 200 to avoid this triggering a health check failure,
        // the error is still handled in makeCrossSiteRequest on the server making the request
        return res.status(200).send({ error: {message: 'An unknown error occurred', code: 501 }});
      }

      return res.send(response);
    });
  };
  
  addGetRoute(validatedGetRoutes.crosspostToken, onCrosspostTokenRequest);
  addPostRoute(validatedPostRoutes.connectCrossposter, onConnectCrossposterRequest);
  addPostRoute(validatedPostRoutes.unlinkCrossposter, onUnlinkCrossposterRequest);
  addPostRoute(validatedPostRoutes.crosspost, onCrosspostRequest);
  addPostRoute(validatedPostRoutes.updateCrosspost, onUpdateCrosspostRequest);
  addPostRoute(validatedPostRoutes.getCrosspost, onGetCrosspostRequest);
}
