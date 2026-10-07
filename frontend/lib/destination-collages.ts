import type { Destination } from "./destination-content";
import type { HomeUniversity } from "./home-universities";

export type CollagePhoto = { src: string; alt: { fa: string; en: string } };
export type CollagePhotos = readonly [CollagePhoto, CollagePhoto, CollagePhoto];
export type CollageSection = "hero" | "academics" | "life" | "planning" | "visa";

const scene = (name: string, fa: string, en: string): CollagePhoto => ({
  src: `/destinations/collage/${name}.webp`,
  alt: { fa: `تصویرسازی دانشجویی: ${fa}`, en: `Illustrative student scene: ${en}` },
});
export const studentScenes = {
  study: scene("study", "مطالعه گروهی در کتابخانه", "collaborative learning in a library"),
  life: scene("life", "دوستان دانشجو در فضای باز", "friends on a campus walk"),
  planning: scene("planning", "برنامه‌ریزی بودجه تحصیل", "planning a study budget"),
  travel: scene("travel", "آماده سفر تحصیلی", "preparing for a study journey"),
  graduate: scene("graduate", "جشن پایان تحصیل", "celebrating graduation"),
};

export function destinationCollages(d: Destination, universities: readonly HomeUniversity[]): Record<CollageSection, CollagePhotos> {
  const country = { src: d.image, alt: d.imageLabel };
  const campus = (index: number, excludeCountry = false): CollagePhoto => {
    const matches = universities.filter(({ country, image }) => country === d.slug && (!excludeCountry || image !== d.image));
    const u = matches[index] || matches[0];
    return u ? { src: u.image, alt: { fa: u.name, en: u.name } } : country;
  };
  return {
    hero: [country, studentScenes.travel, campus(1, true)],
    academics: [studentScenes.study, campus(0), studentScenes.graduate],
    life: [studentScenes.life, campus(2, true), country],
    planning: [studentScenes.planning, campus(1), studentScenes.study],
    visa: [studentScenes.travel, campus(0), studentScenes.planning],
  };
}
