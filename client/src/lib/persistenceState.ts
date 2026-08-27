/** Guards UI confirmation so completion is shown only after a durable write succeeds. */
export async function saveBeforeConfirm<T>(
  save: () => Promise<T>,
  confirm: () => void,
  reject: () => void,
) {
  try {
    await save();
    confirm();
    return true;
  } catch {
    reject();
    return false;
  }
}
