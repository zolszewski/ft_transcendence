"use client";
 
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import DOMPurify from "dompurify";
import type { ChangeEvent } from "react";
import Menu from "./menu";
 
export type TextEditorHandle = {
  getData: () => { title: string; content: string };
  image: File | null;
};
 
  const TextEditor = forwardRef<TextEditorHandle>(function TextEditor(_props, ref) {
  const editorRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLTextAreaElement>(null);
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

  function getEditorContent() {
    const RawEditorContent = editorRef.current?.innerHTML;
    if (!RawEditorContent) return "";
    return DOMPurify.sanitize(RawEditorContent, { 
      FORBID_TAGS: ["script", "style"],
      FORBID_ATTR: ["style", "onerror", "onclick"],
    });
  }
 
  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    setImage(event.target.files?.[0] ?? null);
  }
 
  useImperativeHandle(ref, () => ({
    getData: () => ({
      title: titleRef.current?.value.trim() ?? "",
      content: getEditorContent(),
    }),
    image,
  }));
 
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
          name= "miniature"
          accept="image/png,image/jpeg,image/webp"
          onChange={handleImageChange}
          className="hidden"
        />
      </label>
      <label className="mb-4 block text-left">
        <span className="mb-2 block font-semibold">Title</span>
        <textarea
          ref={titleRef}
          name="title"
          placeholder="Enter your article title"
          rows={2}
          required
          className="w-full resize-none border bg-white p-4 outline-none focus:ring-2 focus:ring-gray-400"
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
});
 
export default TextEditor;
 
