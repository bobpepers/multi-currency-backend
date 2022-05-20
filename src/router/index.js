import { apiRouter } from './api';
//import { notifyRouter } from './notify';

export const router = (
  app,
  io,
  queue,
) => {
  // notifyRouter(
  //   app,
  //   io,
  //   queue,
  // );
  apiRouter(
    app,
    io,
    queue,
  );
};
