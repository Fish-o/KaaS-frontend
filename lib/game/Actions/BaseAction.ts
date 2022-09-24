import { Variable } from "./index";

export class BaseAction {
  // id?: string;
  type: `action:${string}`;
  args: { [key: string]: any };
  returns?: { [key: string]: Variable };
}
