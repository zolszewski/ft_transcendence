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
      <h2 className="text-xl font-bold">Comments</h2>

      {loading ? (
        <p className="mt-4 text-sm">Loading comments...</p>
      ) : comments.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">No comments yet.</p>
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
