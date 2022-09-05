/* eslint-disable no-restricted-syntax */
import { config } from "dotenv";
import { consolidateTokelFunds } from "./tokel/consolidate";
import { consolidateRunebaseFunds } from "./runebase/consolidate";

config();

export async function consolidateFunds(
  schedule,
  queue,
) {
  const scheduleRunebaseConsolidation = schedule.scheduleJob('*/55 * * * *', async () => {
    await queue.add(async () => {
      await consolidateRunebaseFunds();
      await consolidateTokelFunds();
    });
  });
}
