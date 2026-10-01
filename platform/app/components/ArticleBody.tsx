"use client";

import DOMPurify from "dompurify";

type ArticleBodyProps = {
  html: string;
  className?: string;
};

export default function ArticleBody({ html, className }: ArticleBodyProps) {
  return (
    <div
      className={className ?? "article-content article-body"}
      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }}
    />
  );
}
