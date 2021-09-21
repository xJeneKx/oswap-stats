<script setup lang="ts">
import { inject, computed, ComputedRef, ref } from "vue";
import { useStore } from "vuex";
import { useRouter } from "vue-router";
import Obyte from "@/obyte";
import Pool from "@/helpers/PoolHelper";
import { ITickers } from "@/interfaces/tickers.interface";
import Menu from "@/components/Menu.vue";

const Client = inject("Obyte") as Obyte.Client;
const store = useStore();
const router = useRouter();

store.dispatch("initIfNotInit", Client);

const poolsData = computed(() => store.state.poolsData);
const tickers: ComputedRef<ITickers> = computed(() => store.state.tickers);
const isReady = computed(() => store.state.ready);

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

const columns = ref([
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
  },
  {
    title: "Volume 24H",
    dataIndex: "volume",
    key: "volume",
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
      TVL: "$" + pool.marketcap.toFixed(2),
      volume:
        "$" +
        pool.get24hVolumeInUSD(
          tickers.value,
          poolsData.value.assets,
          Client.exchangeRates
        ),
    };
  });
});
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

  <div v-if="isReady">
    <div
      style="max-width: 1200px; width: 90%; margin: 16px auto; padding: 0 16px"
    >
      <a-table
        class="table"
        :dataSource="data"
        :columns="columns"
        :custom-row="customRow"
        :rowClassName="(record, index) => 'table-pointer'"
      >
        <template #pool="{ text: objPool }">
          {{ objPool.name }}
          <a-tag class="fee" style="margin-left: 8px">{{ objPool.fee }}%</a-tag>
        </template>
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
