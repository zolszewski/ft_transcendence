import NavLink from "@/components/NavLink";

type LoginToCommentPromptProps = {
  loginHref: string;
};

export default function LoginToCommentPrompt({ loginHref }: LoginToCommentPromptProps) {
  return (
    <div className="section-divider">
      <p className="text-sm text-muted-foreground">
        You must be logged in to leave a comment.
      </p>
      <NavLink href={loginHref} size="sm" className="mt-3">
        Log in to comment
      </NavLink>
    </div>
  );
}
