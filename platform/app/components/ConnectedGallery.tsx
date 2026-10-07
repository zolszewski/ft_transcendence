"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { apiClient } from "@/lib/apiClient";
import {
  getArticleMiniatureFocus,
  getArticleMiniatureUrl,
  hasAuthorMiniature,
} from "@/lib/articleUtils";
import type { Article } from "@/lib/types";

type NodeInput = {
  src: string;
  title: string;
  articleId: string;
  objectPosition?: string;
};

type LaidOutNode = NodeInput & {
  x: number;
  y: number;
  depth: number;
};

const GALLERY_SLOT_COUNT = 10;
const EXPLORE_PAGE_SIZE = 50;

function randomIndex(maxInclusive: number): number {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const buffer = new Uint32Array(1);
    crypto.getRandomValues(buffer);
    return buffer[0] % (maxInclusive + 1);
  }
  return Math.floor(Math.random() * (maxInclusive + 1));
}

function pickRandomNodes(pool: readonly NodeInput[], count: number): NodeInput[] {
  if (pool.length === 0) return [];
  const indices = pool.map((_, index) => index);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = randomIndex(i);
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  const take = Math.min(count, indices.length);
  return indices.slice(0, take).map((index) => ({ ...pool[index] }));
}

function articlesToGalleryPool(articles: Article[]): NodeInput[] {
  const nodes: NodeInput[] = [];
  for (const article of articles) {
    if (!hasAuthorMiniature(article)) continue;
    const src = getArticleMiniatureUrl(article);
    if (!src) continue;
    const focus = getArticleMiniatureFocus(article);
    nodes.push({
      src,
      title: article.title,
      articleId: article.id,
      objectPosition: `${focus.x}% ${focus.y}%`,
    });
  }
  return nodes;
}

async function fetchPublishedArticlesWithMiniature(): Promise<Article[]> {
  const collected: Article[] = [];
  let page = 1;

  for (;;) {
    const result = await apiClient.articles.explore({
      sort: "newest",
      page,
      limit: EXPLORE_PAGE_SIZE,
    });
    if (!result.success) break;

    collected.push(...result.data.data.filter(hasAuthorMiniature));

    if (!result.data.hasNext) break;
    page += 1;
  }

  return collected;
}

const EXCLUSION_ZONE: [number, number, number, number] = [32, 68, 35, 65];
const MIN_DISTANCE = 16;
const MARGIN = 8;

function distance(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function inExclusionZone(x: number, y: number) {
  const [minX, maxX, minY, maxY] = EXCLUSION_ZONE;
  return x > minX && x < maxX && y > minY && y < maxY;
}

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

function generateEdges(nodes: LaidOutNode[]): [number, number][] {
  const edges: [number, number][] = [];
  for (let i = 0; i < nodes.length - 1; i++) {
    edges.push([i, i + 1]);
  }
  return edges;
}

const MAX_PARALLAX = 45;
const PARALLAX_SPEED = 1.4;

export default function ConnectedGallery() {
  const pathname = usePathname();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const targetOffset = useRef({ x: 0, y: 0 });
  const raf = useRef<number | undefined>(undefined);
  const [layout, setLayout] = useState<LaidOutNode[] | null>(null);
  const [edges, setEdges] = useState<[number, number][]>([]);

  useEffect(() => {
    if (pathname !== "/") return;

    let cancelled = false;

    void (async () => {
      const articles = await fetchPublishedArticlesWithMiniature();
      if (cancelled) return;

      const pool = articlesToGalleryPool(articles);
      const nodes = pickRandomNodes(pool, GALLERY_SLOT_COUNT);
      if (nodes.length === 0) {
        setLayout([]);
        setEdges([]);
        return;
      }

      const laidOut = generateLayout(nodes);
      if (cancelled) return;
      setLayout(laidOut);
      setEdges(generateEdges(laidOut));
    })();

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const hasFinePointer = window.matchMedia("(pointer: fine)").matches;
    if (prefersReducedMotion || !hasFinePointer) return;

    const handleMove = (e: MouseEvent) => {
      const normalizedX = e.clientX / window.innerWidth - 0.5;
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

  if (!layout || layout.length === 0) return null;

  return (
    <div
      ref={wrapRef}
      className="pointer-events-none absolute inset-0 overflow-hidden select-none"
    >
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

      {layout.map((node) => {
        const positionStyle = {
          left: `${node.x}%`,
          top: `${node.y}%`,
          transform: `translate(-50%, -50%) translate(${offset.x * node.depth}px, ${
            offset.y * node.depth
          }px)`,
        };

        return (
          <Link
            key={node.articleId}
            href={`/explore/${node.articleId}`}
            className="pointer-events-auto absolute flex flex-col items-center no-underline hover:opacity-90"
            style={positionStyle}
            aria-label={node.title}
          >
            <img
              src={node.src}
              alt=""
              className="h-16 w-16 rounded-none border border-black/10 object-cover shadow-sm md:h-20 md:w-20"
              style={
                node.objectPosition
                  ? { objectPosition: node.objectPosition }
                  : undefined
              }
              draggable={false}
            />
            <figcaption className="mt-1.5 max-w-[7rem] text-center text-[10px] leading-tight text-black">
              {node.title}
            </figcaption>
          </Link>
        );
      })}
    </div>
  );
}
