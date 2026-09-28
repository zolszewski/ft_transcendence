"use client";

import type { RefObject } from "react";
import { useRef, useState, type ChangeEvent } from "react";
import { ImagePlus, Link as LinkIcon } from "lucide-react";
import { validateUpload } from "@/lib/validateUpload";



type MenuProps = {
  editorRef: RefObject<HTMLDivElement | null>;
  onImageUpload: (file: File) => Promise<string | null>;
};

const headingOptions = ["H1", "H2", "H3"] as const;

export default function Menu({ editorRef, onImageUpload }: MenuProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState("");
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

    const error = await validateUpload(file, "image");
    if (error) {
      setUploadError(error);
      return;
    }
    setUploadError("");

    setUploadingImage(true);
    try {
      const imageUrl = await onImageUpload(file);
      if (imageUrl) applyFormat("insertImage", imageUrl);
    } finally {
      setUploadingImage(false); // also fixes the "stuck disabled" case noted earlier
    }
  }
  return (
    <div className="editor-toolbar">
      <button
        type="button"
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => applyFormat("bold")}
        className="editor-toolbar-btn font-bold"
        aria-label="Bold"
      >
        B
      </button>
      <button
        type="button"
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => applyFormat("italic")}
        className="editor-toolbar-btn italic"
        aria-label="Italic"
      >
        I
      </button>
      <button
        type="button"
        onMouseDown={(event) => event.preventDefault()}
        onClick={addLink}
        className="editor-toolbar-btn"
        aria-label="Add link"
        title="Add link"
      >
        <LinkIcon size={18} aria-hidden="true" />
      </button>
      <button
        type="button"
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => imageInputRef.current?.click()}
        className="editor-toolbar-btn"
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
      {uploadError ? (
        <p role="alert" className="w-full text-sm text-red-600">{uploadError}</p>
      ) : null}
      {headingOptions.map((heading) => (
        <button
          key={heading}
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => applyFormat("formatBlock", heading)}
          className={`editor-toolbar-btn ${
            heading === "H1"
              ? "text-lg font-bold"
              : heading === "H2"
                ? "font-bold"
                : "italic"
          }`}
          aria-label={`Heading ${heading.slice(1)}`}
        >
          {heading}
        </button>
      ))}
    </div>
  );
}
