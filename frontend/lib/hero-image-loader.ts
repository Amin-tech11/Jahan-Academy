import assets from "./hero-image-index.json";
const variantsBySource = assets as unknown as Record<string, [string, number[]]>;
export function hasPreparedImage(src: string) { return Object.hasOwn(variantsBySource, src); }
export function preparedImageLoader({ src, width }: { src: string; width: number }) {
  const variants = variantsBySource[src];
  if (!variants?.[1]?.length) throw new Error(`Unprepared critical image: ${src}`);
  const [hash, widths] = variants;
  return `/hero-assets/${hash}-${widths.find(w => w >= width) ?? widths.at(-1)}.webp`;
}
