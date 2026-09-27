import Link from "next/link";
import type { Article } from "@/lib/types";
import { getArticleMiniatureUrl } from "@/lib/articleUtils";
import ArticleMiniature from "@/components/ArticleMiniature";
import { Card } from "@/components/ui/card";

type ArticleListLinkItemProps = {
  article: Article;
  href: string;
};

export default function ArticleListLinkItem({
  article,
  href,
}: ArticleListLinkItemProps) {
  const miniatureUrl = getArticleMiniatureUrl(article);

  return (
    <Card className="overflow-hidden py-0 transition-opacity hover:ring-foreground/20">
      <Link href={href} className="block">
        {miniatureUrl ? (
          <ArticleMiniature
            src={miniatureUrl}
            title={article.title}
            size="thumb"
            className="rounded-none"
          />
        ) : null}
      </Link>
      <div className="p-4">
        <Link href={href} className="block font-bold hover:underline">
          {article.title}
        </Link>
        <p className="mt-1 text-sm text-muted-foreground">
          by {article.author.name} ·{" "}
          {new Date(article.createdAt).toLocaleDateString()}
        </p>
        {article.abstract ? (
          <p className="mt-2 text-sm">{article.abstract}</p>
        ) : null}
      </div>
    </Card>
  );
}
