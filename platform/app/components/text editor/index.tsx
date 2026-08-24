"use client";

import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import Menu from "./menu";

export default function TextEditor() {
  const editorRef = useRef<HTMLDivElement>(null);
  const [image, setImage] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    if (!image) {
      setImageUrl("");
      return;
    }

    const url = URL.createObjectURL(image);
    setImageUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [image]);

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    setImage(event.target.files?.[0] ?? null);
  }

  return (
    <div className="w-full">
      <label className="mb-4 flex min-h-32 cursor-pointer items-center justify-center border border-dashed p-4 text-center hover:bg-gray-50">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt="Article miniature"
            className="max-h-32 max-w-full object-contain"
          />
        ) : (
          <span>Import an image for your article</span>
        )}
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="hidden"
        />
      </label>
      <Menu editorRef={editorRef} />
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        data-placeholder="Write your academic work here..."
        className="min-h-96 border bg-white p-6 text-left outline-none empty:before:text-gray-400 empty:before:content-[attr(data-placeholder)]"
      />
    </div>
  );
}