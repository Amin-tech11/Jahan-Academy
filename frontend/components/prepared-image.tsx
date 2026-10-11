"use client";

import Image, { type ImageProps } from "next/image";
import { hasPreparedImage, preparedImageLoader } from "@/lib/hero-image-loader";

/** Retains Next's responsive sizing/preload while serving already encoded images. */
export function PreparedImage(props: ImageProps) {
  const prepared = typeof props.src === "string" && hasPreparedImage(props.src);
  return <Image {...props} loader={prepared ? preparedImageLoader : props.loader} />;
}
