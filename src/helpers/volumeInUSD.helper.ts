import { Ref } from "vue";
import { ICandles } from "@/interfaces/candles.inerface";
import { IExchangeRates } from "@/obyte";

export function getVolumeInUSDHelper(
  y_asset: string,
  x_asset: string,
  candle: ICandles,
  exchangeRates: Ref<IExchangeRates>
): number {
  const y_asset_id = y_asset === "base" ? "GBYTE" : y_asset;
  const x_asset_id = x_asset === "base" ? "GBYTE" : x_asset;
  const x_rate = exchangeRates.value[`${x_asset_id}_USD`];
  const y_rate = exchangeRates.value[`${y_asset_id}_USD`];
  if (x_rate)
    return +(x_rate * candle.base_volume).toFixed(2);
  if (y_rate)
    return +(y_rate * candle.quote_volume).toFixed(2);
  return 0;
}
