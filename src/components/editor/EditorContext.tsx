"use client"
import React, { createContext, useContext, useState } from 'react';

interface EditorContent {
  editorMessage?: string;
  fileId?: string;
}

interface EditorContextValue {
  editorContent: { editorMessage: string; fileId: string };
  updateEditorContent: (content: EditorContent) => void;
}

const EditorContext = createContext<EditorContextValue>({
  editorContent: { editorMessage: '', fileId: '' },
  updateEditorContent: () => {},
});

export const useEditorContent = () => useContext(EditorContext);

export const EditorContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [editorContent, setEditorContent] = useState<{
    editorMessage: string;
    fileId: string;
  }>({
    editorMessage: '',
    fileId: '',
  });

  const updateEditorContent = (content: EditorContent) => {
    setEditorContent((prevContent) => {
      let updatedMessage = prevContent.editorMessage;

      // Append new message with a visual separator
      if (content.editorMessage) {
        if (prevContent.editorMessage) {
            updatedMessage += `<br><br><hr><br>${content.editorMessage}`;
        } else {
          updatedMessage = content.editorMessage;
        }
      }

      return {
        ...prevContent,
        editorMessage: updatedMessage,
        ...(content.fileId && { fileId: content.fileId }), // Update fileId if provided
      };
    });
  };

  return (
    <EditorContext.Provider value={{ editorContent, updateEditorContent }}>
      {children}
    </EditorContext.Provider>
  );
};
