import { cn } from "@/lib/utils";

type ArticleMiniatureProps = {
  src: string;
  title: string;
  size?: "thumb" | "hero";
  className?: string;
};

export default function ArticleMiniature({
  src,
  title,
  size = "thumb",
  className,
}: ArticleMiniatureProps) {
  return (
    <img
      src={src}
      alt={`Miniature for ${title}`}
      className={cn(
        size === "hero" ? "article-miniature-hero" : "article-miniature-thumb",
        className,
      )}
    />
  );
}
