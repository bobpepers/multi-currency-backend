export const sequentialLoop = async (
  iterations,
  process,
  exit,
) => {
  let index = 0;
  let done = false;
  let shouldExit = false;

  const loop = {
    async next() {
      if (done) {
        if (shouldExit && exit) {
          return exit();
        }
      }

      if (index < iterations) {
        index += 1;
        await process(loop);
      } else {
        done = true;

        if (exit) {
          exit();
        }
      }
    },

    iteration() {
      return index - 1; // Return the loop number we're on
    },

    break(end) {
      done = true;
      shouldExit = end;
    },
  };
  await loop.next();
  return loop;
};
