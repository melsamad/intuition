/** Prevent clipboard insertion and drag-and-drop into student explanations. */
export function blockExplanationInsertion(event: { preventDefault: () => void }) {
  event.preventDefault();
}