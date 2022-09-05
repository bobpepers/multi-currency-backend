/* eslint-disable no-restricted-syntax */
import { config } from "dotenv";
import { getTokelInstance } from "../../../services/rclient";

config();

export async function consolidateTokelFunds() {
  const listUnspent = await getTokelInstance().listUnspent();
  if (listUnspent.length > 1) {
    const consolidate = await getTokelInstance().zMergeToAddress(
      ["ANY_TADDR"],
      process.env.TOKEL_CONSOLIDATION_ADDRESS,
    );
  }
}
