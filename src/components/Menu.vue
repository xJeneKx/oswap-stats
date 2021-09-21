<script setup lang="ts">
import { defineProps } from "vue";
import { useRouter } from "vue-router";

defineProps({
  isHome: {
    type: Boolean,
    default: false,
    required: false,
  },
});

const router = useRouter();

function goToHome() {
  router.push({
    name: "Home",
  });
}

function goToSwap(): void {
  const a = document.createElement("a");
  a.href = "https://oswap.io";
  a.target = "_blank";
  a.click();
}
</script>

<template>
  <div class="menu">
    <div style="display: flex">
      <div style="cursor: pointer" @click="goToHome">
        <img
          src="https://oswap.io/img/logo.4fab4f31.svg"
          width="36"
          alt="logo"
        />
      </div>
      <div class="menu-items">
        <span :class="isHome ? 'active' : ''" @click="goToHome">Pools</span>
        <span @click="goToSwap">Swap</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.menu {
  max-width: 1200px;
  width: 100%;
  margin: 0 auto 24px;
  padding: 16px;
}
.menu-items {
  display: flex;
  font-size: 16px;
  color: #fff;
  align-items: center;
  margin-left: 24px;
}

.menu-items > span {
  height: 36px;
  color: #545e69;
  padding: 4px 20px;
  margin-left: 16px;
}

.menu-items > span.active,
.menu-items > span:hover {
  color: #fff;
  cursor: pointer;
  border-bottom: 2px solid #fff;
  transition: 500ms;
}
</style>
