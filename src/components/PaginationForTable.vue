<script setup lang="ts">
import { defineProps } from "vue";
import { useRouter } from "vue-router";
defineProps(["page"]);

const router = useRouter();

function goToPage(page: number) {
  router.push({ query: { page } });
}
</script>

<template>
  <a :href="'?page=' + page" @click.prevent="goToPage(page)"><slot></slot></a>
</template>

<style scoped>

</style>