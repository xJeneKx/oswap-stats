import { parseAAState } from "@/helpers/AAHelpers";
import Obyte from "@/obyte";

import { IState } from "@/interfaces/aa.interface";

interface IPayload {
  address: string;
  var_prefix?: string;
}

export default async function fetchAAStateVars(
  Client: Obyte.Client,
  address: string,
  prefix?: string,
  delimiter?: string
): Promise<IState> {
  const payload: IPayload = {
    address,
  };

  if (prefix) {
    payload.var_prefix = prefix;
  }

  const state = (await Client.api.getAaStateVars(payload)) as IState;

  return delimiter ? parseAAState(state, delimiter) : state;
}
