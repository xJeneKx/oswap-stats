import { createStore } from "vuex";
import fetchInitialData from "@/api/fetchInitialData";
import fetchPoolData from "@/api/fetchPoolData";
import fetchTickers from "@/api/fetchTickers";
import fetchExchangeRates from "@/api/fetchExchangeRates";
import fetchAPY7Days from "@/api/fetchAPY7Days";
import fetchMiningApy from "@/api/fetchMiningApy";
import fetchIconsList from "@/api/fetchIconsList";
import fetchFarmingAPY from "@/api/fetchFarmingAPY";

export default createStore({
  state: {
    initData: {},
    poolsData: [],
    tickers: {},
    miningApy: {},
    exchangeRates: {},
    apy7d: {},
    icons: {},
    ready: false,
    farmingAPY: []
  },
  mutations: {
    setInitData(state, payload) {
      state.initData = payload;
    },
    setPoolsData(state, payload) {
      state.poolsData = payload;
    },
    setTickersData(state, payload) {
      state.tickers = payload;
    },
    setReady(state, status) {
      state.ready = status;
    },
    setExchangeRates(state, exchangeRates) {
      state.exchangeRates = exchangeRates;
    },
    setAPY7d(state, apy7d) {
      state.apy7d = apy7d;
    },
    setFarmingAPY(state, apy) {
      state.farmingAPY = apy;
    },
    setMiningApy(state, miningApy) {
      state.miningApy = miningApy;
    },
    setIcons(state, icons) {
      state.icons = icons;
    },
  },
  actions: {
    async initIfNotInit({ commit, state }) {
      if (state.ready) return;

      const exchangeRates = await fetchExchangeRates();
      commit("setExchangeRates", exchangeRates);

      const initData = await fetchInitialData();
      const { factory, a2sRegistry, descriptionRegistry, decimalsRegistry } =
        initData;

      const [
        poolsData,
        tickers,
        apy7d,
        icons,
        miningApy,
        farmingAPY
      ] = await Promise.all([
        fetchPoolData(
          factory,
          a2sRegistry,
          descriptionRegistry,
          decimalsRegistry,
          exchangeRates
        ),
        fetchTickers(),
        fetchAPY7Days(),
        fetchIconsList(),
        fetchMiningApy(),
        fetchFarmingAPY()
      ]);

      commit("setInitData", initData);
      commit("setPoolsData", poolsData);
      commit("setTickersData", tickers);
      commit("setMiningApy", miningApy);
      commit("setAPY7d", apy7d);
      commit("setIcons", icons);
      commit("setFarmingAPY", farmingAPY);
      commit("setReady", true);
    },
  },
  modules: {},
});
