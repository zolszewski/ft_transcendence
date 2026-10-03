// pastille verte si en ligne, grise sinon
// la couleur seule ne suffit pas (daltoniens, lecteurs d'écran) : texte caché "online"/"offline" en plus
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
