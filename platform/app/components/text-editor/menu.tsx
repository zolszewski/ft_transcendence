"use client";

import type { RefObject } from "react";
import { useRef, useState, type ChangeEvent } from "react";
import { ImagePlus, Link as LinkIcon } from "lucide-react";

type MenuProps = {
  editorRef: RefObject<HTMLDivElement | null>;
  onImageUpload: (file: File) => Promise<string | null>;
};

const headingOptions = ["H1", "H2", "H3"] as const;

export default function Menu({ editorRef, onImageUpload }: MenuProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  function applyFormat(command: string, value?: string) {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
  }

  function addLink() {
    const url = window.prompt("Enter a URL");
    if (url?.trim()) applyFormat("createLink", url.trim());
  }

  async function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setUploadingImage(true);
    const imageUrl = await onImageUpload(file);
    if (imageUrl) 
      applyFormat("insertImage", imageUrl);
    setUploadingImage(false);
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
      <button
        type="button"
        onMouseDown={(event) => event.preventDefault()}
        onClick={addLink}
        className="border p-2 hover:bg-white"
        aria-label="Add link"
        title="Add link"
      >
        <LinkIcon size={18} aria-hidden="true" />
      </button>
      <button
        type="button"
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => imageInputRef.current?.click()}
        className="border p-2 hover:bg-white"
        aria-label="Add image"
        title="Add image"
        disabled={uploadingImage}
      >
        <ImagePlus size={18} aria-hidden="true" />
      </button>
      <input
        ref={imageInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={handleImageChange}
        className="hidden"
      />
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