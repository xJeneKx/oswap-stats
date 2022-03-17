import fetchAAStateVars from "@/api/fetchAAStateVars";
import Obyte from "@/obyte";
import { IState } from "@/interfaces/aa.interface";

export default async function fetchInitialData(Client: Obyte.Client): Promise<{
  factory: IState;
  a2sRegistry: IState;
  descriptionRegistry: IState;
  decimalsRegistry: IState;
}> {
  const factory = await fetchAAStateVars(
    Client,
    "MODBFVX2J2TRPQUK7XFTFQK73AB64NF3",
    "",
    "_"
  );
  for (const aa in factory.pool) {
    const pool = factory.pool[aa];
    pool.asset = pool.pool_asset;
  }
  factory.pools = factory.pool;
  const a2sRegistry = await fetchAAStateVars(
    Client,
    "O6H6ZIFI57X3PLTYHOCVYPP5A553CYFQ",
    "a2s_",
    "_"
  );
  const descriptionRegistry = await fetchAAStateVars(
    Client,
    "O6H6ZIFI57X3PLTYHOCVYPP5A553CYFQ",
    "current_desc_",
    "_"
  );
  const decimalsRegistry = await fetchAAStateVars(
    Client,
    "O6H6ZIFI57X3PLTYHOCVYPP5A553CYFQ",
    "decimals_",
    "_"
  );

  return {
    factory,
    a2sRegistry,
    descriptionRegistry,
    decimalsRegistry,
  };
}
