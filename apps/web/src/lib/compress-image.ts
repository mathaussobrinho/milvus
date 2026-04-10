/** Limite usado no perfil (data URL enviada à API). */
export const AVATAR_MAX_BYTES = 450 * 1024;

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(r.error ?? new Error("Falha ao ler imagem."));
    r.readAsDataURL(blob);
  });
}

type DisposableSource = { draw: CanvasImageSource; w: number; h: number; dispose: () => void };

async function loadImageSource(file: File): Promise<DisposableSource> {
  try {
    const bitmap = await createImageBitmap(file);
    return {
      draw: bitmap,
      w: bitmap.width,
      h: bitmap.height,
      dispose: () => bitmap.close(),
    };
  } catch {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      const url = URL.createObjectURL(file);
      el.onload = () => {
        URL.revokeObjectURL(url);
        resolve(el);
      };
      el.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Nao foi possivel abrir a imagem."));
      };
      el.src = url;
    });
    return {
      draw: img,
      w: img.naturalWidth,
      h: img.naturalHeight,
      dispose: () => {},
    };
  }
}

/**
 * Redimensiona e comprime para JPEG até ficar <= maxBytes (data URL).
 * PNG com transparência passa a JPEG (fundo preto onde era transparente).
 */
export async function compressImageFileToDataUrl(
  file: File,
  maxBytes: number = AVATAR_MAX_BYTES
): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Arquivo nao e uma imagem.");
  }

  const src = await loadImageSource(file);
  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Navegador nao suporta processamento de imagem.");
    }

    const { w: ow, h: oh } = src;
    if (ow < 1 || oh < 1) {
      throw new Error("Dimensoes de imagem invalidas.");
    }

    let dimScale = Math.min(1, 2048 / Math.max(ow, oh));
    let quality = 0.92;
    const minQuality = 0.42;
    const minDimScale = 0.04;

    for (let iter = 0; iter < 48; iter++) {
      const w = Math.max(1, Math.round(ow * dimScale));
      const h = Math.max(1, Math.round(oh * dimScale));
      canvas.width = w;
      canvas.height = h;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(src.draw, 0, 0, w, h);

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", quality)
      );
      if (!blob) {
        dimScale *= 0.84;
        quality = 0.88;
        continue;
      }
      if (blob.size <= maxBytes) {
        return blobToDataUrl(blob);
      }

      if (quality > minQuality) {
        quality -= 0.035;
        continue;
      }

      quality = 0.88;
      dimScale *= 0.84;
      if (dimScale < minDimScale) {
        const last = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob(resolve, "image/jpeg", minQuality)
        );
        if (last) {
          return blobToDataUrl(last);
        }
        throw new Error("Nao foi possivel reduzir a imagem o suficiente.");
      }
    }

    throw new Error("Nao foi possivel reduzir a imagem o suficiente.");
  } finally {
    src.dispose();
  }
}
