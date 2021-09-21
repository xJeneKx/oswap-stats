import axios from "axios";

import { ITickers } from "@/interfaces/tickers.interface";

export default async function fetchTickers(): Promise<ITickers> {
  const { data } = await axios.get("https://data.oswap.io/api/v1/tickers");
  return data;
}
