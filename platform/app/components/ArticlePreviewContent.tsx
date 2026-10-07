import Link from "next/link";
import { getArticleDisplayAbstract } from "@/lib/articleAbstract";
import type { Article } from "@/lib/types";

type ArticlePreviewContentProps = {
  article: Article;
  href?: string;
  showAuthor?: boolean;
  children?: React.ReactNode;
};

export default function ArticlePreviewContent({
  article,
  href,
  showAuthor = true,
  children,
}: ArticlePreviewContentProps) {
  const displayAbstract = getArticleDisplayAbstract(article);

  return (
    <div className="p-4">
      {href ? (
        <Link href={href} className="block font-bold hover:underline">
          {article.title}
        </Link>
      ) : (
        <h3 className="font-bold">{article.title}</h3>
      )}

      <p className="article-list-meta">
        {showAuthor ? <>par {article.author.name} · </> : null}
        {new Date(article.createdAt).toLocaleDateString()}
      </p>

      {displayAbstract ? (
        <p className="article-list-abstract">{displayAbstract}</p>
      ) : null}

      {children}
    </div>
  );
}
