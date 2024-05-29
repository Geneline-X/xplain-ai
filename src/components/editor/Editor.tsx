"use client"
import MaxWidthWrapper from "@/components/MaxWidthWrapper";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import EditorImage from "@tiptap/extension-image";
import MenuBar from './Menubar';
import React, { useEffect } from 'react';
import styled from 'styled-components';
import "./style.scss"
import { useEditorContent } from './EditorContext';
import { Button } from "../ui/button";


const StyledEditorContent = styled.div`
  background-color: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1rem;
  min-height: 300px;
  max-width: 100%;
  margin-top: 1rem;
  font-size: 1rem;
  color: #333;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  .ProseMirror {
    outline: none;
  }
`;

const Editor: React.FC = () => {

  const savedContent = localStorage.getItem('editorContent') || 'Click the formatting options to style your text.';

  const { editorContent } = useEditorContent();

  const editor = useEditor({
    extensions: [
      StarterKit,
      Highlight,
      TaskList,
      TaskItem,
      Underline,
      EditorImage
    ],
    content: editorContent.editorMessage ? editorContent.editorMessage : 'Click the formatting options to style your text.', //${editorContent}
  });
 
  useEffect(() => {
    if (editor) {
      editor.on('update', () => {
        const content = editor.getHTML();
        localStorage.setItem('editorContent', content);
      });
    }
  }, [editor]);

  const clearEditorContent = () => {
    editorContent.editorMessage = ''
    localStorage.removeItem('editorContent');
    editor?.commands.setContent('Click the formatting options to style your text.');
  };

  return (
    <MaxWidthWrapper className="mt-4 mb-2">
      {editor && <MenuBar editor={editor}  fileId={editorContent.fileId}/>}
      <div className="flex justify-end mt-2">
        <Button onClick={clearEditorContent} color="red" size={"sm"} className="bg-red-400">
          Clear Content
        </Button>
      </div>
      <StyledEditorContent>
        <EditorContent className="editor__content" editor={editor} />
      </StyledEditorContent>
    </MaxWidthWrapper>
  );
};

export default Editor;
