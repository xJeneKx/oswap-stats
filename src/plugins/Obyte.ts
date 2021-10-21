/* eslint-disable */

const obyte = require("obyte");

export default {
  // eslint-disable-next-line
  install: (app: any) => {
    const client = new obyte.Client();
    client.onConnect(() => {
      const interval = setInterval(() => {
        client.api.heartbeat();
      }, 10 * 1000);

      client.client.ws.addEventListener("close", () => {
        if (interval) clearInterval(interval);
      });
    });

    app.config.globalProperties.$obyte = client;
    app.provide("Obyte", client);
  },
};
