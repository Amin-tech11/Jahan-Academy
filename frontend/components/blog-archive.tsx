"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { blogCopy, blogDate, blogHref, blogImage, selectBlogPosts, type BlogFilter, type BlogPost, type BlogSort } from "@/lib/blog-content";
import type { Locale } from "@/lib/site-content";

const PAGE_SIZE = 6;

export function BlogArchive({ posts, locale, initialType = "all" }: { posts: BlogPost[]; locale: Locale; initialType?: BlogFilter }) {
  const copy = blogCopy[locale];
  const [type, setType] = useState<BlogFilter>(initialType);
  const [sort, setSort] = useState<BlogSort>("newest");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const filtered = selectBlogPosts(posts, locale, { type, sort, query });
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const number = (n: number) => n.toLocaleString(locale === "fa" ? "fa-IR" : "en-GB");
  const reset = () => { setType("all"); setSort("newest"); setQuery(""); setPage(1); };

  return <section className="journal-archive" id="archive" aria-labelledby="archive-title">
    <div className="journal-section-heading"><div><span className="journal-kicker">JOURNAL / STORIES</span><h2 id="archive-title">{copy.archive}</h2></div><span className="journal-result-count" role="status" aria-live="polite">{number(filtered.length)} {copy.results}</span></div>
    <div className="journal-controls">
      <div className="journal-filters" role="group" aria-label={locale === "fa" ? "نوع مطلب" : "Story type"}>
        {(["all", "article", "news"] as const).map((value) => <button type="button" key={value} aria-pressed={type === value} onClick={() => { setType(value); setPage(1); }}>{copy[value]}</button>)}
      </div>
      <label className="journal-search"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="10" cy="10" r="6.5" stroke="currentColor" strokeWidth="1.5"/><path d="m15 15 6 6" stroke="currentColor" strokeWidth="1.5"/></svg><span className="journal-sr-only">{copy.search}</span><input type="search" value={query} maxLength={100} placeholder={copy.placeholder} onChange={(event) => { setQuery(event.target.value); setPage(1); }}/></label>
      <label className="journal-sort"><span>{copy.sort}</span><select value={sort} onChange={(event) => { setSort(event.target.value as BlogSort); setPage(1); }}><option value="newest">{copy.newest}</option><option value="oldest">{copy.oldest}</option></select></label>
    </div>
    {filtered.length > 0 ? <div className="journal-grid">{filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((post) => <article className="journal-card" key={post.slug}>
      <Link href={blogHref(post, locale)} className="journal-card-image" tabIndex={-1} aria-hidden="true"><Image src={blogImage(post)} alt="" fill sizes="(max-width: 640px) 100vw, (max-width: 950px) 50vw, 380px" /><span className="journal-image-arrow">↗</span></Link>
      <div className="journal-card-body"><div className="journal-meta"><span className="journal-tag">{copy[post.type]}</span><time dateTime={post.date}>{blogDate(post.date, locale)}</time></div><h3><Link href={blogHref(post, locale)}>{post.title[locale]}</Link></h3><p>{post.excerpt[locale]}</p><Link className="journal-read" href={blogHref(post, locale)} aria-label={`${copy.read}: ${post.title[locale]}`}>{copy.read}<span aria-hidden="true">{locale === "fa" ? "←" : "→"}</span></Link></div>
    </article>)}</div> : <div className="journal-empty"><span aria-hidden="true">⌕</span><h3>{copy.empty}</h3><p>{copy.emptyHint}</p><button type="button" onClick={reset}>{copy.reset}</button></div>}
    {pages > 1 && <nav className="journal-pagination" aria-label={locale === "fa" ? "صفحه‌بندی مطالب" : "Story pagination"}><button disabled={page === 1} onClick={() => setPage(page - 1)}>{copy.previous}</button><span aria-live="polite">{copy.page} {number(page)} {copy.of} {number(pages)}</span><button disabled={page === pages} onClick={() => setPage(page + 1)}>{copy.next}</button></nav>}
  </section>;
}
