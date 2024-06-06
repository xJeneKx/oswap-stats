import axios from "axios";
import { OSWAP_TOKEN_API } from "../../config";

export interface IFarmingPool {
    asset: string;
    apy: string;
    address?: string;
}

export default async function fetchFarmingAPY(): Promise<[IFarmingPool?]> {
    try {
        const { data } = await axios.get(`${OSWAP_TOKEN_API}/lp_apy`);
    
        return data.data;
    } catch {
        return [];
    }
}