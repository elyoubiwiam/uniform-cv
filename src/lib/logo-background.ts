/** PNG uploads already support transparency and do not need a prompt. */
export function shouldOfferBackgroundRemoval(file: { name: string; type: string }) {
  return file.type.toLowerCase() !== "image/png" && !/\.png$/i.test(file.name);
}

/** Remove only a flat, edge-connected backdrop, preserving enclosed logo colors. */
export function clearLogoBackground(pixels: Uint8ClampedArray, width: number, height: number) {
  if (width < 2 || height < 2 || pixels.length !== width * height * 4) {
    throw new Error("This logo could not be read. Please try another image.");
  }
  const border: number[] = [];
  for (let x = 0; x < width; x++) border.push(x, (height - 1) * width + x);
  for (let y = 1; y < height - 1; y++) border.push(y * width, y * width + width - 1);
  // Median edge color ignores isolated foreground marks touching the border.
  const background = [0, 1, 2].map((channel) => {
    const values = border.map((index) => pixels[index * 4 + channel] ?? 0).sort((a, b) => a - b);
    return values[Math.floor(values.length / 2)] ?? 0;
  });
  const distance = (index: number) => Math.max(...background.map((color, channel) => Math.abs((pixels[index * 4 + channel] ?? 0) - color)));
  if (border.filter((index) => distance(index) <= 36).length / border.length < 0.8) {
    throw new Error("This logo has a patterned or uneven background that cannot be removed safely. Keep the original or upload a transparent PNG.");
  }
  const result = new Uint8ClampedArray(pixels);
  const visited = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  let count = 0;
  const add = (index: number) => {
    if (visited[index]) return;
    visited[index] = 1;
    if (distance(index) <= 60) queue[count++] = index;
  };
  border.forEach(add);
  for (let cursor = 0; cursor < count; cursor++) {
    const index = queue[cursor] ?? 0;
    const difference = distance(index);
    result[index * 4 + 3] = difference <= 36 ? 0 : Math.round((pixels[index * 4 + 3] ?? 255) * (difference - 36) / 24);
    const x = index % width;
    if (x > 0) add(index - 1);
    if (x < width - 1) add(index + 1);
    if (index >= width) add(index - width);
    if (index < width * (height - 1)) add(index + width);
  }
  return result;
}

export async function removeLogoBackground(dataUrl: string): Promise<string> {
  const image = new Image();
  image.src = dataUrl;
  await image.decode();
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Background removal is not available in this browser.");
  context.drawImage(image, 0, 0);
  const data = context.getImageData(0, 0, canvas.width, canvas.height);
  data.data.set(clearLogoBackground(data.data, data.width, data.height));
  context.putImageData(data, 0, 0);
  return canvas.toDataURL("image/png");
}