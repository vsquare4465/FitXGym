/** Preserve common formats; convert other browser-readable images to PNG. */
export async function imageUpload(file: File): Promise<string> {
  if (file.size > 8 * 1024 * 1024) throw new Error('Choose an image smaller than 8 MB.');
  const bytes = new Uint8Array(await file.arrayBuffer());
  const png = bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71;
  const jpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  const type = jpeg ? 'image/jpeg' : png ? 'image/png' : file.type.toLowerCase();
  if (['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'].includes(type)) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error('Could not read this image. Please select it again.'));
      reader.readAsDataURL(new Blob([bytes], { type }));
    });
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Your browser cannot read this image format. Export it as PNG or JPEG and try again.'));
      img.src = url;
    });
    const scale = Math.min(1, 2400 / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not convert this image. Try a PNG or JPEG file.');
    context.drawImage(img, 0, 0, canvas.width, canvas.height);
    const result = canvas.toDataURL('image/png');
    if (result.length > 8 * 1024 * 1024 * 4 / 3) throw new Error('The converted image is too large. Choose a smaller image.');
    return result;
  } finally { URL.revokeObjectURL(url); }
}
