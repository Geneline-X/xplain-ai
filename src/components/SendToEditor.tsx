import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { Edit } from 'lucide-react';
import { ExtendedMessage } from '@/types/message';
import { cn } from '@/lib/utils';
import { toast } from './ui/use-toast';
import { useEditorContent } from '@/components/editor/EditorContext';

interface SendToEditorProps {
  message: ExtendedMessage;
}

const SendToEditor = ({ message }: SendToEditorProps) => {
  const { updateEditorContent } = useEditorContent();

  const handleClick = () => {
    if (typeof message.text === 'string') {
      updateEditorContent({ editorMessage: message.text });
    } else {
      const messageString = ReactDOMServer.renderToStaticMarkup(message.text);
      updateEditorContent({ editorMessage: messageString });
      console.log('Message text is JSX.Element:', message.text);
    }
    console.log('send to online editor: ', message);
    toast({
      title: "Chat has been added to the Editor",
      description: "You can further edit the message in the Editor",
    });
  };

  return (
    <button
        className={`
            mr-3
            mt-[-3px]
            flex items-center justify-center
            rounded-full
            hover:${!message.isUserMessage ? "bg-gray-100" : "bg-black"}
            focus:outline-none focus:ring-2 focus:ring-blue-400
            ${!message.isUserMessage ? 'text-blue-400' : 'text-blue-100'}
        `}
          onClick={handleClick}
        >
        
         send to editor
        </button>
  );
};

export default SendToEditor;
