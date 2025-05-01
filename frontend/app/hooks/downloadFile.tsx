import FileSaver from "file-saver";

export const downloadFile = (file_url: string, filename: string) => {
  fetch(file_url)
    .then((response) => response.blob())
    .then((blob) => {
      FileSaver.saveAs(blob, filename);
    })
    .catch((error) => {
      console.error("Error downloading file:", error);
    });
};