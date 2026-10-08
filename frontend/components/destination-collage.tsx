import Image from "next/image";
import type { CollagePhoto } from "@/lib/destination-collages";
import type { Locale } from "@/lib/site-content";
import styles from "./destination-collage.module.css";

type Layout = "hero" | "academics" | "life" | "planning" | "visa";

export function DestinationCollage({ photos, locale, layout, className = "" }: {
  photos: readonly CollagePhoto[];
  locale: Locale;
  layout: Layout;
  className?: string;
}) {
  return <div className={`${styles.collage} ${styles[layout]} ${className}`} data-collage={layout}>
    {photos.map((photo, index) => <div data-destination-motion={layout === "hero" && index === 0 ? "zoom" : "up"} data-destination-delay={index * 60} className={styles.tile} key={`${photo.src}-${index}`}>
      <Image src={photo.src} alt={photo.alt[locale]} fill
        sizes={index === 0 ? "(max-width: 760px) 80vw, 32vw" : "(max-width: 760px) 40vw, 18vw"}
        preload={layout === "hero" && index === 0} />
    </div>)}
  </div>;
}
