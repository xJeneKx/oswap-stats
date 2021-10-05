<script setup lang="ts">
import { inject, computed, ComputedRef, ref } from "vue";
import { useStore } from "vuex";
import { useRouter } from "vue-router";
import Obyte from "@/obyte";
import Pool from "@/helpers/PoolHelper";
import { ITickers } from "@/interfaces/tickers.interface";
import Menu from "@/components/Menu.vue";
import useWindowSize from "@/composables/useWindowSize";
import {
  TableState,
  TableStateFilters,
} from "ant-design-vue/es/table/interface";

type Pagination = TableState["pagination"];

const Client = inject("Obyte") as Obyte.Client;
const store = useStore();
const router = useRouter();
const windowSize = useWindowSize();

store.dispatch("initIfNotInit", Client);

const poolsData = computed(() => store.state.poolsData);
const tickers: ComputedRef<ITickers> = computed(() => store.state.tickers);
const isReady = computed(() => store.state.ready);
const isMobile = computed(() => windowSize.x.value < 576);

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

const columns = computed(() => {
  const key = sortedInfo.value.columnKey;
  return [
    {
      title: "#",
      dataIndex: "n",
      key: "n",
    },
    {
      title: "Pool",
      dataIndex: "pool",
      key: "pool",
      slots: { customRender: "pool" },
    },
    {
      title: "TVL",
      dataIndex: "TVL",
      key: "tvl",
      sortDirections: ["descend"],
      sorter: (a: any, b: any) => a.TVL - b.TVL,
      sortOrder: key === "tvl" && "descend",
      slots: { customRender: "TVL" },
    },
    {
      title: "APY 24h",
      dataIndex: "APY",
      key: "APY",
      sortDirections: ["descend"],
      sorter: (a: any, b: any) => a.APY - b.APY,
      sortOrder: key === "APY" && "descend",
      slots: { customRender: "APY" },
    },
    {
      title: "Volume 24H",
      dataIndex: "volume",
      key: "volume",
      sortDirections: ["descend"],
      sorter: (a: any, b: any) => a.volume - b.volume,
      sortOrder: key === "volume" && "descend",
      slots: { customRender: "volume" },
    },
  ];
});

const mobileColumns = ref([
  {
    title: "Pool",
    dataIndex: "pool",
    key: "pool",
    slots: { customRender: "pool" },
  },
  {
    title: "TVL",
    dataIndex: "TVL",
    key: "tvl",
    defaultSortOrder: "descend",
    sortDirections: ["descend"],
    sorter: (a: any, b: any) => a.TVL - b.TVL,
    slots: { customRender: "TVL" },
  },
]);

const data = computed(() => {
  return poolsData.value.pools.map((pool: Pool, index: number) => {
    return {
      key: pool.ticker,
      n: index + 1,
      pool: {
        name: pool.ticker,
        fee: pool.swapFee / 1000000000,
        address: pool.address,
      },
      TVL: Number(pool.marketcap.toFixed(2)),
      APY: pool.get24hAPY(
        tickers.value,
        poolsData.value.assets,
        Client.exchangeRates
      ),
      volume: pool.get24hVolumeInUSD(
        tickers.value,
        poolsData.value.assets,
        Client.exchangeRates
      ),
    };
  });
});

const mobileData = computed(() => {
  return poolsData.value.pools.map((pool: Pool) => {
    return {
      key: pool.ticker,
      pool: {
        name: pool.ticker,
        fee: pool.swapFee / 1000000000,
        address: pool.address,
      },
      TVL: Number(pool.marketcap.toFixed(2)),
    };
  });
});

const handleChange = (
  pagination: Pagination,
  filters: TableStateFilters,
  sorter: any
) => {
  console.log("Various parameters", pagination, filters, sorter);
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
    Statistics for oswap.io
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
        <template #pool="{ text: objPool }">
          {{ objPool.name }}
          <a-tag class="fee" style="margin-left: 8px">{{ objPool.fee }}%</a-tag>
        </template>
        <template #TVL="{ text }">${{ text }}</template>
        <template #APY="{ text }">{{ text }}%</template>
        <template #volume="{ text }">${{ text }}</template>
      </a-table>
    </div>
  </div>
</template>

<style>
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

@media screen and (max-width: 600px) {
  .fee {
    display: none !important;
  }
}
</style>
