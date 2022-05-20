import { router } from './router';
import { notifyRouter } from './notify';

export const router = (
  app,
  io,
  queue,
) => {
  notifyRouter(
    app,
    io,
    queue,
  );
  router(
    app,
    io,
    queue,
  );
};
