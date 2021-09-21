/* eslint-disable */
import { ref } from "vue";

const obyte = require("obyte");
const { publicKeyCreate } = require("secp256k1");
const {
  getDeviceMessageHashToSign,
  getDeviceAddress,
} = require("@obyte/ocore/object_hash");
import {
  fromWif,
  decryptPackage,
  createObjDeviceKey,
  createEncryptedPackage,
  sign,
} from "@/helpers/client.helper";

export default {
  // eslint-disable-next-line
  install: (app: any) => {
    const client = new obyte.Client();
    const WIF = "5JB4gYrCSGon3HVxNWWVDCMdDeeyK1MeDKWqLe4hQLJ4ucxJ1s7";
    const devicePrivKey = fromWif(WIF, false).privateKey;
    const objMyPermDeviceKey = createObjDeviceKey(devicePrivKey);

    const exchangeRates = ref({});
    client.exchangeRates = exchangeRates;

    client.subscribe(function (err: any, result: any) {
      const [command, { subject, body }] = result;
      switch (command) {
        case "justsaying":
          switch (subject) {
            case "hub/challenge": {
              const objLogin = {
                challenge: body,
                pubkey: objMyPermDeviceKey.pub_b64,
                signature: undefined,
              };
              objLogin.signature = sign(
                getDeviceMessageHashToSign(objLogin),
                objMyPermDeviceKey.priv
              );
              client.justsaying("hub/login", objLogin);
              break;
            }
            case "exchange_rates": {
              exchangeRates.value = body;
            }
          }
          break;
      }
    });
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
