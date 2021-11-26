<script setup lang="ts">
import { computed, inject, ref, watch, onMounted, Ref, onUnmounted } from "vue";
import { useStore } from "vuex";
import { useRoute } from "vue-router";
import { createChart } from "lightweight-charts";
import { getVolumeInUSDHelper } from "@/helpers/volumeInUSD.helper";
import Obyte from "@/obyte";
import Pool from "@/helpers/PoolHelper";
import fetchCandlesForLast60Days from "@/api/fetchCandlesForLast60Days";
import fetchBalancesForLast60Days from "@/api/fetchBalancesForLast60Days";
import { fetchAAHistory, getAAResponses, getJoint } from "@/api/fetchAAHistory";
import { ICandles } from "@/interfaces/candles.inerface";
import Menu from "@/components/Menu.vue";
import useWindowSize from "@/composables/useWindowSize";
import { addZero } from "@/helpers/date.helper";

const Client = inject("Obyte") as Obyte.Client;
const store = useStore();
const route = useRoute();
const windowSize = useWindowSize();

interface IForChart {
  time: { day: number; month: number; year: number } | string;
  value: number;
}

store.dispatch("initIfNotInit", Client);
const exchangeRates = computed(() => store.state.exchangeRates);
const isReady = computed(() => store.state.ready);
const poolsData = computed(() => store.state.poolsData);
const tickers = computed(() => store.state.tickers);
const isMobile = computed(() => windowSize.x.value < 576);
const pool: Ref<Pool> = ref({} as Pool);
const candles: Ref<ICandles[]> = ref([]);
const chart = ref<HTMLElement>();
const blockWithChart = ref(null) as any;
const c = ref(null) as any;
const areaSeries = ref() as any;
const blockSize = ref(0);
const priceAndDate = ref<any>({ price: 0 });
const candlesForChart = ref([]) as Ref<IForChart[]>;
const balancesForChart = ref([]) as Ref<IForChart[]>;
const prices0ForChart = ref([]) as Ref<IForChart[]>;
const prices1ForChart = ref([]) as Ref<IForChart[]>;
const currentChart = ref(1);

function resize(): void {
  blockSize.value = blockWithChart.value.offsetWidth - 32;
  c.value.resize(blockSize.value, 250);
  c.value.timeScale().fitContent();
}

function getInAmount(objTriggerUnit: any, aa_address: string, asset = 'base'){

  if (!objTriggerUnit)
    return 0;
  let amount = 0;
  objTriggerUnit.messages.forEach(function (message: any) {
    if (message.app !== 'payment') {
      return;
    }

    const payload = message.payload;

    if (asset == 'base' && payload.asset || asset != 'base' && asset !== payload.asset) {
      return;
    }

    payload.outputs.forEach(function (output: any){
      if (output.address === aa_address) {
        amount += output.amount; // in case there are several outputs
      }
    });
  });
  return amount;
}

async function treatAAHistory(history: any) {
  const result = [];

  for (let i = 0; i < history.length; i++) {
    const type =  history[i].response.responseVars.type;

    const asset0_amount_out = history[i].response.responseVars.asset0_amount || 0;
    const asset1_amount_out = history[i].response.responseVars.asset1_amount || 0;

    const swapDirection = asset0_amount_out > 0 ? '1 - 0' : '0 - 1';

    const asset0_amount_in = getInAmount(history[i].objResponseUnit, history[i].aa_address, pool.value.asset0);
    const asset1_amount_in = getInAmount(history[i].objResponseUnit, history[i].aa_address, pool.value.asset1);

    const timestamp = new Date(history[i].timestamp * 1000).toISOString();

    const author = history[i].trigger_address;
    const unit = history[i].trigger_unit;
    const unitData = await getJoint(Client, unit);

    if(history[i].trigger_unit === 'uH2cgt/BpYAUy0MaFHgsXrlzxL3eX/iU8j/opaWJtRc=') {
      console.error('UNIT', unitData)

      console.error(pool.value.asset0, ' - ', pool.value.asset1)

      console.error('0in', asset0_amount_in);
      console.error('0out', asset0_amount_out);
      console.error('1in', asset1_amount_in);
      console.error('1out', asset1_amount_out);
    }

    result.push({
      unit,
      timestamp,
      type,
      author,
      ...(swapDirection === '1 - 0' ? { asset0: asset0_amount_out, asset1: asset1_amount_in } :  { asset0: asset0_amount_in, asset1: asset1_amount_out }),
    })
  }

  return result;
}

async function updatePool() {
  if (!isReady.value) return;
  pool.value = poolsData.value.pools.find((p: Pool) => {
    return p.address === route.params.address;
  });

  const poolHistory = await getAAResponses(Client, pool.value.address);

  console.error('poolHistory', poolHistory);

  pool.value.history = await treatAAHistory(poolHistory);
  //console.error(pool.value);

  //pool.value.history = ;

  const { assets } = poolsData.value;
  candles.value = await fetchCandlesForLast60Days(
    pool.value.getTickerForAPI(assets)
  );
  candlesForChart.value = candles.value.map((v) => {
    return {
      time: v.start_timestamp.split("T")[0],
      value: getVolumeInUSDHelper(
        pool.value.asset0,
        pool.value.asset1,
        v,
        exchangeRates
      ),
    };
  });
  const balances = await fetchBalancesForLast60Days(pool.value.address);
  balancesForChart.value = balances.map((b) => {
    return {
      time: b.creation_date.split(" ")[0],
      value: Number(
        pool.value
          .getMarketcapByBalances(
            b,
            poolsData.value.assets,
            exchangeRates.value
          )
          .toFixed(2)
      ),
    };
  });
  balances.forEach((b) => {
    const balances = pool.value.getPricesByBalances(b, poolsData.value.assets);
    prices0ForChart.value.push({
      time: b.creation_date.split(" ")[0],
      value: balances[0],
    });
    prices1ForChart.value.push({
      time: b.creation_date.split(" ")[0],
      value: balances[1],
    });
  });
  window.addEventListener("resize", resize);
  resize();
}

function timeToDate(time: any): string {
  return `${time.year}/${addZero(time.month)}/${addZero(time.day)}`;
}

function getPriceText(amount: number) {
  if (currentChart.value === 1 || currentChart.value === 2) {
    return "$" + Math.round(amount * 100) / 100;
  } else if (currentChart.value === 3) {
    return `${amount} ${pool.value.getTicker(
      pool.value.asset0,
      poolsData.value.assets
    )}/${pool.value.getSymbol(pool.value.asset1, poolsData.value.assets)}`;
  } else if (currentChart.value === 4) {
    return `${amount} ${pool.value.getSymbol(
      pool.value.asset1,
      poolsData.value.assets
    )}/${pool.value.getTicker(pool.value.asset0, poolsData.value.assets)}`;
  }
}

function fillChart() {
  if (!chart.value || !candles.value.length) return;

  if (!c.value) {
    c.value = createChart(chart.value, {
      width: blockSize.value,
      height: 250,
      rightPriceScale: {
        visible: true,
      },
      leftPriceScale: {
        visible: false,
      },
      timeScale: {
        visible: true,
      },
      crosshair: {
        horzLine: {
          visible: false,
        },
        vertLine: {
          visible: false,
        },
      },
      layout: {
        backgroundColor: "#1c2024",
        textColor: "#d9d9d9",
      },
      grid: {
        vertLines: {
          visible: false,
        },
        horzLines: {
          visible: false,
        },
      },
      handleScroll: {
        mouseWheel: false,
        pressedMouseMove: false,
      },
      handleScale: {
        axisPressedMouseMove: false,
        mouseWheel: false,
        pinch: false,
      },
    });

    c.value.subscribeCrosshairMove(function (param: any) {
      let chart = candlesForChart;
      switch (currentChart.value) {
        case 1:
          chart = candlesForChart;
          break;
        case 2:
          chart = balancesForChart;
          break;
        case 3:
          chart = prices0ForChart;
          break;
        case 4:
          chart = prices1ForChart;
          break;
      }
      if (
        !param.time ||
        param.point.x < 0 ||
        param.point.x > blockSize.value ||
        param.point.y < 0 ||
        param.point.y > 250
      ) {
        const time = chart.value[chart.value.length - 1].time;

        priceAndDate.value = {
          price: getPriceText(
            Number(chart.value[candles.value.length - 1].value)
          ),
          date: timeToDate(time),
        };
        return;
      }
      let price = param.seriesPrices.values().next().value;
      priceAndDate.value = {
        price: getPriceText(price),
        date: timeToDate(param.time),
      };
    });
  }

  areaSeries.value = c.value.addAreaSeries({
    topColor: "rgba(23, 125, 220, 0.5)",
    lineColor: "rgba(23, 125, 220, 1)",
    bottomColor: "rgba(23, 125, 220, 0)",
    lineWidth: 2,
  });

  areaSeries.value.setData(candlesForChart.value);
  const time = candlesForChart.value[candlesForChart.value.length - 1].time;
  priceAndDate.value = {
    price: getPriceText(candlesForChart.value[candles.value.length - 1].value),
    date: timeToDate(time),
  };
  resize();
}

function recreateChart(): void {
  c.value.removeSeries(areaSeries.value);
  areaSeries.value = c.value.addAreaSeries({
    topColor: "rgba(23, 125, 220, 0.5)",
    lineColor: "rgba(23, 125, 220, 1)",
    bottomColor: "rgba(23, 125, 220, 0)",
    lineWidth: 2,
    autoscaleInfoProvider: (original: () => any) => {
      const res = original();
      if (res !== null) {
        res.priceRange.minValue = 0;
      }
      return res;
    },
  });
}

function setChart(): void {
  if (currentChart.value === 1) {
    recreateChart();
    areaSeries.value.setData(candlesForChart.value);
    priceAndDate.value = {
      price: getPriceText(
        candlesForChart.value[candles.value.length - 1].value
      ),
      date: timeToDate(candlesForChart.value[candles.value.length - 1].time),
    };
  } else if (currentChart.value === 2) {
    recreateChart();
    areaSeries.value.setData(balancesForChart.value);
    priceAndDate.value = {
      price: getPriceText(
        balancesForChart.value[balancesForChart.value.length - 1].value
      ),
      date: timeToDate(
        balancesForChart.value[balancesForChart.value.length - 1].time
      ),
    };
  } else if (currentChart.value === 3) {
    recreateChart();
    areaSeries.value.setData(prices0ForChart.value);
    priceAndDate.value = {
      price: getPriceText(
        prices0ForChart.value[prices0ForChart.value.length - 1].value
      ),
      date: timeToDate(
        prices0ForChart.value[prices0ForChart.value.length - 1].time
      ),
    };
  } else if (currentChart.value === 4) {
    recreateChart();
    areaSeries.value.setData(prices1ForChart.value);
    priceAndDate.value = {
      price: getPriceText(
        prices1ForChart.value[prices1ForChart.value.length - 1].value
      ),
      date: timeToDate(
        prices1ForChart.value[prices1ForChart.value.length - 1].time
      ),
    };
  }

  c.value.timeScale().fitContent();
}

function goToOswapIO(): void {
  const a = document.createElement("a");
  a.href = "https://oswap.io/#/add-liquidity/" + pool.value.address;
  a.target = "_blank";
  a.click();
}

watch(poolsData, updatePool);
watch(
  () => route.params.address,
  () => {
    if (route.params.address) {
      updatePool();
    }
  }
);
watch([chart, candles], fillChart);
watch(currentChart, setChart);
onMounted(updatePool);
onUnmounted(() => window.removeEventListener("resize", resize));
</script>

<template>
  <Menu />
  <div v-if="!isReady" style="text-align: center"><a-spin size="large" /></div>
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
            size="large"
            style="border-radius: 8px; float: right; margin-top: 2px"
            @click="goToOswapIO"
            >Add liquidity</a-button
          >
        </div>
        <div v-if="pool.hasLiquidity()" style="margin-top: 16px">
          <div
            :style="
              isMobile ? { display: 'block' } : { display: 'inline-block' }
            "
          >
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
          </div>
          <div
            :style="
              isMobile
                ? { display: 'block', marginTop: '16px' }
                : { display: 'inline-block', marginLeft: '8px' }
            "
          >
            <span class="tag">
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
      </div>
      <a-row style="color: #fff; margin-top: 24px">
        <a-col :xs="24" :sm="24" :md="6">
          <div class="block">
            <div class="titleInBlock">Volume 24H</div>
            <div class="contentInBlock">
              ${{
                pool.get24hVolumeInUSD(tickers, poolsData.assets, exchangeRates)
              }}
            </div>
          </div>
          <div class="block">
            <div class="titleInBlock">TVL</div>
            <div class="contentInBlock">
              ${{ Number(pool.marketcap.toFixed(2)) }}
            </div>
          </div>
          <div class="block">
            <div class="titleInBlock">APY 7D</div>
            <div class="contentInBlock">
              {{ pool.getAPY7d(candles, exchangeRates) }}%
            </div>
          </div>
        </a-col>
        <a-col :xs="24" :sm="24" :md="18">
          <div
            style="margin: 16px; background-color: #1c2024; border-radius: 8px"
          >
            <div style="padding: 16px">
              <a-row>
                <a-col :xs="24" :sm="24" :xl="16">
                  <a-radio-group
                    v-model:value="currentChart"
                    style="background-color: #24292e"
                  >
                    <a-radio-button :value="1">Volume</a-radio-button>
                    <a-radio-button :value="2">TVL</a-radio-button>
                    <a-radio-button :value="3"
                      >{{ pool.getTicker(pool.asset0, poolsData.assets) }}/{{
                        pool.getSymbol(pool.asset1, poolsData.assets)
                      }}</a-radio-button
                    >
                    <a-radio-button :value="4"
                      >{{ pool.getSymbol(pool.asset1, poolsData.assets) }}/{{
                        pool.getTicker(pool.asset0, poolsData.assets)
                      }}</a-radio-button
                    >
                  </a-radio-group>
                </a-col>
                <a-col :xs="24" :sm="24" :xl="8" style="text-align: right">
                  <div style="font-weight: bold; font-size: 16px">
                    {{ priceAndDate.price }}
                  </div>
                  <div style="font-size: 12px; color: #acb7c3">
                    {{ priceAndDate.date }}
                  </div>
                </a-col>
              </a-row>
            </div>
            <div
              :ref="(el) => (blockWithChart = el)"
              style="padding: 0 16px 8px"
            >
              <div :ref="(el) => (chart = el)"></div>
            </div>
          </div>
        </a-col>
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
  background-color: #1c2024;
  padding: 18px 12px;
  border-radius: 8px;
  margin: 16px 8px 20px;
}

.titleInBlock {
  font-weight: bold;
  font-size: 18px;
  color: #6a737d;
  margin-bottom: 6px;
  text-align: center;
}

.contentInBlock {
  align-items: center;
  display: flex;
  justify-content: center;
  font-size: 16px;
}
</style>

<style>
.ant-radio-button-wrapper:first-child {
  border-radius: 8px 0 0 8px !important;
}

.ant-radio-button-wrapper:last-child {
  border-radius: 0 8px 8px 0 !important;
}
</style>
