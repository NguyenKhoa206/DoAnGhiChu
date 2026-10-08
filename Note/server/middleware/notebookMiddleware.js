const { NOTEBOOK_ID, prepareNotebook } = require('../utils/notebookStorage');

module.exports = async (req, res, next) => {
  try {
    await prepareNotebook();
    req.user = { userId: NOTEBOOK_ID };
    next();
  } catch (error) { next(error); }
};
