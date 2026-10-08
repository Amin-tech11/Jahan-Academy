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
  const title = sectionType ? copy.sectionTitles[sectionType] : copy.archive;
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pages);
  const firstVisiblePage = Math.max(1, Math.min(currentPage - 2, pages - 4));
  const visiblePages = Array.from({ length: Math.min(5, pages) }, (_, index) => firstVisiblePage + index);
  const number = (n: number) => n.toLocaleString(locale === "fa" ? "fa-IR" : "en-GB");

  return <section className="journal-archive" id={sectionId} aria-labelledby={`${sectionId}-title`}>
    <div className="journal-section-heading"><h2 id={`${sectionId}-title`}>{title}</h2></div>
    {filtered.length > 0 ? <div className="journal-grid">{filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE).map((post) => <article className="journal-card" key={post.slug}>
      <Link href={blogHref(post, locale)} className="journal-card-image" aria-label={post.title[locale]}><Image src={blogImage(post)} alt="" fill sizes="(max-width: 640px) 100vw, (max-width: 950px) 50vw, 380px" /></Link>
      <div className="journal-card-body"><h3><Link href={blogHref(post, locale)}>{post.title[locale]}</Link></h3><div className="journal-meta"><time dateTime={post.date} aria-label={`${copy.published}: ${blogDate(post.date, locale)}`}>{blogDate(post.date, locale)}</time></div><p>{post.excerpt[locale]}</p></div>
    </article>)}</div> : <div className="journal-empty"><span aria-hidden="true">⌕</span><h3>{copy.empty}</h3></div>}
    {filtered.length > 0 && <nav className="journal-pagination" aria-label={`${locale === "fa" ? "صفحه‌بندی" : "Pagination"} — ${title}`}>
      <button className="journal-page-arrow" disabled={currentPage === 1} aria-label={copy.previous} onClick={() => setPage(currentPage - 1)}><span aria-hidden="true">{locale === "fa" ? "›" : "‹"}</span></button>
      {firstVisiblePage > 1 && <><button onClick={() => setPage(1)} aria-label={`${copy.page} ${number(1)}`}>{number(1)}</button>{firstVisiblePage > 2 && <span aria-hidden="true">…</span>}</>}
      {visiblePages.map(value => <button key={value} aria-label={`${copy.page} ${number(value)}`} aria-current={value === currentPage ? "page" : undefined} onClick={() => setPage(value)}>{number(value)}</button>)}
      {visiblePages[visiblePages.length - 1] < pages && <><span aria-hidden="true">…</span><button onClick={() => setPage(pages)}>{locale === "fa" ? "آخرین" : "Last"}</button></>}
      <button className="journal-page-arrow" disabled={currentPage === pages} aria-label={copy.next} onClick={() => setPage(currentPage + 1)}><span aria-hidden="true">{locale === "fa" ? "‹" : "›"}</span></button>
      <span className="journal-sr-only" role="status">{copy.page} {number(currentPage)} {copy.of} {number(pages)}</span>
    </nav>}
  </section>;
}
