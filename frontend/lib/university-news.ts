import data from "./university-news-data.json";
import type { BlogPost } from "./blog-content";
import type { Localized } from "./site-content";

export type UniversityNews = Omit<BlogPost, "type"> & {
  type: "news";
  sourceDate: string;
  paragraphs: Localized<string[]>;
  seoTitle: Localized<string>;
  category: Localized<string>;
  image: string;
  imageAlt: Localized<string>;
  imageCaption: Localized<string>;
  sources: Array<{ title: string; url: string }>;
  articleId: string;
};

export const universityNews = data as UniversityNews[];
