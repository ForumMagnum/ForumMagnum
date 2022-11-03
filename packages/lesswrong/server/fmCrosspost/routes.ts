import { fmCrosspostBaseUrlSetting } from "../../lib/instanceSettings";
import { combineUrls } from "../../lib/vulcan-lib";
import { Application, Request, json } from "express";
import {
  onCrosspostTokenRequest,
  onConnectCrossposterRequest,
  onUnlinkCrossposterRequest,
  onCrosspostRequest,
  onUpdateCrosspostRequest,
  onGetCrosspostRequest,
} from "./requestHandlers";
import { isLeft } from 'fp-ts/Either';
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

export type GetRouteOf<T extends ValidatedGetRouteName> = (req: Request) => Promise<ValidatedGetRoutes[T]['responseValidator']['_A']>;
export type PostRouteOf<T extends ValidatedPostRouteName> = (req: ValidatedPostRoutes[T]['requestValidator']['_A']) => Promise<ValidatedPostRoutes[T]['responseValidator']['_A']>;

export type ApiRoute = ValidatedGetRoutes[ValidatedGetRouteName]['path'] | ValidatedPostRoutes[ValidatedPostRouteName]['path'];

export const addCrosspostRoutes = (app: Application) => {
  const addGetRoute = <RouteName extends ValidatedGetRouteName>(route: ValidatedGetRoutes[RouteName], callback: GetRouteOf<RouteName>) => {
    app.get(route.path, async (req, res) => {
      let response: ValidatedGetRoutes[RouteName]['responseValidator']['_A'];
      try {
        response = await callback(req);
      } catch (e) {
        console.error({ error: e });
        return res
          .status(e instanceof ApiError ? e.code : 501)
          .send({error: e.message ?? "An unknown error occurred"})
      }

      if (isLeft(route.responseValidator.decode(response))) {
        console.error('Invalid response body', { response });
        return res.status(501).send({ error: 'An unknown error occurred' });
      }

      return res.send(response);
    });
  };

  const addPostRoute = <RouteName extends ValidatedPostRouteName>(route: ValidatedPostRoutes[RouteName], callback: PostRouteOf<RouteName>) => {
    app.use(route.path, json({ limit: "1mb" }));
    app.post(route.path, async (req, res) => {
      const validatedRequestBody = route.requestValidator.decode(req.body);
      if (isLeft(validatedRequestBody)) {
        console.error('Invalid request body in cross-site request', { body: req.body });
        return res.status(400).send({ error: 'Invalid request body' });
      }
      let response: ValidatedPostRoutes[RouteName]['responseValidator']['_A'];
      try {
        response = await callback(validatedRequestBody.right);
      } catch (e) {
        console.error({ error: e });
        return res
          .status(e instanceof ApiError ? e.code : 501)
          .send({error: e.message ?? "An unknown error occurred"})
      }

      const decodedResponse = route.responseValidator.decode(response);

      if (isLeft(decodedResponse)) {
        console.error('Invalid response body', { response, errors: decodedResponse.left.flatMap(e => e.context) });
        return res.status(501).send({ error: 'An unknown error occurred' });
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
