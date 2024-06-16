"use client"

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Loader2 } from 'lucide-react';
import { toast } from './ui/use-toast';
interface StudySessionProps {
  fileId: string;
}

interface Flashcard {
  question: string;
  answer: string;
}

const StudySession: React.FC<StudySessionProps>  = ({ fileId }) => {
  const [numMessages, setNumMessages] = useState(10);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

 
  const fetchFlashcards = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/generate-flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId, numberOfMessages: numMessages }),
      });
      const data = await response.json();
      console.log("this the data: ", data)
      if(data.length === 0){
        toast({
          title: "Questions and Answers not generated please try again",
          variant: "destructive"
        });
      }
      setFlashcards(data);
    } catch (error) {
      toast({
        title: "Error Occured please try again",
        variant: "destructive"
      });
      console.error('Error fetching flashcards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNextFlashcard = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % flashcards.length);
  };

  return (
    <Dialog>
    <DialogTrigger asChild>
      <Button className="bg-blue-500 text-white">Start Study Session</Button>
    </DialogTrigger>
    <DialogContent>
      <div className="p-4 rounded">
          <h2 className="text-xl mb-4">Study Session</h2>
          <p>Enter the number of recent messages to generate flashcards from:</p>
          <Input
            type="number"
            value={numMessages}
            onChange={(e) => setNumMessages(Number(e.target.value))}
            className="border p-2 mt-2 w-full"
          />
          <Button onClick={fetchFlashcards} className="bg-blue-500 text-white p-2 mt-4 w-full">
            {loading ? <Loader2 className='w-5 h-5 animate-spin'/> : 'Generate Flashcards'}
          </Button>
        {flashcards.length > 0 && (
          <div className="mt-4">
            <div className="flashcard-container group perspective">
              <div className="flashcard-inner transform-style-preserve-3d transition-transform duration-700 ease-in-out group-hover:rotate-y-180">
                <div className="flashcard-front backface-hidden bg-white border p-4 rounded shadow">
                  <div className="font-bold">{flashcards[currentIndex].question}</div>
                </div>
                <div className="flashcard-back backface-hidden bg-gray-100 border p-4 rounded shadow transform rotate-y-180">
                  <div className="mt-2">{flashcards[currentIndex].answer}</div>
                </div>
              </div>
            </div>
            <Button onClick={handleNextFlashcard} className="bg-green-500 text-white p-2 mt-4 w-full">Next</Button>
          </div>
        )}
      </div>
    </DialogContent>
  </Dialog>
);
}

export default StudySession
