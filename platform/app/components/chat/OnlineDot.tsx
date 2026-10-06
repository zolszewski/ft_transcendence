//green dot if online, grey otherwise
//color alone isn't enough (colorblind, screen readers), so there's hidden "online"/"offline" text too
export default function OnlineDot({ online }: { online: boolean }) {
  return (
    <span
      className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${online ? "bg-green-500" : "bg-gray-300"}`}
      title={online ? "online" : "offline"}
    >
      <span className="sr-only">{online ? "online" : "offline"}</span>
    </span>
  );
}
