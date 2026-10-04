import Image from "next/image";
import Link from "next/link";
import { BlogArchive } from "@/components/blog-archive";
import { SiteShell } from "@/components/site-shell";
import { articles, type Locale } from "@/lib/site-content";
import { blogCopy, blogDate, blogHref, blogImage, selectBlogPosts, type BlogFilter } from "@/lib/blog-content";
import "@/app/blog.css";

export function BlogPage({ locale, initialType = "all" }: { locale: Locale; initialType?: BlogFilter }) {
  const copy = blogCopy[locale];
  const posts = selectBlogPosts(articles, locale);
  const [featured, ...rest] = posts;
  return <SiteShell locale={locale}><main className="journal-page">
    <div className="shell">
      <nav className="journal-breadcrumb" aria-label={locale === "fa" ? "مسیر صفحه" : "Breadcrumb"}><Link href={`/${locale}`}>{copy.home}</Link><span aria-hidden="true">/</span><span aria-current="page">{copy.title}</span></nav>
      <header className="journal-intro"><span className="journal-kicker">JAHAN ACADEMY / JOURNAL</span><h1>{copy.title}<span className="journal-title-dot" aria-hidden="true">.</span></h1><p>{copy.intro}</p><div className="journal-intro-line"><span>{copy.eyebrow}</span></div></header>
      {featured && <section className="journal-featured" aria-label={copy.featured}>
        <Link href={blogHref(featured, locale)} className="journal-cover"><Image src={blogImage(featured)} alt="" fill sizes="(max-width: 800px) 100vw, 750px" preload/><div className="journal-cover-shade"/><div className="journal-cover-copy"><span className="journal-cover-label">{copy.featured}</span><h2>{featured.title[locale]}</h2><p>{featured.excerpt[locale]}</p><div className="journal-cover-bottom"><time dateTime={featured.date}>{blogDate(featured.date, locale)}</time><span>{copy.read} <b aria-hidden="true">{locale === "fa" ? "←" : "→"}</b></span></div></div></Link>
        <aside className="journal-latest"><h2><span className="journal-live-dot"/>{copy.latest}</h2>{rest.slice(0, 2).map((post) => <Link key={post.slug} href={blogHref(post, locale)} className="journal-brief"><div className="journal-brief-image"><Image src={blogImage(post)} alt="" fill sizes="110px"/></div><div><span className="journal-tag">{copy[post.type]}</span><h3>{post.title[locale]}</h3><time dateTime={post.date}>{blogDate(post.date, locale)}</time></div></Link>)}<a className="journal-browse" href="#archive">{copy.all}<span aria-hidden="true">↓</span></a></aside>
      </section>}
      <BlogArchive posts={posts} locale={locale} initialType={initialType}/>
      <section className="journal-cta"><div><span className="journal-kicker">YOUR NEXT CHAPTER</span><h2>{copy.guides}</h2><p>{copy.guideText}</p></div><Link href={`/${locale}/consultation?source=journal`}>{copy.consultation}<span aria-hidden="true">{locale === "fa" ? "←" : "→"}</span></Link></section>
      <p className="journal-preview-note">{copy.note}</p>
    </div>
  </main></SiteShell>;
}
