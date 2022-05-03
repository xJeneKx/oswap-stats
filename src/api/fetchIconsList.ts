import axios from "axios";
import { ICON_CDN_URL } from "../../config";

export default async function fetchIconsList(): Promise<[string?]> {
    try {
        const response = await axios.get(`${ICON_CDN_URL}/list.json`);

        return response.data;
    } catch (e) {
        return [];
    }
}
