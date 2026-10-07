"use client";
 
import { useEffect, useRef, useState } from "react";
 
/**
 * ---------------------------------------------------------------
 * Data
 * ---------------------------------------------------------------
 * Swap these entries out for your real gallery. Positions are no
 * longer fixed here — they're generated randomly on every mount
 * (see `generateLayout` below), so just supply the image + title.
 * ---------------------------------------------------------------
 */
type NodeInput = {
  src: string;
  title: string;
};
 
type LaidOutNode = NodeInput & {
  x: number;
  y: number;
  depth: number;
};
 
const NODES: NodeInput[] = [
  { src: "/items/Dhyani.jpg", title: "The Dhyani Buddha Akshobhya, Tibetan thangka, 13th c." },
  { src: "/items/003.jpg", title: "Poster par Tadanori Yokoo, Japan, 70s" },
  { src: "/items/0700505.jpg", title: "NASA illustration on Apollo Saturn V, USA, 1967" },
  { src: "/items/anonymous.jpg", title: "Anonymous on Occupy Wall Street movement, USA, 2012" },
  { src: "/items/1338.jpg", title: "Pioneer plaque on Pioneer 10, USA, 1972" },
  { src: "/items/poulpe.jpg", title: "Fact Check Arabic, Reuters, 2020" },
  { src: "/items/virgen.jpg", title: "La virgen de la Soledad de Cristóbal de Villalpando, Mexico, 17th c." },
  { src: "/items/palestine.jpg", title: "Palestine Perspectives, October 1984" },
  { src: "/items/fresca.JPG", title: "Tamar fresco in Vardzia, Georgia, 12th c." },
  { src: "/items/sankara.png", title: "Thomas Sankara Discourses, corpus par Daouda Coulibaly" },
  
];
 
// Keep this box clear-ish so nodes don't pile up directly behind the
// hero text. Percent coordinates, [minX, maxX, minY, maxY].
const EXCLUSION_ZONE: [number, number, number, number] = [32, 68, 35, 65];
const MIN_DISTANCE = 16; // minimum spacing between node centers, in %
const MARGIN = 8; // keep nodes this far from the viewport edges, in %
 
function distance(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
 
function inExclusionZone(x: number, y: number) {
  const [minX, maxX, minY, maxY] = EXCLUSION_ZONE;
  return x > minX && x < maxX && y > minY && y < maxY;
}
 
// Places nodes randomly, rejecting spots that are too close to another
// node or that fall in the exclusion zone behind the hero text.
function generateLayout(nodes: NodeInput[]): LaidOutNode[] {
  const placed: LaidOutNode[] = [];
 
  for (const node of nodes) {
    let x = 50;
    let y = 50;
    let attempts = 0;
    let ok = false;
 
    while (attempts < 60 && !ok) {
      x = MARGIN + Math.random() * (100 - MARGIN * 2);
      y = MARGIN + Math.random() * (100 - MARGIN * 2);
      const clearOfZone = !inExclusionZone(x, y);
      const clearOfNodes = placed.every((p) => distance(p, { x, y }) >= MIN_DISTANCE);
      ok = clearOfZone && clearOfNodes;
      attempts++;
    }
 
    placed.push({ ...node, x, y, depth: Math.random() * 1.6 - 0.8 });
  }
 
  return placed;
}
 
// Connects each node to the next one in sequence — a single chain
// running through every image, so all of them end up linked without
// a dense full mesh.
function generateEdges(nodes: LaidOutNode[]): [number, number][] {
  const edges: [number, number][] = [];
  for (let i = 0; i < nodes.length - 1; i++) {
    edges.push([i, i + 1]);
  }
  return edges;
}
 
// Max drift in pixels for the frontmost images. Depth scales this per
// node, so background images barely move and foreground ones drift more.
const MAX_PARALLAX = 45;
// Pixels moved per frame toward the target offset — constant speed,
// not eased, so the motion reads as linear rather than a spring settle.
const PARALLAX_SPEED = 1.4;
 
export default function ConnectedGallery() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const targetOffset = useRef({ x: 0, y: 0 });
  const raf = useRef<number | undefined>(undefined);
 
  // Positions involve Math.random(), so they're generated client-side
  // only, after mount — doing this during render would produce a
  // different layout on the server vs. the client and trigger a
  // hydration mismatch. This also means a fresh layout on every
  // full page load/reload, per the brief.
  const [layout, setLayout] = useState<LaidOutNode[] | null>(null);
  const [edges, setEdges] = useState<[number, number][]>([]);
 
  useEffect(() => {
    const nodes = generateLayout(NODES);
    setLayout(nodes);
    setEdges(generateEdges(nodes));
  }, []);
 
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const hasFinePointer = window.matchMedia("(pointer: fine)").matches;
    if (prefersReducedMotion || !hasFinePointer) return;
 
    const handleMove = (e: MouseEvent) => {
      const normalizedX = e.clientX / window.innerWidth - 0.5; // -0.5 .. 0.5
      const normalizedY = e.clientY / window.innerHeight - 0.5;
      targetOffset.current = {
        x: normalizedX * 2 * MAX_PARALLAX,
        y: normalizedY * 2 * MAX_PARALLAX,
      };
    };
 
    const step = (current: number, target: number) => {
      const diff = target - current;
      if (Math.abs(diff) <= PARALLAX_SPEED) return target;
      return current + Math.sign(diff) * PARALLAX_SPEED;
    };
 
    const tick = () => {
      setOffset((current) => ({
        x: step(current.x, targetOffset.current.x),
        y: step(current.y, targetOffset.current.y),
      }));
      raf.current = requestAnimationFrame(tick);
    };
 
    window.addEventListener("mousemove", handleMove);
    raf.current = requestAnimationFrame(tick);
 
    return () => {
      window.removeEventListener("mousemove", handleMove);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, []);
 
  // Nothing to draw until the client-side layout is generated.
  if (!layout) return null;
 
  return (
    <div
      ref={wrapRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden select-none"
    >
      {/* connecting lines, anchored to each node's fixed base position —
          these never move, so the network reads as a stable map even
          while the images parallax-drift above it */}
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {edges.map(([a, b], i) => (
          <line
            key={i}
            x1={layout[a].x}
            y1={layout[a].y}
            x2={layout[b].x}
            y2={layout[b].y}
            stroke="#00000030"
            strokeWidth="0.15"
          />
        ))}
        {layout.map((node, i) => (
          <circle key={i} cx={node.x} cy={node.y} r="0.4" fill="#00000055" />
        ))}
      </svg>
 
      {layout.map((node, i) => (
        <figure
          key={i}
          className="absolute flex flex-col items-center"
          style={{
            left: `${node.x}%`,
            top: `${node.y}%`,
            transform: `translate(-50%, -50%) translate(${offset.x * node.depth}px, ${
              offset.y * node.depth
            }px)`,
          }}
        >
          <img
            src={node.src}
            alt={node.title}
            className="h-16 w-16 rounded-sm border border-black/10 object-cover shadow-sm md:h-20 md:w-20"
            draggable={false}
          />
          <figcaption className="mt-1.5 max-w-[7rem] text-center text-[10px] leading-tight text-black">
            {node.title}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
