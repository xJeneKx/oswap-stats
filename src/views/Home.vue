<script setup lang="ts">
import {inject, computed, ComputedRef, ref, onMounted, h} from "vue";
import { useStore } from "vuex";
import { useRouter, useRoute } from "vue-router";
import Pool from "@/helpers/PoolHelper";
import { ITickers } from "@/interfaces/tickers.interface";
import Menu from "@/components/Menu.vue";
import AssetIcon from "@/components/AssetIcon.vue";
import useWindowSize from "@/composables/useWindowSize";
import setTitle from "@/helpers/setTitle";
import PaginationForTable from "@/components/PaginationForTable.vue";
//import fetchAPY7Days from "@/api/fetchAPY7Days";

import {
  TableState,
  TableStateFilters,
} from "ant-design-vue/es/table/interface";
import { IFarmingPool } from "@/api/fetchFarmingAPY";
import { InfoCircleOutlined, SearchOutlined } from "@ant-design/icons-vue";

type Pagination = TableState["pagination"];

const store = useStore();
const router = useRouter();
const route = useRoute();
const windowSize = useWindowSize();
//const apy7d = ref({}) as any;

store.dispatch("initIfNotInit");

const exchangeRates = computed(() => store.state.exchangeRates);
const poolsData = computed(() => store.state.poolsData);
const miningApy: ComputedRef<any> = computed(() => store.state.miningApy);
const tickers: ComputedRef<ITickers> = computed(() => store.state.tickers);
const isReady = computed(() => store.state.ready);
const isMobile = computed(() => windowSize.x.value < 576);
const apy7d = computed(() => store.state.apy7d);
const farmingAPY = computed<Array<IFarmingPool>>(() => store.state.farmingAPY);
/*async function updateAPY7d() {
  apy7d.value = await fetchAPY7Days();
}
watch(poolsData, updateAPY7d);
onMounted(updateAPY7d);*/

const poolFilter = ref("");

onMounted(() => {
  if (route.hash) {
    const page = route.hash.replace("#", "");
    router.replace({ query: { page } });
    paginationOptions.value.current = parseInt(page);
    return;
  }

  if (route.query.page) {
    paginationOptions.value.current = parseInt(route.query.page as string);
  }
});

setTitle(`Oswap pool statistics`);

const sortedInfo = ref({
  columnKey: "tvl",
});

const paginationOptions = ref({
  current: 1,
  itemRender: (state: any) => {
    if (state.type === "prev" || state.type === "next") {
      return state.originalElement;
    }

    return h(PaginationForTable, { page: state.page }, state.originalElement);
  },
});

if (localStorage.getItem("sort_key")) {
  sortedInfo.value = { columnKey: localStorage.getItem("sort_key") || "tvl" };
}

const customRow = (pool: { pool: { address: string } }) => {
  return {
    onClick: (event: any) => {
      if (!event.target.href) {
        router.push({
          name: "Pool",
          params: {
            address: pool.pool.address,
          },
        });
      }
    },
  };
};

const formatNumbers = (n: number) => {
  if (n < 1e3) return n;
  if (n >= 1e3 && n < 1e6) return +(n / 1e3).toFixed(2) + "k";
  if (n >= 1e6 && n < 1e9) return +(n / 1e6).toFixed(2) + "M";
  if (n >= 1e9 && n < 1e12) return +(n / 1e9).toFixed(2) + "B";
  if (n >= 1e12) return +(n / 1e12).toFixed(2) + "T";
};

const columns = computed(() => {
  const key = sortedInfo.value.columnKey;
  return [
    {
      dataIndex: "pool",
      key: "pool",
      slots: {
        title: "customTitle",
        customRender: "pool",
      },
    },
    {
      dataIndex: "TVLString",
      key: "tvl",
      sortDirections: ["descend"],
      sorter: (a: any, b: any) => a.TVLString - b.TVLString,
      sortOrder: key === "tvl" && "descend",
      slots: { title: "tvl-title", customRender: "TVL" },
    },
    {
      dataIndex: "APY",
      key: "APY",
      sortDirections: ["descend"],
      sorter: (a: any, b: any) => {
        return (
          (a.APY.apy7d + a.APY.poolMiningApy) -
          (b.APY.apy7d + b.APY.poolMiningApy)
        );
      },
      sortOrder: key === "APY" && "descend",
      slots: { title: "apy-title", customRender: "APY" },
    },
    {
      title: "Volume 24H",
      dataIndex: "volumeString",
      key: "volume",
      sortDirections: ["descend"],
      sorter: (a: any, b: any) => a.volume - b.volume,
      sortOrder: key === "volume" && "descend",
      slots: { customRender: "volume" },
    },
  ];
});

const mobileColumns = computed(() => {
  const key = sortedInfo.value.columnKey;
  return [
    {
      dataIndex: "pool",
      key: "pool",
      slots: { title: "customTitle", customRender: "pool" },
    },
    {
      dataIndex: "TVLString",
      key: "tvl",
      sortDirections: ["descend"],
      sorter: (a: any, b: any) => a.TVLString - b.TVLString,
      sortOrder: key === "tvl" && "descend",
      slots: { title: "tvl-title", customRender: "TVL" },
    },
    {
      title: "APY",
      dataIndex: "APY",
      key: "APY",
      sortDirections: ["descend"],
      sorter: (a: any, b: any) => {
        return (
          (a.APY.apy7d + a.APY.poolMiningApy) -
          (b.APY.apy7d + b.APY.poolMiningApy)
        );
      },
      sortOrder: key === "APY" && "descend",
      slots: { customRender: "APY" },
    },
  ];
});

const filteredPoolsData = computed(() => {
  if (poolFilter.value) {
    return poolsData.value.pools.filter((pool: any) => {
      return pool.ticker.toLowerCase().includes(poolFilter.value.toLowerCase());
    });
  }

  return poolsData.value.pools;
});

const data = computed(() => {
  return filteredPoolsData.value.map((pool: Pool) => {
    const TVL = Number(pool.marketcap.toFixed(2));
    const TVLString = formatNumbers(TVL);

    const volume = pool.get24hVolumeInUSD(
      tickers.value,
      poolsData.value.assets,
      exchangeRates.value,
      pool.address
    );
    const volumeString = formatNumbers(volume);

    const xTicker = pool.getTicker(pool.x_asset, poolsData.value.assets);
    const yTicker = pool.getTicker(pool.y_asset, poolsData.value.assets);

    const poolMiningApy = miningApy.value.data[pool.address] || 0;
    let poolFarmingApy = 0;

    const farmingPool: IFarmingPool | undefined = farmingAPY.value.find(({address})=> address === pool.address);

    if (farmingPool) {
      poolFarmingApy = Number(farmingPool.apy);
    }

    return {
      key: pool.address,
      pool: {
        name: pool.ticker,
        fee: pool.swapFee * 100,
        address: pool.address,
        xTicker,
        yTicker,
      },
      TVL,
      TVLString,
      APY: {
        apy7d: apy7d.value[pool.address].apy || 0,
        poolMiningApy,
        poolFarmingApy,
      },
      volume,
      volumeString,
    };
  });
});

const mobileData = computed(() => {
  return filteredPoolsData.value.map((pool: Pool) => {
    const poolMiningApy = miningApy.value.data[pool.address] || 0;
    let poolFarmingApy = 0;

    const farmingPool: IFarmingPool | undefined = farmingAPY.value.find(({address})=> address === pool.address);
    
    if (farmingPool) {
      poolFarmingApy = Number(farmingPool.apy);
    }

    const TVL = Number(pool.marketcap.toFixed(2));
    const TVLString = formatNumbers(TVL);

    const xTicker = pool.getTicker(pool.x_asset, poolsData.value.assets);
    const yTicker = pool.getTicker(pool.y_asset, poolsData.value.assets);

    return {
      key: pool.ticker,
      pool: {
        name: pool.ticker,
        fee: pool.swapFee * 100,
        address: pool.address,
        xTicker,
        yTicker,
      },
      APY: {
        apy7d: apy7d.value[pool.address].apy || 0,
        poolMiningApy,
        poolFarmingApy
      },
      TVL,
      TVLString
    };
  });
});

const handleChange = (
  pagination: Pagination,
  filters: TableStateFilters,
  sorter: any
) => {
  const currentPage = pagination?.current || 1;

  paginationOptions.value.current = currentPage;
  router.replace({ query: { page: currentPage } });

  sortedInfo.value = {
    columnKey: sorter.columnKey,
  };
  localStorage.setItem("sort_key", sorter.columnKey);
};
</script>

<template>
  <Menu :is-home="true" />
  <h1
    style="
      color: #fff;
      text-align: center;
      font-size: 24px;
      margin: 36px auto 48px;
    "
  >
    Statistics for oswap v2
  </h1>
  <div v-if="!isReady" style="text-align: center"><a-spin size="large" /></div>

  <div v-if="isReady">
    <div
      style="max-width: 1200px; width: 90%; margin: 16px auto; padding: 0 16px"
    >
      <a-table
        class="table"
        :dataSource="isMobile ? mobileData : data"
        :columns="isMobile ? mobileColumns : columns"
        :custom-row="customRow"
        :rowClassName="(record, index) => 'table-pointer'"
        :pagination="paginationOptions"
        @change="handleChange"
      >
        <template #customTitle>
          <a-input-search
            ref="searchInput"
            placeholder="Search pool"
            class="no-board-field"
            v-model:value="poolFilter"
          />
        </template>
        <template #tvl-title>
          <span>
            TVL
            <a-tooltip>
              <template #title>Total Value Locked</template>
              <InfoCircleOutlined />
            </a-tooltip>
          </span>
        </template>
        <template #apy-title>
          <span>
            APY
            <a-tooltip>
              <template #title>Based on the last 7 days</template>
              <InfoCircleOutlined />
            </a-tooltip>
          </span>
        </template>
        <template #pool="{ text: objPool }">
          <router-link :to="'/pool/' + objPool.address" class="linkToPool">
            <AssetIcon :symbol="objPool.xTicker" size="small" />
            <AssetIcon :symbol="objPool.yTicker" size="small" />
            {{ objPool.name }}
            <a-tag class="fee" style="margin-left: 8px">{{ objPool.fee }}%</a-tag>
          </router-link>
        </template>
        <template #TVL="{ text }">${{ text }}</template>
        <template #APY="{ text }">
        <div v-if="text.poolMiningApy !== 0 || text.poolFarmingApy" class="apy-block">
          <div>{{ text.apy7d.toLocaleString(undefined, {maximumFractionDigits: 18}) }}%</div>
          <div class="mining-pool-apy">
            <span v-if="text.poolMiningApy && text.poolMiningApy > text.poolFarmingApy">+{{ text.poolMiningApy.toLocaleString(undefined, {maximumFractionDigits: 18}) }}%</span>
            <span v-else-if="text.poolFarmingApy">
              +{{ text.poolFarmingApy.toLocaleString(undefined, {maximumFractionDigits: 18}) }}%
            </span>{{ " " }}
            <a-tooltip>
              <template #title>
                Liquidity mining rewards <br/>
                <span v-if="text.poolMiningApy">
                  {{ text.poolMiningApy.toLocaleString(undefined, {maximumFractionDigits: 18}) }}% from <a href="https://liquidity.obyte.org" target="_blank">liquidity.obyte.org</a>
                </span>
                <span v-if="text.poolMiningApy && text.poolFarmingApy">
                  or
                </span>
                <span v-if="text.poolFarmingApy">
                  {{ text.poolFarmingApy.toLocaleString(undefined, {maximumFractionDigits: 18}) }}% from <a href="https://token.oswap.io/farming" target="_blank">token.oswap.io</a>
                </span>
              </template>
              <InfoCircleOutlined />
            </a-tooltip>
          </div>
        </div>
        <div v-else class="apy7d">{{ text.apy7d.toLocaleString(undefined, {maximumFractionDigits: 18}) }}%</div>
        </template>
        <template #volume="{ text }">${{ text }}</template>
      </a-table>
    </div>
  </div>
</template>

<style>
.linkToPool {
  display: block;
  color: rgba(255, 255, 255, 0.85);
}

.linkToPool:hover {
  color: rgba(255, 255, 255, 0.85);
}

.table {
  border-radius: 8px;
}
.ant-table-thead > tr > th {
  background-color: #26292f !important;
}
.table-pointer {
  cursor: pointer;
  background-color: #1b1e23;
}

.fee {
  display: inline-block;
}

.apy-block {
  display: flex;
  align-content: center;
  align-items: center;
}

.mining-pool-apy {
  display: inline-block;
  padding-left: 8px;
  font-size: 11px;
}

.apy7d {
  text-align: left;
}

.no-board-field {
  border-left: 0 !important;
  border-right: 0 !important;
  border-top: 0 !important;
}

.ant-input-affix-wrapper:focus {
  box-shadow: none !important;
}

.ant-input-affix-wrapper-focused {
  box-shadow: none !important;
}

@media screen and (max-width: 600px) {
  .fee {
    display: none !important;
  }
  .apy-block {
    flex-direction: column;
  }
  .mining-pool-apy {
    font-size: 11px;
  }
  .apy7d {
    text-align: center;
  }
  .ant-table-tbody > tr > td {
    padding: 8px 8px !important;
  }
}
</style>
