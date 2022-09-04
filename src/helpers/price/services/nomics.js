import axios from 'axios';
import { config } from "dotenv";

config();

export const fetchNomicsPrice = async (
  coinPriceSourceId,
) => {
  let price = null;
  try {
    const data = await axios.get(`https://api.nomics.com/v1/currencies/ticker?key=${process.env.NOMICS_KEY}&ids=${coinPriceSourceId}&convert=USD`);
    if (data.data[0]) {
      price = data.data[0].price;
    }
  } catch (e) {
    console.log(e);
  }

  return price;
};
