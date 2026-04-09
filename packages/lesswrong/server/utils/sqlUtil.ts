import { getPgPromiseLib } from "../sqlConnection";

export function escapeSqlString(str: string): string {
  return getPgPromiseLib().as.value(str);
}
