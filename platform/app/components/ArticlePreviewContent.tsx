import Link from "next/link";
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
        {showAuthor ? <>by {article.author.name} · </> : null}
        {new Date(article.createdAt).toLocaleDateString()}
      </p>

      {article.abstract ? (
        <p className="article-list-abstract">{article.abstract}</p>
      ) : null}

      {children}
    </div>
  );
}
