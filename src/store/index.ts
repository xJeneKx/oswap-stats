import { createStore } from "vuex";
import fetchInitialData from "@/api/fetchInitialData";
import fetchPoolData from "@/api/fetchPoolData";
import fetchTickers from "@/api/fetchTickers";

export default createStore({
  state: {
    initData: {},
    poolsData: [],
    tickers: {},
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
  },
  actions: {
    async initIfNotInit({ commit, state }, Client) {
      if (state.ready) return;

      const initData = await fetchInitialData(Client);
      const { factory, a2sRegistry, descriptionRegistry, decimalsRegistry } =
        initData;

      const poolsData = await fetchPoolData(
        Client,
        factory,
        a2sRegistry,
        descriptionRegistry,
        decimalsRegistry
      );

      const tickers = await fetchTickers();

      commit("setInitData", initData);
      commit("setPoolsData", poolsData);
      commit("setTickersData", tickers);
      commit("setReady", true);
    },
  },
  modules: {},
});
