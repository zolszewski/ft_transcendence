"use client";

import type { RefObject } from "react";

type MenuProps = {
  editorRef: RefObject<HTMLDivElement | null>;
};

const headingOptions = ["H1", "H2", "H3"] as const;

export default function Menu({ editorRef }: MenuProps) {
  function applyFormat(command: string, value?: string) {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
  }

  return (
    <div className="flex flex-wrap items-center gap-2 border border-b-0 bg-gray-50 p-3">
      <button
        type="button"
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => applyFormat("bold")}
        className="border px-3 py-2 font-bold hover:bg-white"
        aria-label="Bold"
      >
        B
      </button>
      <button
        type="button"
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => applyFormat("italic")}
        className="border px-3 py-2 italic hover:bg-white"
        aria-label="Italic"
      >
        I
      </button>
      {headingOptions.map((heading) => (
        <button
          key={heading}
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => applyFormat("formatBlock", heading)}
          className={`border px-3 py-2 hover:bg-white ${
            heading === "H1" ? "text-lg font-bold" : heading === "H2" ? "font-bold" : "italic"
          }`}
          aria-label={`Heading ${heading.slice(1)}`}
        >
          {heading}
        </button>
      ))}
    </div>
  );
}