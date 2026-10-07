import NavLink from "@/components/NavLink";

type ConnexionToCommentPromptProps = {
  loginHref: string;
};

export default function ConnexionToCommentPrompt({ loginHref }: ConnexionToCommentPromptProps) {
  return (
    <div className="section-divider">
      <p className="text-sm text-muted-foreground">
        Vous devez être connecté pour laisser un commentaire.
      </p>
      <NavLink href={loginHref} size="sm" className="mt-3">
        Se connecter pour commenter
      </NavLink>
    </div>
  );
}
