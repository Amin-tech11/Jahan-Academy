import type { Destination } from "./destination-content";
import type { HomeUniversity } from "./home-universities";

export type CollagePhoto = { src: string; alt: { fa: string; en: string }; position?: string };
export type CollagePhotos = readonly [CollagePhoto, CollagePhoto, CollagePhoto];
export type CollageSection = "hero" | "academics" | "life" | "planning" | "visa";

const sceneCities: Record<string, readonly [string, string, string, string, string]> = {
  canada: ["Toronto", "Montréal", "Montréal", "Toronto", "Ottawa"],
  germany: ["Berlin", "Berlin", "Berlin", "Berlin", "Munich"],
  "united-kingdom": ["London", "London", "London", "London", "Oxford"],
  italy: ["Bologna", "Bologna", "Bologna", "Florence", "Bologna"],
  netherlands: ["Delft", "Leiden", "Leiden", "Amsterdam", "Delft"],
  australia: ["Sydney", "Sydney", "Melbourne", "Sydney", "Sydney"],
  sweden: ["Stockholm", "Stockholm", "Stockholm", "Stockholm", "Stockholm"],
  finland: ["Helsinki", "Helsinki", "Helsinki", "Helsinki", "Helsinki"],
  denmark: ["Copenhagen", "Copenhagen", "Copenhagen", "Copenhagen", "Copenhagen"],
  "new-zealand": ["Auckland", "Wellington", "Wellington", "Auckland", "Auckland"],
};

export function countryStudentScenes(d: Destination) {
  const cities = sceneCities[d.slug];
  if (!cities) throw new Error(`Missing destination imagery: ${d.slug}`);
  const scene = (role: string, index: number, fa: string, en: string, position?: string): CollagePhoto => ({
    src: `/destinations/collage/${d.slug}-${role}.webp`,
    alt: { fa: `تصویرسازی دانشجویی در ${d.name.fa}: ${fa}`, en: `Illustrative student scene in ${cities[index]}, ${d.name.en}: ${en}` },
    position,
  });
  return {
    study: scene("study", 0, "همکاری دانشجویان در فضای مطالعه", "collaborative learning in a reading room"),
    life: scene("life", 1, "گفت‌وگوی دوستان در فضای شهری", "friends exploring the city together"),
    planning: scene("planning", 2, "برنامه‌ریزی هزینه‌ها و آماده‌سازی مدارک در محل اقامت", "planning a study budget and organising documents at home"),
    travel: scene("travel", 3, "ورود دانشجو با چمدان و کوله‌پشتی به شهر مقصد", "a student arriving with a suitcase and backpack", "38% center"),
    graduate: scene("graduate", 4, "جشن پایان تحصیل", "celebrating completion of studies"),
  };
}

export function destinationCollages(d: Destination, universities: readonly HomeUniversity[]): Record<CollageSection, CollagePhotos> {
  const studentScenes = countryStudentScenes(d);
  const country = { src: d.image, alt: d.imageLabel };
  const campus = (index: number, excludeCountry = false): CollagePhoto => {
    const matches = universities.filter(({ country, image }) => country === d.slug && (!excludeCountry || image !== d.image));
    const u = matches[index] || matches[0];
    return u ? { src: u.image, alt: { fa: u.name, en: u.name } } : country;
  };
  return {
    hero: [studentScenes.travel, studentScenes.life, campus(1, true)],
    academics: [studentScenes.study, campus(0), studentScenes.graduate],
    life: [studentScenes.life, campus(2, true), studentScenes.travel],
    planning: [studentScenes.planning, campus(1), studentScenes.study],
    visa: [studentScenes.travel, campus(0), studentScenes.planning],
  };
}
