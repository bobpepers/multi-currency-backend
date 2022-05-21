import { getRunebaseInstance } from '../services/rclient';

export const fetchNodeStatus = async (
  req,
  res,
  next,
) => {
  const connected = await getRunebaseInstance().isConnected();
  const peers = await getRunebaseInstance().getPeerInfo();

  if (
    connected
    && peers
  ) {
    res.locals.result = {
      peers,
      status: connected,
    };
  }

  next();
};
