// pastille verte si en ligne, grise sinon
export default function OnlineDot({ online }: { online: boolean }) {
  return (
    <span
      className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${online ? "bg-green-500" : "bg-gray-300"}`}
      title={online ? "online" : "offline"}
    />
  );
}
