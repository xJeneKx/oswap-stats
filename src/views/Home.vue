<script setup lang="ts">
import { inject, computed, ComputedRef, ref, watch, onMounted } from "vue";
import { useStore } from "vuex";
import { useRouter } from "vue-router";
import Obyte from "@/obyte";
import Pool from "@/helpers/PoolHelper";
import { ITickers } from "@/interfaces/tickers.interface";
import Menu from "@/components/Menu.vue";
import AssetIcon from "@/components/AssetIcon.vue";
import useWindowSize from "@/composables/useWindowSize";
import setTitle from "@/helpers/setTitle";
//import fetchAPY7Days from "@/api/fetchAPY7Days";

import {
  TableState,
  TableStateFilters,
} from "ant-design-vue/es/table/interface";
import { InfoCircleOutlined } from "@ant-design/icons-vue";

type Pagination = TableState["pagination"];

const Client = inject("Obyte") as Obyte.Client;
const store = useStore();
const router = useRouter();
const windowSize = useWindowSize();
//const apy7d = ref({}) as any;

store.dispatch("initIfNotInit", Client);

const exchangeRates = computed(() => store.state.exchangeRates);
const poolsData = computed(() => store.state.poolsData);
const miningApy: ComputedRef<any> = computed(() => store.state.miningApy);
const tickers: ComputedRef<ITickers> = computed(() => store.state.tickers);
const isReady = computed(() => store.state.ready);
const isMobile = computed(() => windowSize.x.value < 576);
const apy7d = computed(() => store.state.apy7d);

/*async function updateAPY7d() {
  apy7d.value = await fetchAPY7Days();
}
watch(poolsData, updateAPY7d);
onMounted(updateAPY7d);*/

setTitle(`Oswap pool statistics`);

const sortedInfo = ref({
  columnKey: "tvl",
});

if (localStorage.getItem("sort_key")) {
  sortedInfo.value = { columnKey: localStorage.getItem("sort_key") || "tvl" };
}

const customRow = (pool: { pool: { address: string } }) => {
  return {
    onClick: () => {
      router.push({
        name: "Pool",
        params: {
          address: pool.pool.address,
        },
      });
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
      title: "Pool",
      dataIndex: "pool",
      key: "pool",
      slots: { customRender: "pool" },
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
      title: "Pool",
      dataIndex: "pool",
      key: "pool",
      slots: { customRender: "pool" },
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

const data = computed(() => {
  return poolsData.value.pools.map((pool: Pool) => {
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
      },
      volume,
      volumeString,
    };
  });
});

const mobileData = computed(() => {
  return poolsData.value.pools.map((pool: Pool) => {
    const poolMiningApy = miningApy.value.data[pool.address] || 0;

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
  sortedInfo.value = {
    columnKey: sorter.columnKey,
  };
  localStorage.setItem("sort_key", sorter.columnKey);
};
</script>

<template>
  <Menu :is-home="true" />
  <div
    style="
      color: #fff;
      text-align: center;
      font-size: 24px;
      margin: 36px auto 48px;
    "
  >
    Statistics for oswap v2
  </div>
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
        @change="handleChange"
      >
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
        <div v-if="text.poolMiningApy !== 0" class="apy-block">
          <div>{{ text.apy7d }}%</div>
          <div class="mining-pool-apy">+{{ text.poolMiningApy }}%
            <a-tooltip>
            <template #title>Liquidity mining rewards from <a href="https://liquidity.obyte.org" target="_blank">liquidity.obyte.org</a></template>
            <InfoCircleOutlined />
          </a-tooltip>
          </div>
        </div>
        <div v-else class="apy7d">{{ text.apy7d }}%</div>
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
