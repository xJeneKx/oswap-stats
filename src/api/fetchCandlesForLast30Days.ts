import axios from "axios";

import { ICandles } from "@/interfaces/candles.inerface";

export default async function fetchCandlesForLast30Days(
  market_name: string
): Promise<ICandles[]> {
  const date = new Date();
  const end = date.toISOString();
  date.setDate(date.getDate() - 30);
  const start = date.toISOString();
  const { data } = await axios.get(
    `https://data.oswap.io/api/v1/candles/${market_name}?period=daily&start=${start}&end=${end}`
  );
  return data;
}
