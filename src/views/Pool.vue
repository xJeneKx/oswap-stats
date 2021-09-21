<script setup lang="ts">
import { computed, inject, ref, watch, onMounted, Ref } from "vue";
import { useStore } from "vuex";
import { useRoute } from "vue-router";
import Obyte from "@/obyte";
import Pool from "@/helpers/PoolHelper";
import fetchCandlesForLast30Days from "@/api/fetchCandlesForLast30Days";
import { ICandles } from "@/interfaces/candles.inerface";
import Menu from "@/components/Menu.vue";

const Client = inject("Obyte") as Obyte.Client;
const store = useStore();
const route = useRoute();

store.dispatch("initIfNotInit", Client);
const isReady = computed(() => store.state.ready);
const poolsData = computed(() => store.state.poolsData);
const tickers = computed(() => store.state.tickers);
const pool: Ref<Pool> = ref({} as Pool);
const candles: Ref<ICandles[]> = ref([]);

async function updatePool() {
  if (!isReady.value) return;
  pool.value = poolsData.value.pools.find((p: Pool) => {
    return p.address === route.params.address;
  });

  const { assets } = poolsData.value;
  candles.value = await fetchCandlesForLast30Days(
    pool.value.getTickerForAPI(assets)
  );
}

function goToOswapIO(): void {
  const a = document.createElement("a");
  a.href = "https://oswap.io/#/add-liquidity/" + pool.value.address;
  a.target = "_blank";
  a.click();
}

watch(poolsData, updatePool);
watch(
  () => route.params.market_name,
  () => {
    if (route.params.market_name) {
      updatePool();
    }
  }
);
onMounted(updatePool);
</script>

<template>
  <Menu />
  <div v-if="isReady && pool.ready">
    <div
      style="max-width: 1200px; width: 90%; margin: 16px auto; padding: 0 16px"
    >
      <div style="margin: 8px">
        <div>
          <span style="font-size: 24px; color: #fff">{{ pool.ticker }}</span>
          <a-tag class="tag fee">{{ pool.swapFee / 1000000000 }}%</a-tag>
          <a-button
            type="primary"
            style="border-radius: 8px; float: right; margin-top: 2px"
            @click="goToOswapIO"
            >Add liquidity</a-button
          >
        </div>
        <div v-if="pool.hasLiquidity()" style="margin-top: 16px">
          <span class="tag">
            1 {{ pool.getTicker(pool.asset0, poolsData.assets) }} ≈
            {{
              pool.getFormattedPrice(
                pool.asset0,
                pool.asset1_decimals,
                poolsData.assets
              )
            }}
            {{ pool.getSymbol(pool.asset1, poolsData.assets) }}
          </span>
          <span class="tag" style="margin-left: 8px">
            1 {{ pool.getTicker(pool.asset1, poolsData.assets) }} ≈
            {{
              pool.getFormattedPrice(
                pool.asset1,
                pool.asset0_decimals,
                poolsData.assets
              )
            }}
            {{ pool.getSymbol(pool.asset0, poolsData.assets) }}
          </span>
        </div>
      </div>
      <a-row style="color: #fff; margin-top: 24px">
        <a-col :xs="24" :sm="24" :md="6">
          <div class="block">
            <div class="titleInBlock">Volume 24H</div>
            <div class="contentInBlock">
              ${{
                pool.get24hVolumeInUSD(
                  tickers,
                  poolsData.assets,
                  Client.exchangeRates
                )
              }}
            </div>
          </div>
          <div class="block">
            <div class="titleInBlock">TVL</div>
            <div class="contentInBlock">${{ pool.marketcap.toFixed(2) }}</div>
          </div>
          <div class="block">
            <div class="titleInBlock">APY 7D</div>
            <div class="contentInBlock">
              {{ pool.getAPY7d(candles, Client.exchangeRates) }}%
            </div>
          </div>
        </a-col>
        <a-col :xs="24" :sm="24" :md="18" style="padding: 16px"> CHART </a-col>
      </a-row>
    </div>
  </div>
</template>

<style scoped>
.tag {
  color: #fff;
  padding: 4px 8px;
  border-radius: 8px;
  border: 1px solid #24292e;
  background-color: #24292e;
}
.tag.fee {
  margin-left: 12px;
  font-size: 16px;
  display: inline-block;
  margin-top: 3px;
  position: absolute;
}

.block {
  background-color: #24292e;
  padding: 12px;
  border-radius: 8px;
  margin: 16px 8px;
}

.titleInBlock {
  font-weight: bold;
  font-size: 18px;
  color: #6a737d;
  margin-bottom: 4px;
  text-align: center;
}

.contentInBlock {
  align-items: center;
  display: flex;
  justify-content: center;
  font-size: 16px;
}
</style>
