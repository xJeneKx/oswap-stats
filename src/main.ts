import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import Obyte from "@/plugins/Obyte";

import Antd from "ant-design-vue";
import "ant-design-vue/dist/antd.dark.css";

createApp(App).use(Antd).use(store).use(router).use(Obyte).mount("#app");
