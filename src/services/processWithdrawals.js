import { Transaction } from "sequelize";
import { config } from "dotenv";
import db from '../models';
import {
  discordWithdrawalAcceptedMessage,
  discordUserWithdrawalRejectMessage,
} from "../messages/discord";
import {
  withdrawalAcceptedAdminMessage,
  withdrawalAcceptedMessage,
} from "../messages/telegram";
import { matrixWithdrawalAcceptedMessage } from "../messages/matrix";
import { processWithdrawal } from "./processWithdrawal";
import { findUserDirectMessageRoom } from '../helpers/client/matrix/directMessageRoom';

config();

export const processWithdrawals = async (
  telegramClient,
  discordClient,
  matrixClient,
) => {
  await db.sequelize.transaction({
    isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE,
  }, async (t) => {
    let updatedTrans;
    const transaction = await db.transaction.findOne({
      where: {
        phase: 'review',
      },
      include: [
        {
          model: db.address,
          as: 'address',
          include: [
            {
              model: db.wallet,
              as: 'wallet',
              include: [{
                model: db.user,
                as: 'user',
              }],
            },
          ],
        },
      ],
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!transaction) {
      console.log('No withdrawal to process');
      return;
    }
    if (transaction) {
      const [
        response,
        responseStatus,
      ] = await processWithdrawal(transaction);

      if (responseStatus && responseStatus === 500) {
        updatedTrans = await transaction.update(
          {
            // txid: response,
            phase: 'failed',
            type: 'send',
          },
          {
            transaction: t,
            lock: t.LOCK.UPDATE,
          },
        );
        const activityF = await db.activity.create(
          {
            spenderId: transaction.address.wallet.userId,
            type: 'withdraw_f',
            transactionId: transaction.id,
          },
          {
            transaction: t,
            lock: t.LOCK.UPDATE,
          },
        );
        return;
      }

      if (response) {
        updatedTrans = await transaction.update(
          {
            txid: response,
            phase: 'confirming',
            type: 'send',
          },
          {
            transaction: t,
            lock: t.LOCK.UPDATE,
          },
        );
        const activity = await db.activity.create(
          {
            spenderId: transaction.address.wallet.userId,
            type: 'withdrawAccepted',
            transactionId: transaction.id,
          },
          {
            transaction: t,
            lock: t.LOCK.UPDATE,
          },
        );
      }
    }

    t.afterCommit(async () => {
      try {
        if (transaction) {
          if (transaction.address.wallet.user.user_id.startsWith('discord-')) {
            const userDiscordId = transaction.address.wallet.user.user_id.replace('discord-', '');
            const myClient = await discordClient.users.fetch(userDiscordId, false);
            await myClient.send({ embeds: [discordWithdrawalAcceptedMessage(updatedTrans)] });
          }
          if (transaction.address.wallet.user.user_id.startsWith('telegram-')) {
            const userTelegramId = transaction.address.wallet.user.user_id.replace('telegram-', '');
            await telegramClient.telegram.sendMessage(
              userTelegramId,
              await withdrawalAcceptedMessage(
                transaction,
                updatedTrans,
              ),
              {
                parse_mode: 'HTML',
              },
            );
          }
          if (transaction.address.wallet.user.user_id.startsWith('matrix-')) {
            const userMatrixId = transaction.address.wallet.user.user_id.replace('matrix-', '');
            const [
              directUserMessageRoom,
              isCurrentRoomDirectMessage,
              userState,
            ] = await findUserDirectMessageRoom(
              matrixClient,
              userMatrixId,
            );
            if (directUserMessageRoom) {
              await matrixClient.sendEvent(
                directUserMessageRoom.roomId,
                "m.room.message",
                matrixWithdrawalAcceptedMessage(updatedTrans),
              );
            }
          }
          await telegramClient.telegram.sendMessage(
            Number(process.env.TELEGRAM_ADMIN_ID),
            await withdrawalAcceptedAdminMessage(updatedTrans),
            {
              parse_mode: 'HTML',
            },
          );
        }
      } catch (e) {
        console.log(e);
      }
    });
  }).catch(async (err) => {
    console.log(err);
    try {
      await telegramClient.telegram.sendMessage(
        Number(process.env.TELEGRAM_ADMIN_ID),
        `Something went wrong with withdrawals`,
        {
          parse_mode: 'HTML',
        },
      );
    } catch (error) {
      console.log(error);
    }
  });
};
