<script setup lang="ts">
import { defineProps } from "vue";
import { useRoute, useRouter } from "vue-router";
defineProps(["page"]);

const router = useRouter();
const route = useRoute();

function goToPage(page: number) {
  router.push({
    query: { ...route.query, page },
    hash: route.hash || undefined,
  });
}
</script>

<template>
  <a :href="'?page=' + page" @click.prevent="goToPage(page)"><slot></slot></a>
</template>

<style scoped>

</style>