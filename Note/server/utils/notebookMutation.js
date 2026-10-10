// JSON updates and reminder delivery share one queue, so two tabs cannot
// deliver the same reminder or overwrite a note edited at the same instant.
let pending = Promise.resolve();
const withNotebookMutation = (operation) => {
  const result = pending.then(operation);
  pending = result.catch(() => {});
  return result;
};
module.exports = { withNotebookMutation };
