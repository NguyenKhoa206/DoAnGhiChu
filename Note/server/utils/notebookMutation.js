// Preparation, JSON updates and reminder delivery share one queue, so a reload
// cannot migrate a collection mid-save, deliver a reminder twice or overwrite edits.
let pending = Promise.resolve();
const withNotebookMutation = (operation) => {
  const result = pending.then(operation);
  pending = result.catch(() => {});
  return result;
};
module.exports = { withNotebookMutation };
