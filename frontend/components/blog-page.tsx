import Image from "next/image";
import Link from "next/link";
import { BlogArchive } from "@/components/blog-archive";
import { BlogNavigation } from "@/components/blog-navigation";
import { HomeFaq } from "@/components/home-faq";
import { ConsultationForm } from "@/components/consultation-request-form";
import { SiteShell } from "@/components/site-shell";
import { articles, type Locale } from "@/lib/site-content";
import { blogCopy, blogDate, blogHref, blogImage, selectBlogPosts, type BlogFilter } from "@/lib/blog-content";
import { blogGuides, blogFaq } from "@/lib/blog-guides";
import "@/app/blog.css";

export function BlogPage({ locale, initialType = "all" }: { locale: Locale; initialType?: BlogFilter }) {
  const copy = blogCopy[locale];
  const posts = selectBlogPosts([...articles, ...blogGuides], locale);
  const [featured, ...rest] = posts;
  return <SiteShell locale={locale}><main className="journal-page">
    <section className="journal-campus-hero" aria-label={copy.title}><Image src="/blog/classical-campus.png" alt="" fill sizes="100vw" preload/><div aria-hidden="true" className="journal-campus-overlay"/><p dir="ltr">JAHAN ACADEMY</p></section>
    <div className="shell">
      <nav className="journal-breadcrumb" aria-label={locale === "fa" ? "مسیر صفحه" : "Breadcrumb"}><Link href={`/${locale}`}>{copy.home}</Link><span aria-hidden="true">/</span><span aria-current="page">{copy.title}</span></nav>
      <div className="journal-guide-content">
      <BlogNavigation title={copy.title} items={[{id:"journal-latest",label:copy.latest},{id:"archive",label:copy.archive},{id:"journal-guides",label:copy.guide},{id:"journal-faq",label:copy.faq}]}/>
      <header className="journal-intro"><p>{copy.intro}</p><div className="journal-intro-line"><span>{copy.eyebrow}</span></div></header>
      {featured && <section id="journal-latest" className="journal-featured" aria-label={copy.featured}>
        <Link href={blogHref(featured, locale)} className="journal-cover"><Image src={blogImage(featured)} alt="" fill sizes="(max-width: 800px) 100vw, 750px" preload/><div className="journal-cover-shade"/><div className="journal-cover-copy"><span className="journal-cover-label">{copy.featured}</span><h2>{featured.title[locale]}</h2><p>{featured.excerpt[locale]}</p><div className="journal-cover-bottom"><time dateTime={featured.date}>{blogDate(featured.date, locale)}</time><span>{copy.read} <b aria-hidden="true">{locale === "fa" ? "←" : "→"}</b></span></div></div></Link>
        <aside className="journal-latest"><h2><span className="journal-live-dot"/>{copy.latest}</h2>{rest.slice(0, 2).map((post) => <Link key={post.slug} href={blogHref(post, locale)} className="journal-brief"><div className="journal-brief-image"><Image src={blogImage(post)} alt="" fill sizes="110px"/></div><div><span className="journal-tag">{copy[post.type]}</span><h3>{post.title[locale]}</h3><time dateTime={post.date}>{blogDate(post.date, locale)}</time></div></Link>)}<a className="journal-browse" href="#archive">{copy.all}<span aria-hidden="true">↓</span></a></aside>
      </section>}
      <BlogArchive posts={posts} locale={locale} initialType={initialType}/>
      <section id="journal-guides" className="journal-guide-section"><h2>{copy.guide}</h2><p>{copy.guideText}</p><div className="journal-guide-cards">{blogGuides.map((guide,index)=><article key={guide.slug}><span className="journal-guide-number" aria-hidden="true">{String(index+1).padStart(2,"0")}</span><h3>{guide.title[locale]}</h3><p>{guide.excerpt[locale]}</p><Link href={blogHref(guide,locale)}>{copy.read}<span aria-hidden="true">{locale==="fa"?"←":"→"}</span></Link></article>)}</div></section>
      <section id="journal-faq" className="journal-guide-section journal-faq"><div className="home-faq__grid"><div className="home-faq__intro"><h2>{copy.faq}</h2></div><HomeFaq items={blogFaq[locale]}/></div></section>
      </div>
      <section className="journal-consultation" id="journal-consultation"><header><h2>{copy.help}</h2><p>{copy.guideText}</p></header><div className="journal-consultation-grid"><div className="journal-consultation-image"><Image src="/journey/profile-assessment.png" alt={copy.help} fill sizes="(max-width:800px) 100vw, 50vw"/></div><ConsultationForm locale={locale} source={`/${locale}/articles#journal-consultation`}/></div></section>
      <p className="journal-preview-note">{copy.note}</p>
    </div>
  </main></SiteShell>;
}
