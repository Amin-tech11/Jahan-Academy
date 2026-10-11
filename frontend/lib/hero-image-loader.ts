import assets from "./hero-image-assets.json";

type Variant = { width: number; url: string; bytes: number };
const variantsBySource: Record<string, Variant[]> = assets;

export function hasPreparedImage(src: string) {
  return Object.hasOwn(variantsBySource, src);
}

export function preparedImageLoader({ src, width }: { src: string; width: number }) {
  const variants = variantsBySource[src];
  if (!variants?.length) throw new Error(`Unprepared critical image: ${src}`);
  return (variants.find(variant => variant.width >= width) ?? variants[variants.length - 1]).url;
}
