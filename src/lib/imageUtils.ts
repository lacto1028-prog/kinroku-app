/**
 * 画像をリサイズ・圧縮してBase64形式で返す
 * @param file - アップロードされた画像ファイル
 * @param maxWidth - 最大幅（デフォルト: 800px）
 * @param maxHeight - 最大高さ（デフォルト: 800px）
 * @param quality - 画質（0-1、デフォルト: 0.7）
 */
export async function compressImage(
  file: File,
  maxWidth = 800,
  maxHeight = 800,
  quality = 0.7
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // リサイズ計算
        let { width, height } = img;
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }

        // Canvasに描画
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas context not available"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Base64形式で出力
        const base64 = canvas.toDataURL("image/jpeg", quality);
        resolve(base64);
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

/**
 * 複数の画像ファイルを圧縮してBase64配列として返す
 */
export async function compressImages(
  files: File[],
  maxWidth = 800,
  maxHeight = 800,
  quality = 0.7
): Promise<string[]> {
  const promises = files.map((file) => compressImage(file, maxWidth, maxHeight, quality));
  return Promise.all(promises);
}

/**
 * Base64画像のファイルサイズを取得（バイト単位）
 */
export function getBase64Size(base64: string): number {
  // Base64の文字列長から概算
  const padding = (base64.match(/=/g) || []).length;
  return Math.floor((base64.length * 3) / 4) - padding;
}

/**
 * ファイルサイズを人間が読める形式に変換
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}