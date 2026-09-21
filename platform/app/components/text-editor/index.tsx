"use client";
 
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import DOMPurify from "dompurify";
import type { ChangeEvent } from "react";
import Menu from "./menu";
import { Eye, EyeOff, Upload } from "lucide-react";
 
export type TextEditorHandle = {
  getData: () => { title: string; content: string };
  image: File | null;
  clearImage: () => void;
};

type TextEditorProps = {
  initialData?: { title: string; content: string };
  initialImageUrl?: string;
  onChange?: (data: { title: string; content: string }) => void;
  onImageUpload: (file: File) => Promise<string | null>;
};
 
  const TextEditor = forwardRef<TextEditorHandle, TextEditorProps>(
    function TextEditor({ initialData,
    initialImageUrl,
    onChange,
    onImageUpload },
    ref) {
  const editorRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const hasEditedRef = useRef(false);
  const [image, setImage] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [showMiniaturePreview, setShowMiniaturePreview] = useState(false);
  const [miniaturePosition, setMiniaturePosition] = useState({ x: 50, y: 50 });
  const miniatureInputRef = useRef<HTMLInputElement>(null);
  const miniatureDragRef = useRef<{ x: number; y: number; position: { x: number; y: number } } | null>(null);
 
  useEffect(() => {
    if (!image) {
      setImageUrl("");
      return;
    }
    const url = URL.createObjectURL(image);
    setImageUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

  useEffect(() => {
    if (hasEditedRef.current) return;
    if (titleRef.current) titleRef.current.value = initialData?.title ?? "";
    if (editorRef.current) editorRef.current.innerHTML = initialData?.content ?? "";
  }, [initialData?.content, initialData?.title]);

  function getEditorContent() {
    const RawEditorContent = editorRef.current?.innerHTML;
    if (!RawEditorContent) return "";
    return DOMPurify.sanitize(RawEditorContent, {
      FORBID_TAGS: ["script", "style"],
      FORBID_ATTR: ["onerror", "onclick"],
    });
  }
 
  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    setImage(event.target.files?.[0] ?? null);
    setMiniaturePosition({ x: 50, y: 50 });
    event.target.value = "";
  }

  function notifyChange() {
    hasEditedRef.current = true;
    onChange?.({
      title: titleRef.current?.value ?? "",
      content: getEditorContent(),
    });
  }

  function handleMiniaturePointerDown(event: React.PointerEvent<HTMLLabelElement>) {
    if (!showMiniaturePreview || !imageUrl) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    miniatureDragRef.current = {
      x: event.clientX,
      y: event.clientY,
      position: miniaturePosition,
    };
  }

  function handleMiniaturePointerMove(event: React.PointerEvent<HTMLLabelElement>) {
    const drag = miniatureDragRef.current;
    if (!drag || !imageUrl) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    setMiniaturePosition({
      x: Math.max(0, Math.min(100, drag.position.x - ((event.clientX - drag.x) / bounds.width) * 100)),
      y: Math.max(0, Math.min(100, drag.position.y - ((event.clientY - drag.y) / bounds.height) * 100)),
    });
  }

  function stopMiniatureDrag(event: React.PointerEvent<HTMLLabelElement>) {
    miniatureDragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }
 
  useImperativeHandle(ref, () => ({
    getData: () => ({
      title: titleRef.current?.value.trim() ?? "",
      content: getEditorContent(),
    }),
    image,
    clearImage: () => setImage(null),
  }));
 
  return (
    <div className="w-full">
      <div className="mb-4 flex items-start gap-2">
        <label
          className="relative flex aspect-square min-h-32 flex-1 cursor-pointer items-center justify-center overflow-hidden border border-dashed p-4 text-center hover:bg-gray-50"
          onPointerDown={handleMiniaturePointerDown}
          onPointerMove={showMiniaturePreview ? handleMiniaturePointerMove : undefined}
          onPointerUp={stopMiniatureDrag}
          onPointerCancel={stopMiniatureDrag}
        >
        {imageUrl || initialImageUrl ? (
            <img
            src={imageUrl || initialImageUrl}
            alt="Article miniature"
            className={
              showMiniaturePreview
                ? "absolute h-full w-full object-cover"
                : "max-h-32 max-w-full object-contain"
            }
            style={
              showMiniaturePreview
                ? {
                    objectPosition: `${miniaturePosition.x}% ${miniaturePosition.y}%`,
                  }
                : undefined
            }
          />
        ) : (
          <span>Import an image for your article</span>
        )}
          <input
            ref={miniatureInputRef}
            type="file"
            name="miniature"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleImageChange}
            className="hidden"
          />
        </label>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => setShowMiniaturePreview((visible) => !visible)}
            disabled={!imageUrl}
            className="border p-2 hover:bg-gray-50 disabled:opacity-50"
            aria-label={showMiniaturePreview ? "Hide miniature preview" : "Preview miniature"}
            title={showMiniaturePreview ? "Hide miniature preview" : "Preview miniature"}
          >
            {showMiniaturePreview ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
          </button>
          <button
            type="button"
            onClick={() => miniatureInputRef.current?.click()}
            className="flex items-center gap-1 border px-2 py-1 text-sm hover:bg-gray-50"
            aria-label="Change miniature"
            title="Change miniature"
          >
            <Upload size={16} aria-hidden="true" />
            Change
          </button>
        </div>
      </div>
      <label className="mb-4 block text-left">
        <span className="mb-2 block font-semibold">Title</span>
        <textarea
          ref={titleRef}
          name="title"
          placeholder="Enter your article title"
          rows={2}
          required
          className="w-full resize-none border bg-white p-4 outline-none focus:ring-2 focus:ring-gray-400"
          onInput={notifyChange}
        />
      </label>
      <Menu editorRef={editorRef} onImageUpload={onImageUpload} />
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        data-placeholder="Write your academic work here..."
        className="academic-editor min-h-96 border bg-white p-6 text-left outline-none empty:before:text-gray-400 empty:before:content-[attr(data-placeholder)]"
        onInput={notifyChange}
      />
    </div>
  );
});
 
export default TextEditor;
 
