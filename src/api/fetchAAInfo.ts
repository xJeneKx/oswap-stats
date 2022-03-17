import Obyte from "@/obyte";
import fetchAAStateVars from "@/api/fetchAAStateVars";
import { IState } from "@/interfaces/aa.interface";

export default async function fetchAAInfo(
  Client: Obyte.Client,
  address: string
): Promise<IState> {
  const stateVars = await fetchAAStateVars(Client, address);
  const definition = await Client.api.getDefinition(address);
  const params = definition[1].params;
  const defaults = { swap_fee: 0.003, exit_fee: 0.005, arb_profit_tax: 0, leverage_profit_tax: 0, leverage_token_tax: 0, mid_price: 0, price_deviation: 0, base_interest_rate: 0.2, pool_leverage: 1, alpha: 0.5, period_length: 3600 };
  const info = { ...defaults, ...params, ...stateVars };
  return { info, params, stateVars };
}
