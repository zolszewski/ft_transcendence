import Link from "next/link";
import { cn } from "@/lib/utils";

type NavLinkProps = React.ComponentProps<typeof Link> & {
  size?: "default" | "sm";
};

export default function NavLink({
  className,
  size = "default",
  ...props
}: NavLinkProps) {
  return (
    <Link
      className={cn(size === "sm" ? "btn-nav-sm" : "btn-nav", className)}
      {...props}
    />
  );
}
