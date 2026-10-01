import { cn } from "@/lib/utils";

type ArticleMiniatureProps = {
  src: string;
  title: string;
  size?: "thumb" | "hero";
  className?: string;
  focus?: { x: number; y: number };
};

export default function ArticleMiniature({
  src,
  title,
  size = "thumb",
  className,
  focus,
}: ArticleMiniatureProps) {
  return (
    <img
      src={src}
      alt={`Miniature for ${title}`}
      className={cn(
        size === "hero" ? "article-miniature-hero" : "article-miniature-thumb",
        className,
      )}
      style={
        focus
          ? { objectPosition: `${focus.x}% ${focus.y}%` }
          : undefined
      }
    />
  );
}
