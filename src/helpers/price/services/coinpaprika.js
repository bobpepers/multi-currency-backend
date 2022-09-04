import axios from 'axios';

export const fetchCoinPaprikaPrice = async (
  coinPriceSourceId,
) => {
  let price = null;
  try {
    const data = await axios.get(`https://api.coinpaprika.com/v1/tickers/${coinPriceSourceId}`);
    if (data.data) {
      price = data.data.quotes.USD.price.toFixed(8).toString();
    }
  } catch (e) {
    console.log(e);
  }

  return price;
};
