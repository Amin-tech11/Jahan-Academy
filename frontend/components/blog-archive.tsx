"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { blogCopy, blogDate, blogHref, blogImage, selectBlogPosts, type BlogFilter, type BlogPost } from "@/lib/blog-content";
import type { Locale } from "@/lib/site-content";

const PAGE_SIZE = 6;

export function BlogArchive({ posts, locale, initialType = "all", sectionType }: { posts: BlogPost[]; locale: Locale; initialType?: BlogFilter; sectionType?: BlogPost["type"] }) {
  const copy = blogCopy[locale];
  const [page, setPage] = useState(1);
  const filtered = selectBlogPosts(posts, locale, { type: sectionType ?? initialType, sort: "newest" });
  const sectionId = sectionType ? `journal-${sectionType}` : "archive";
  const title = sectionType ? copy[sectionType] : copy.archive;
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const number = (n: number) => n.toLocaleString(locale === "fa" ? "fa-IR" : "en-GB");

  return <section className="journal-archive" id={sectionId} aria-labelledby={`${sectionId}-title`}>
    <div className="journal-section-heading"><h2 id={`${sectionId}-title`}>{title}</h2></div>
    {filtered.length > 0 ? <div className="journal-grid">{filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((post) => <article className="journal-card" key={post.slug}>
      <Link href={blogHref(post, locale)} className="journal-card-image" aria-label={post.title[locale]}><Image src={blogImage(post)} alt="" fill sizes="(max-width: 640px) 100vw, (max-width: 950px) 50vw, 380px" /></Link>
      <div className="journal-card-body"><h3><Link href={blogHref(post, locale)}>{post.title[locale]}</Link></h3><div className="journal-meta"><time dateTime={post.date} aria-label={`${copy.published}: ${blogDate(post.date, locale)}`}>{blogDate(post.date, locale)}</time></div><p>{post.excerpt[locale]}</p></div>
    </article>)}</div> : <div className="journal-empty"><span aria-hidden="true">⌕</span><h3>{copy.empty}</h3></div>}
    {pages > 1 && <nav className="journal-pagination" aria-label={locale === "fa" ? "صفحه‌بندی مطالب" : "Story pagination"}><button disabled={page === 1} onClick={() => setPage(page - 1)}>{copy.previous}</button><span aria-live="polite">{copy.page} {number(page)} {copy.of} {number(pages)}</span><button disabled={page === pages} onClick={() => setPage(page + 1)}>{copy.next}</button></nav>}
  </section>;
}
