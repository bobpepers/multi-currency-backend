import axios from 'axios';
import { config } from "dotenv";
import db from '../../models';

config();

export const updatePrice = async () => {
  const coins = await db.coin.findAll({});

  // eslint-disable-next-line no-restricted-syntax
  for await (const coin of coins) {
    try {
      const data = await axios.get(`https://api.coinpaprika.com/v1/tickers/${coin.ticker.toLowerCase()}-${coin.name.toLowerCase()}`);
      if (data.data) {
        await coin.update({
          price: (Number(data.data.quotes.USD.price)).toFixed(8).toString(),
        });
      }
    } catch (error) {
      console.error(error);
    }
  }
};
