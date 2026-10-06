import Image from "next/image";
import { BlogArchive } from "@/components/blog-archive";
import { BlogNavigation } from "@/components/blog-navigation";
import { ConsultationForm } from "@/components/consultation-request-form";
import { SiteShell } from "@/components/site-shell";
import { articles, type Locale } from "@/lib/site-content";
import { blogCopy, selectBlogPosts, type BlogFilter } from "@/lib/blog-content";
import { blogGuides } from "@/lib/blog-guides";
import "@/app/blog.css";

export function BlogPage({ locale }: { locale: Locale; initialType?: BlogFilter }) {
  const copy = blogCopy[locale];
  const posts = selectBlogPosts([...articles, ...blogGuides], locale);
  const sections = ["news", "article", "guide"] as const;
  return <SiteShell locale={locale}><main className="journal-page">
    <section className="journal-campus-hero" aria-label={copy.title}><Image src="/blog/classical-campus.png" alt="" fill sizes="100vw" preload/><div aria-hidden="true" className="journal-campus-overlay"/><p dir="ltr">JAHAN ACADEMY</p></section>
    <div className="shell">
      <div className="journal-guide-content">
        <BlogNavigation title={copy.title} items={sections.map(type => ({ id: `journal-${type}`, label: copy[type] }))}/>
        <header className="journal-intro"><p>{copy.intro}</p><div className="journal-intro-line"><span>{copy.eyebrow}</span></div></header>
        {sections.map(type => <BlogArchive key={type} posts={posts} locale={locale} sectionType={type}/>)}
      </div>
      <section className="journal-consultation" id="journal-consultation"><header><h2>{copy.help}</h2><p>{copy.guideText}</p></header><div className="journal-consultation-grid"><div className="journal-consultation-image"><Image src="/journey/profile-assessment.png" alt={copy.help} fill sizes="(max-width:800px) 100vw, 50vw"/></div><ConsultationForm locale={locale} source={`/${locale}/articles#journal-consultation`}/></div></section>
      <p className="journal-preview-note">{copy.note}</p>
    </div>
  </main></SiteShell>;
}
