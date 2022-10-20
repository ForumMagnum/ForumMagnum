import path from "path";
import {acceptMigrations} from "../packages/lesswrong/server/scripts/acceptMigrations"

void acceptMigrations({write: true, rootPath: path.join(__dirname, "../")}).finally(() => console.log("Done!"));
