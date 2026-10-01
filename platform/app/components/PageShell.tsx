import { cn } from "@/lib/utils";

type PageShellProps = {
  variant?: "centered" | "dashboard" | "auth";
  width?: "narrow" | "default" | "wide";
  offset?: "none" | "sm" | "lg";
  header?: React.ReactNode;
  className?: string;
  containerClassName?: string;
  children: React.ReactNode;
};

export default function PageShell({
  variant = "centered",
  width = "narrow",
  offset = "lg",
  header,
  className,
  containerClassName,
  children,
}: PageShellProps) {
  if (variant === "auth") {
    return (
      <main className={cn("page-shell-auth", className)}>
        <div className={cn("page-container page-container--narrow w-full px-6", containerClassName)}>
          {children}
        </div>
      </main>
    );
  }

  if (variant === "dashboard") {
    return (
      <main className={cn("page-shell-dashboard", className)}>
        {header}
        <div
          className={cn(
            "page-container page-container--wide mx-auto px-4 py-8",
            containerClassName,
          )}
        >
          {children}
        </div>
      </main>
    );
  }

  const widthClass =
    width === "default"
      ? "page-container--default"
      : width === "wide"
        ? "page-container--wide"
        : "page-container--narrow";

  const offsetClass =
    offset === "sm"
      ? "page-container-offset-sm"
      : offset === "lg"
        ? "page-container-offset-lg"
        : "";

  return (
    <main className={cn("page-shell-centered", className)}>
      {header}
      <div
        className={cn(
          "page-container px-4 pb-16",
          widthClass,
          offsetClass,
          containerClassName,
        )}
      >
        {children}
      </div>
    </main>
  );
}
