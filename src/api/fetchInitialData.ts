import fetchAAStateVars from "@/api/fetchAAStateVars";
import { IState } from "@/interfaces/aa.interface";

const factoryAAs = ["OQLU4HOAIVJ32SDVBJA6AKD52OVTHAOF", "MODBFVX2J2TRPQUK7XFTFQK73AB64NF3"];

export default async function fetchInitialData(): Promise<{
  factory: IState;
  a2sRegistry: IState;
  descriptionRegistry: IState;
  decimalsRegistry: IState;
}> {
  const fetchFactoryData = async (factoryAA: string) => await fetchAAStateVars(
    factoryAA,
    "",
    "_"
  );
  const factories = await Promise.all(factoryAAs.map(aa => fetchFactoryData(aa)));
  let pools: IState = { };
  for (const f of factories)
    pools = { ...pools, ...f.pool };
  for (const aa in pools) {
    const pool = pools[aa];
    pool.asset = pool.pool_asset;
  }
  const factory = { pool: pools, pools };
  const a2sRegistry = await fetchAAStateVars(
    "O6H6ZIFI57X3PLTYHOCVYPP5A553CYFQ",
    "a2s_",
    "_"
  );
  const descriptionRegistry = await fetchAAStateVars(
    "O6H6ZIFI57X3PLTYHOCVYPP5A553CYFQ",
    "current_desc_",
    "_"
  );
  const decimalsRegistry = await fetchAAStateVars(
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
