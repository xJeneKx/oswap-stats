import axios from "axios";
import { API_HOST } from "../../config";

import { ICandles } from "@/interfaces/candles.inerface";

export default async function fetchCandlesForLast60Days(
  market_name: string
): Promise<ICandles[]> {
  const date = new Date();
  const end = date.toISOString();
  date.setUTCDate(date.getUTCDate() - 60);
  const start = date.toISOString();
  const { data } = await axios.get(
    `${API_HOST}/api/v1/candles/${market_name}?period=daily&start=${start}&end=${end}`
  );
  return data;
}
