import Obyte from "@/obyte";
import { IState } from "@/interfaces/aa.interface";

export async function fetchAAHistory(
    Client: Obyte.Client,
    address: string
): Promise<IState> {
    const params = {
        witnesses: await Client.api.getWitnesses(),
        addresses: [address]
    };

    try {
        return await Client.api.getHistory(params);
    } catch (e) {
        return {};
    }
}

export async function getAAResponses(
    Client: Obyte.Client,
    address: string
): Promise<IState> {
    const params = {
        aa: address
    };

    try {
        return await Client.api.getAaResponses(params);
    } catch (e) {
        return {};
    }
}


export async function getJoint(
    Client: Obyte.Client,
    unit: string
): Promise<IState> {
    try {
        return await Client.api.getJoint(unit);
    } catch (e) {
        return {};
    }
}
