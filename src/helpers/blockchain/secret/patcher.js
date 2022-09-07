import axios from 'axios';

/* eslint-disable no-restricted-syntax */
import { Transaction } from "sequelize";
import BigNumber from "bignumber.js";
import { getSecretjsInstance } from '../../../services/rclient';
import db from '../../../models';

// import logger from "../../logger";

/**
 * Patch Transaction From Secret
 */
export const patchSecretDeposits = async () => {
  try {
    const secretjs = await getSecretjsInstance();

    // Query chain id & height
    const latestBlock = await secretjs.query.tendermint.getLatestBlock({});
    console.log("ChainId:", latestBlock.block.header.chainId);
    console.log("Block height:", latestBlock.block.header.height);

    const txs = await axios.get(`${process.env.SECRET_RPC_URL}/cosmos/tx/v1beta1/txs?events=tx.height>=500&transfer.recipient=${process.env.SECRET_ADDRESS}&pagination.limit=1`);
    console.log(txs);
    for await (const tx of txs.data.tx_responses) {
      console.log("tx:", tx);

      const address = await db.address.findOne({
        where: {
          address: process.env.SECRET_ADDRESS,
          memo: tx.tx.body.memo ? tx.tx.body.memo : 'missing memo',
        },
        include: [
          {
            model: db.wallet,
            as: 'wallet',
            required: true,
            include: [
              {
                model: db.coin,
                as: 'coin',
                required: true,
                where: {
                  ticker: 'SCRT',
                },
              },
              {
                model: db.user,
                as: 'user',
              },
            ],
          },
        ],
      });
      const findCoin = await db.coin.findOne({
        where: {
          ticker: 'SCRT',
        },
      });
      // console.log(tx);
      // if (
      //   tx.tx.body.messages[0].amount[0].denom === 'uscrt'
      //   // &&
      // ) {
      //   if (!address) {
      //     if (findCoin) {
      //       // console.log('123');
      //       // console.log(tx.tx.body);
      //       // console.log(tx.tx.body.messages[0]);
      //       // // console.log(tx.tx.body.messages[0].amount[0].amount / 1e6);
      //       // const amount = new BigNumber(tx.tx.body.messages[0].amount[0].amount).dividedBy(1e8);
      //       // console.log(amount.toString());
      //     }
      //   }
      // }
      const fetchedTx = await secretjs.query.getTx(tx.txhash);
      console.log(fetchedTx);
      console.log(tx.txhash);
    }

    // console.log(txs.data.tx_responses.length);
  } catch (e) {
    console.log(e);
  }
};
