import { useEffect, useRef } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { Bold, Code, Heading2, ImagePlus, Italic, List, ListOrdered, Minus, Quote, Redo, Strikethrough, Undo } from 'lucide-react';
import { useUploadForumImageMutation } from '@/redux/api/forum';
import { toast } from 'sonner';

interface Props {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
}

export function RichTextEditor({ content, onChange, placeholder = '', minHeight = 180 }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploadImage] = useUploadForumImageMutation();
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Image.configure({ allowBase64: false }),
      Placeholder.configure({ placeholder }),
    ],
    content,
    onUpdate: ({ editor: current }) => onChange(current.getHTML()),
    editorProps: {
      attributes: {
        class: 'forum-editor-content px-3 py-3 text-sm focus:outline-none',
        style: `min-height:${minHeight}px`,
      },
    },
  });

  useEffect(() => {
    if (editor && editor.getHTML() !== content) editor.commands.setContent(content);
  }, [content, editor]);

  if (!editor) return null;
  const button = (active = false) =>
    `p-1.5 rounded-sm ${active ? 'bg-blue-100 text-[var(--office-blue)]' : 'text-gray-500 hover:bg-gray-100'}`;

  const onImage = async (file?: File) => {
    if (!file) return;
    try {
      const result = await uploadImage(file).unwrap();
      editor.chain().focus().setImage({ src: result.url }).run();
    } catch {
      toast.error('Image upload failed');
    }
  };

  return (
    <div className="overflow-hidden rounded-sm border border-gray-300 bg-white focus-within:border-[var(--office-blue)]">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-gray-200 bg-gray-50 px-2 py-1.5">
        <button type="button" className={button(editor.isActive('heading', { level: 2 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 size={15} /></button>
        <button type="button" className={button(editor.isActive('bold'))} onClick={() => editor.chain().focus().toggleBold().run()}><Bold size={15} /></button>
        <button type="button" className={button(editor.isActive('italic'))} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic size={15} /></button>
        <button type="button" className={button(editor.isActive('strike'))} onClick={() => editor.chain().focus().toggleStrike().run()}><Strikethrough size={15} /></button>
        <button type="button" className={button(editor.isActive('code'))} onClick={() => editor.chain().focus().toggleCode().run()}><Code size={15} /></button>
        <span className="mx-1 h-5 w-px bg-gray-300" />
        <button type="button" className={button(editor.isActive('bulletList'))} onClick={() => editor.chain().focus().toggleBulletList().run()}><List size={15} /></button>
        <button type="button" className={button(editor.isActive('orderedList'))} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered size={15} /></button>
        <button type="button" className={button(editor.isActive('blockquote'))} onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote size={15} /></button>
        <button type="button" className={button()} onClick={() => editor.chain().focus().setHorizontalRule().run()}><Minus size={15} /></button>
        <button type="button" className={button()} onClick={() => inputRef.current?.click()}><ImagePlus size={15} /></button>
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="hidden" onChange={(event) => { void onImage(event.target.files?.[0]); event.target.value = ''; }} />
        <span className="flex-1" />
        <button type="button" className={button()} onClick={() => editor.chain().focus().undo().run()}><Undo size={15} /></button>
        <button type="button" className={button()} onClick={() => editor.chain().focus().redo().run()}><Redo size={15} /></button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
