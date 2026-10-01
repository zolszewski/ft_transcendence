import Link from "next/link";
import type { Article } from "@/lib/types";
import { getArticleMiniatureFocus, getArticleMiniatureUrl } from "@/lib/articleUtils";
import ArticleMiniature from "@/components/ArticleMiniature";
import ArticlePreviewContent from "@/components/ArticlePreviewContent";
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
  const miniatureFocus = getArticleMiniatureFocus(article);

  return (
    <Card className="overflow-hidden rounded-none py-0 transition-opacity hover:ring-foreground/20">
      {miniatureUrl ? (
        <Link href={href} className="block">
          <ArticleMiniature
            src={miniatureUrl}
            title={article.title}
            size="thumb"
            className="rounded-none"
            focus={miniatureFocus}
          />
        </Link>
      ) : null}
      <ArticlePreviewContent article={article} href={href} />
    </Card>
  );
}
