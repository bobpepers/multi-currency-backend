import { apiRouter } from './api';
import { notifyRouter } from './notify';

export const router = (
  app,
  io,
  sockets,
  queue,
) => {
  notifyRouter(
    app,
    io,
    sockets,
    queue,
  );
  apiRouter(
    app,
    io,
    sockets,
    queue,
  );
};
