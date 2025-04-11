
interface AdjustTextareaHeight {
    (textarea: HTMLTextAreaElement): void;
  }

  const adjustTextareaHeight: AdjustTextareaHeight = (textarea) => {
    textarea.style.height = "auto"; // Reset height to auto to calculate the actual scroll height
    textarea.style.height = `${textarea.scrollHeight}px`; // Set height to the scroll height
  };


export default adjustTextareaHeight;