import axios from "axios";
import { LIQUIDITY_PROVIDER_API } from "../../config";

export default async function fetchTMiningApy(): Promise<any> {
    return axios.get(`${LIQUIDITY_PROVIDER_API}/mining-apy`);
}
