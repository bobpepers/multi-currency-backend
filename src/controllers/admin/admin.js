/**
 * isAdmin
 */
export const isAdmin = async (
  req,
  res,
  next,
) => {
  if (req.user.role !== 4 && req.user.role !== 8) {
    res.status(401).send({
      error: 'Unauthorized',
    });
  } else {
    next();
  }
};
