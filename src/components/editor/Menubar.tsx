"use client"
import React, { Fragment, useState } from 'react';
import MenuItem from './MenuItem';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Pen,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  ListChecks,
  Codesandbox,
  Quote,
  SeparatorHorizontal,
  ArrowLeft,
  ArrowRight,
  Eraser,
  WrapText,
  Pilcrow,
  MoreHorizontal,
  Upload,
  Image,
} from 'lucide-react';
import { Button, buttonVariants } from '../ui/button';
import Link from 'next/link';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../ui/dropdown-menu'; // Assuming you have a DropdownMenu component
import { useEditorContent } from './EditorContext';

import FileNameModal from '../FileNameModal';
import { toast } from '../ui/use-toast';
interface Props {
  editor: any;
  fileId?: string
}

const Menubar: React.FC<Props> = ({ editor, fileId }) => {
  const [fileName, setFileName] = useState('document'); // Default file name
  const [showFileNameModal, setShowFileNameModal] = useState(false);
  const addImage = () => {
    const url = window.prompt('URL')

    if (url) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }
  
  const items = [
    { icon: Bold, title: 'Bold', action: () => editor.chain().focus().toggleBold().run(), isActive: () => editor.isActive('bold') },
    { icon: Italic, title: 'Italic', action: () => editor.chain().focus().toggleItalic().run(), isActive: () => editor.isActive('italic') },
    { icon: Strikethrough, title: 'Strike', action: () => editor.chain().focus().toggleStrike().run(), isActive: () => editor.isActive('strike') },
    { icon: Pen, title: 'Highlight', action: () => editor.chain().focus().toggleHighlight().run(), isActive: () => editor.isActive('highlight') },
    { type: "divider" },
    { icon: Code, title: 'Code', action: () => editor.chain().focus().toggleCode().run(), isActive: () => editor.isActive('code') },
    { icon: Heading1, title: 'Heading 1', action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(), isActive: () => editor.isActive('heading', { level: 1 }) },
    { icon: Heading2, title: 'Heading 2', action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), isActive: () => editor.isActive('heading', { level: 2 }) },
    { icon: Pilcrow, title: 'Paragraph', action: () => editor.chain().focus().setParagraph().run(), isActive: () => editor.isActive('paragraph') },
    { icon: List, title: 'Bullet List', action: () => editor.chain().focus().toggleBulletList().run(), isActive: () => editor.isActive('bulletList') },
    { icon: ListOrdered, title: 'Ordered List', action: () => editor.chain().focus().toggleOrderedList().run(), isActive: () => editor.isActive('orderedList') },
    { icon: ListChecks, title: 'Task List', action: () => editor.chain().focus().toggleTaskList().run(), isActive: () => editor.isActive('taskList') },
    { icon: Codesandbox, title: 'Code Block', action: () => editor.chain().focus().toggleCodeBlock().run(), isActive: () => editor.isActive('codeBlock') },
    { type: "divider" },
    { icon: Quote, title: 'Blockquote', action: () => editor.chain().focus().toggleBlockquote().run(), isActive: () => editor.isActive('blockquote') },
    { icon: SeparatorHorizontal, title: 'Horizontal Rule', action: () => editor.chain().focus().setHorizontalRule().run() },
    { type: "divider" },
    { icon: WrapText, title: 'Hard Break', action: () => editor.chain().focus().setHardBreak().run() },
    { icon: Image, title: 'Add Image', action: addImage },
    { icon: Eraser, title: 'Clear Format', action: () => editor.chain().focus().clearNodes().unsetAllMarks().run() },
    { icon: ArrowLeft, title: 'Undo', action: () => editor.chain().focus().undo().run() },
    { icon: ArrowRight, title: 'Redo', action: () => editor.chain().focus().redo().run() },
  ];

  const importantItems = items.slice(0, 4); 
  const moreItems = items.slice(10);

  // handle export
  const handleExport = async(option:string) => {
    if (option === 'download-pdf') {
        setShowFileNameModal(true)
    } else if (option === 'publish-web') {
      // Implement publish to web logic here
    }
  };

  const handleDownload = async () => {
    try {
      if (!editor.getHTML()) {
        toast({
          title: "No Content in the editor",
          variant: "destructive"
        });
        return;
      }
  
      const container = document.createElement('div');
      container.style.width = '210mm'; // A4 width in mm
      container.style.padding = '20mm'; // Add padding to create a margin
      container.style.backgroundColor = 'white'; // Ensure the background is white
      container.innerHTML = editor.getHTML(); // Use the actual editor content
      document.body.appendChild(container);
  
      // Use html2canvas to capture the content as a canvas
      const canvas = await html2canvas(container, { 
        useCORS: true, 
        scale: 2 // Increase scale for better resolution
      });
  
      // Remove the temporary container
      document.body.removeChild(container);
  
      // Get canvas dimensions
      const imgData = canvas.toDataURL('image/png');
      const pdfWidth = 210; // A4 width in mm
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width; // Calculate height to maintain aspect ratio
  
      console.log('Canvas dimensions:', pdfWidth, pdfHeight);
  
      // Create the PDF from the canvas
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
  
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
  
      // Save the generated PDF
      pdf.save(`${fileName}.pdf`);
  
    } catch (error) {
      console.error('Error creating PDF:', error); // Improved error handling
    }
  };
  
  /// file modal subcomponent ///


  return (
    <div className="editor__header flex items-center">
      {fileId ? (
        <Link href={`/dashboard/${fileId}`} className={buttonVariants({ size: 'sm' })}>
          <ArrowLeft className="h-3 w-3" />
        </Link>
      ) : null}

      <div className="hidden lg:flex flex-wrap gap-2">
        {items.map((item, index) => (
          <Fragment key={index}>
            {item.type === 'divider' ? (
              <div className="w-px h-6 bg-gray-300" />
            ) : (
              <MenuItem {...item} />
            )}
          </Fragment>
        ))}
      </div>

      <div className="flex lg:hidden flex-wrap gap-2">
        {importantItems.map((item, index) => (
          <Fragment key={index}>
            {item.type === 'divider' ? (
              <div className="w-px h-6 bg-gray-300" />
            ) : (
              <MenuItem {...item} />
            )}
          </Fragment>
        ))}
        <DropdownMenu>
          <DropdownMenuTrigger className="ml-auto">
            <MoreHorizontal className="h-5 w-5 text-blue-400" />
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {moreItems.map((item, index) => (
              <Fragment key={index}>
                {item.type === 'divider' ? (
                  <div className="w-px h-6 bg-gray-300 my-1" />
                ) : (
                  <DropdownMenuItem onSelect={item.action}>
                    {item.icon ? <item.icon className="mr-2 h-5 w-5" /> : null}
                    {item.title}
                  </DropdownMenuItem>
                )}
              </Fragment>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="ml-auto flex items-center">
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Upload className="h-5 w-5 text-blue-500" />
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onSelect={() => handleExport('download-pdf')}>
              Download as PDF
            </DropdownMenuItem>
            {/* <DropdownMenuItem onSelect={() => handleExport('publish-web')}>
              Publish to the Web
            </DropdownMenuItem> */}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
        {showFileNameModal && (
          <FileNameModal
            onClose={() => setShowFileNameModal(false)}
            onSave={() => {
              setShowFileNameModal(false);
              handleDownload();
            }}
            fileName={fileName}
            setFileName={setFileName}
          />
        )}
    </div>
  );
};




export default Menubar;
