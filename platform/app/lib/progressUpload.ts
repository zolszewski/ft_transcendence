export function uploadFileWithProgress(
  url: string,
  formData: FormData,
  onProgress: (percent: number) => void
): Promise<{ status: number; data: any }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.withCredentials = true;

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && event.total > 0) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      } else if (event.loaded > 0) {
        onProgress(1);
      }
    };

    onProgress(0);
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(100);
      }
      let data: any = {};
      try {
        data = JSON.parse(xhr.responseText);
      } catch {
        // leave data as {}
      }
      resolve({ status: xhr.status, data });
    };

    xhr.onerror = () => reject(new Error("Erreur réseau"));
    xhr.send(formData);
  });
}