import { cn } from "@/lib/utils";

type AppHeaderProps = {
  variant?: "floating" | "bordered";
  left?: React.ReactNode;
  center?: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
};

export default function AppHeader({
  variant = "floating",
  left,
  center,
  right,
  className,
}: AppHeaderProps) {
  return (
    <header
      className={cn(
        variant === "bordered" ? "app-header-bordered" : "app-header-floating",
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">{left}</div>
      {center ? <div className="shrink-0 px-4 text-center">{center}</div> : null}
      <div className="flex flex-1 items-center justify-end gap-2">{right}</div>
    </header>
  );
}
