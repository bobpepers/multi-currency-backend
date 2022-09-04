import { config } from "dotenv";
import db from '../../models';
import { fetchCoinPaprikaPrice } from './services/coinpaprika';
import { fetchNomicsPrice } from './services/nomics';

config();

export const updatePrice = async () => {
  const coinPriceSources = await db.CoinPriceSource.findAll({
    include: [
      {
        model: db.priceSource,
        as: 'priceSource',
        required: true,
      },
    ],
  });

  // eslint-disable-next-line no-restricted-syntax
  for await (const coinPriceSource of coinPriceSources) {
    if (coinPriceSource.priceSource.name === 'coinpaprika') {
      try {
        const price = await fetchCoinPaprikaPrice(coinPriceSource.coinPriceSourceId);
        if (price) {
          await coinPriceSource.update({
            price,
          });
        }
      } catch (error) {
        console.error(error);
      }
    }
    if (coinPriceSource.priceSource.name === 'nomics') {
      try {
        const price = await fetchNomicsPrice(coinPriceSource.coinPriceSourceId);
        if (price) {
          await coinPriceSource.update({
            price,
          });
        }
      } catch (error) {
        console.error(error);
      }
    }
  }
};
