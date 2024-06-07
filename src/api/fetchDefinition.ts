import axios from "axios";
import { HUB_HOST } from "../../config";

import { IState } from "@/interfaces/aa.interface";

interface IPayload {
  address: string;
  var_prefix?: string;
}

export default async function fetchDefinition(
  address: string
): Promise<IState> {
  const payload: IPayload = {
    address,
  };

  const { data } = await axios.post(`${HUB_HOST}/get_definition`, payload);

  return data.data;
}
