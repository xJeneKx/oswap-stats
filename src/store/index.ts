import { createStore } from "vuex";
import fetchInitialData from "@/api/fetchInitialData";
import fetchPoolData from "@/api/fetchPoolData";
import fetchTickers from "@/api/fetchTickers";
import fetchExchangeRates from "@/api/fetchExchangeRates";
import fetchAPY7Days from "@/api/fetchAPY7Days";
import fetchIconsList from "@/api/fetchIconsList";

export default createStore({
  state: {
    initData: {},
    poolsData: [],
    tickers: {},
    exchangeRates: {},
    apy7d: {},
    icons: {},
    ready: false,
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
    setIcons(state, icons) {
      state.icons = icons;
    },
  },
  actions: {
    async initIfNotInit({ commit, state }, Client) {
      if (state.ready) return;

      const exchangeRates = await fetchExchangeRates();
      commit("setExchangeRates", exchangeRates);

      const initData = await fetchInitialData(Client);
      const { factory, a2sRegistry, descriptionRegistry, decimalsRegistry } =
        initData;

      const poolsData = await fetchPoolData(
        Client,
        factory,
        a2sRegistry,
        descriptionRegistry,
        decimalsRegistry,
        exchangeRates
      );

      const tickers = await fetchTickers();
      const apy7d = await fetchAPY7Days();
      const icons = await fetchIconsList();

      commit("setInitData", initData);
      commit("setPoolsData", poolsData);
      commit("setTickersData", tickers);
      commit("setAPY7d", apy7d);
      commit("setIcons", icons);
      commit("setReady", true);
    },
  },
  modules: {},
});
