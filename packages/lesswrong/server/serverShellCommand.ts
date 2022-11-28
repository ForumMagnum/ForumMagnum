import { Application, Request, Response, json } from "express";
import { testServerSetting } from "../lib/instanceSettings";

let serverShellCommandScope: Record<string, any> = {};

export const setServerShellCommandScope = (scope: Record<string, any>) =>
  serverShellCommandScope = scope;

const compileWithGlobals = (code: string) => {
  // This is basically just eval() but done in a way that:
  //   1) Allows us to define our own global scope
  //   2) Doesn't upset esbuild
  const callable = (async function () {}).constructor(`with(this) { return ${code} }`);
  return () => {
    return callable.call(new Proxy({}, {
      has () { return true; },
      get (_target, key) {
        if (typeof key !== "symbol") {
          return global[key as keyof typeof global] ?? serverShellCommandScope[key];
        }
      }
    }));
  }
}

export const addServerShellCommandRoutes = (app: Application) => {
  if (testServerSetting.get()) {
    const route = "/api/serverShellCommand";
    app.use(route, json({ limit: "1mb" }));
    app.post(route, async (req: Request, res: Response) => {
      try {
        const {command, wait} = req.body;
        if (!command) {
          throw new Error("Missing command");
        }

        // eslint-disable-next-line no-console
        console.log(`Running serverShellCommand: ${command}`);

        const func = compileWithGlobals(command);
        if (!wait) {
          res.status(200).send({status: "ok", command, wait});
        }

        const result = await func();

        // eslint-disable-next-line no-console
        console.log("Finished. Result: ", result);

        if (wait) {
          res.status(200).send({status: "ok", command, wait, result});
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.log("Failed.");
        res.status(500).send({status: "error", body: req.body, message: e.message});
      }
    });
  }
}
