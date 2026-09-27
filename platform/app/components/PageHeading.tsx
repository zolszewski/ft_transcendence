type PageHeadingProps = {
  title: string;
  description?: string;
};

export default function PageHeading({ title, description }: PageHeadingProps) {
  return (
    <div>
      <h1 className="text-3xl font-bold">{title}</h1>
      {description ? (
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}
