import fetchAAInfo from "@/api/fetchAAInfo";
import { IAssetsList, IAsset } from "@/interfaces/assets.interface";
import { IDecimals } from "@/interfaces/decimals.interface";
import { ITickers } from "@/interfaces/tickers.interface";
import { IState } from "@/interfaces/aa.interface";
import { getPoolState } from "oswap-v2-sdk";

interface IExchangeRates {
  [key: string]: number;
}

type Balance = {
  x: number;
  y: number;
  xn: number;
  yn: number;
};

export default class Pool {
  ready = false;
  address = "";
  y_asset = "";
  y_asset_decimals = 0;
  x_asset = "";
  x_asset_decimals = 0;
  swapFee = 0;
  asset = "";
  asset_decimals = 0;
  ticker = "";
  tickerForApi = "";
  balances: Balance = { x: 0, y: 0, xn: 0, yn: 0 };
  params: IState = {};
  stateVars: IState = {};
  supply = 0;
  base = 0;
  marketcap = 0;
  history: any;

  constructor(address: string, x_asset: string, y_asset: string) {
    this.x_asset = x_asset;
    this.y_asset = y_asset;
    this.address = address;
  }

  async init(
    assets: IAssetsList,
    decimals: IDecimals
  ): Promise<void> {
    const { info, params, stateVars } = await fetchAAInfo(this.address);
    this.params = params;
    this.stateVars = stateVars;
    this.swapFee = info.swap_fee;
    this.asset = info.lp_shares.asset;
    if (info.balances)
      this.balances = info.balances;
    this.supply = info.lp_shares.issued;
    const poolName = `${this.x_asset}_${this.y_asset}`;
    this.ticker = this.getTicker(poolName, assets);
    this.tickerForApi = this.getTickerForAPI(assets);

    this.setAssetsDecimals(decimals);
    this.ready = true;
  }

  setAssetsDecimals(decimals: IDecimals): void {
    this.y_asset_decimals = decimals[this.y_asset];
    this.asset_decimals = decimals[this.asset];
    this.x_asset_decimals = decimals[this.x_asset];
  }

  shorten(asset: string): string {
    if (asset.length < 10) return asset;
    return `${asset.slice(0, 4)}...${asset.slice(asset.length - 4)}`;
  }

  getTicker(poolName: string, assets: IAssetsList): string {
    if (!poolName) return "";
    let ticker = "";

    poolName.split("_").forEach((asset, i) => {
      ticker +=
        assets[asset] && assets[asset].symbol
          ? assets[asset].symbol
          : this.shorten(asset);
      if (poolName.split("_").length === 2 && i === 0) ticker += "-";
    });

    return ticker;
  }

  getTickerForAPI(assets: IAssetsList): string {
    if (!assets) return "";
    return this.getTicker(`${this.x_asset}_${this.y_asset}`, assets);
  }

  hasLiquidity(): boolean {
    return !(!this.balances.xn || !this.balances.yn || !this.supply);
  }

  assetValue(value: number, asset: IAsset): number {
    const decimals = asset ? asset.decimals : 0;
    return value / 10 ** decimals;
  }

  getPrice(assetId: string, assets: IAssetsList): number {
    const poolState = getPoolState(this.params, this.stateVars);
    const { balances, shifts: { x0, y0 }, pool_props: { alpha, beta } } = poolState;
    const asset = assets[assetId];
    const decimals = asset ? asset.decimals : 0;
    const px = alpha / beta * (balances.y + y0) / (balances.x + x0);
    if (this.x_asset == assetId) {
      return px * 10 ** decimals;
    } else if (this.y_asset == assetId) {
      return 1 / px * 10 ** decimals;
    }
    throw Error(`not a pool asset ${assetId}`);
  }

  getSymbol(assetId: string, assets: IAssetsList): string {
    return assets[assetId].symbol;
  }

  getFormattedPrice(
    assetId: string,
    decimals: number,
    assets: IAssetsList
  ): number {
    const amount = this.getPrice(assetId, assets);
    const multiplier = 10 ** decimals;
    const nmbr = parseFloat((amount / multiplier).toPrecision(6));
    return isNaN(nmbr) || nmbr < 0 ? 0 : nmbr;
  }

  getMarketcap(assets: IAssetsList, exchangeRates: IExchangeRates): number {
    const x_asset_id = this.x_asset === 'base' ? 'GBYTE' : this.x_asset;
    const y_asset_id = this.y_asset === 'base' ? 'GBYTE' : this.y_asset;
    const x_rate = exchangeRates[`${x_asset_id}_USD`];
    const y_rate = exchangeRates[`${y_asset_id}_USD`];
    const x_value = x_rate ? x_rate * this.assetValue(this.balances.xn, assets[this.x_asset]) : 0;
    const y_value = y_rate ? y_rate * this.assetValue(this.balances.yn, assets[this.y_asset]) : 0;
    return y_value && x_value ? y_value + x_value : 0;
  }


  getMarketcapByBalances(
    balances: any,
    assets: IAssetsList,
    exchangeRates: IExchangeRates
  ): number {
    const y_asset_id = this.y_asset === "base" ? "GBYTE" : this.y_asset;
    const x_asset_id = this.x_asset === "base" ? "GBYTE" : this.x_asset;
    const x_rate = exchangeRates[`${x_asset_id}_USD`];
    const y_rate = exchangeRates[`${y_asset_id}_USD`];
    const x_value = x_rate ? x_rate * this.assetValue(balances[this.x_asset], assets[this.x_asset]) : 0;
    const y_value = y_rate ? y_rate * this.assetValue(balances[this.y_asset], assets[this.y_asset]) : 0;
    return y_value && x_value ? y_value + x_value : 0;
  }

  get24hVolumeInUSD(
    tickers: ITickers,
    assets: IAssetsList,
    exchangeRates: IExchangeRates,
    address: string
  ): number {
    const ticker = tickers[address + "-" + this.getTickerForAPI(assets)];
    if (!ticker) return 0;

    let volumeInUSD = 0;
    const base_asset_id = ticker.base_id === "base" ? "GBYTE" : ticker.base_id;
    const quote_asset_id = ticker.quote_id === "base" ? "GBYTE" : ticker.quote_id;
    const base_rate = exchangeRates[`${base_asset_id}_USD`];
    const quote_rate = exchangeRates[`${quote_asset_id}_USD`];
    if (base_rate) {
      volumeInUSD = base_rate * ticker.base_volume;
    } else if (quote_rate) {
      volumeInUSD = quote_rate * ticker.quote_volume;
    }

    return Number(volumeInUSD.toFixed(2));
  }

}
