/** Saves text as a file in the browser; false (never throws) when the browser does not allow it. */
export function downloadText(filename: string, text: string, mime: string): boolean {
  try {
    const url = URL.createObjectURL(new Blob([text], { type: mime }));
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    // Some browsers only honour the click when the link is in the document.
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    return true;
  } catch {
    return false;
  }
}
