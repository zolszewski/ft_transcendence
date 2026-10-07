import type { Comment } from "@/lib/types";

type CommentsSectionProps = {
  comments: Comment[];
  loading?: boolean;
};

export default function CommentsSection({
  comments,
  loading = false,
}: CommentsSectionProps) {
  return (
    <section className="section-divider-spaced">
      <h2 className="text-xl font-bold">Commentaires</h2>

      {loading ? (
        <p className="mt-4 text-sm">Chargement des commentaires…</p>
      ) : comments.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">Pas encore de commentaires.</p>
      ) : (
        <ul className="mt-4 space-y-4">
          {comments.map((item) => (
            <li key={item.id} className="comment-card">
              <p className="text-sm font-semibold">{item.author?.name ?? "User"}</p>
              <p className="mt-2 text-sm whitespace-pre-wrap">{item.content}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
