import axios from "axios";
import { HUB_HOST } from "../../config";
import { parseAAState } from "@/helpers/AAHelpers";

import { IState } from "@/interfaces/aa.interface";

interface IPayload {
  address: string;
  var_prefix?: string;
}

export default async function fetchAAStateVars(
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

  const { data } = await axios.post(`${HUB_HOST}/get_aa_state_vars`, payload);

  return delimiter ? parseAAState(data.data, delimiter) : data.data;
}
