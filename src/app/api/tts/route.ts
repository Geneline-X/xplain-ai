import axios from "axios";
import { TextToSpeechClient } from '@google-cloud/text-to-speech';

import fs from 'fs';
import util from 'util';

const client = new TextToSpeechClient();
export async function POST(req:Request) {
    try {
      //fix this backend later //
        const { text } = await req.json()
        const request = {
          input: {text: text as string},
          // Select the language and SSML voice gender (optional)
          voice: {languageCode: 'en-US', ssmlGender: 'NEUTRAL'},
          // select the type of audio encoding
          audioConfig: {audioEncoding: 'MP3'},
        };

      // Perform the text-to-speech request
     //@ts-ignore
      const [response] = client.synthesizeSpeech(request);

        // Create a buffer from the audio content
        const audioBuffer = Buffer.from(response.audioContent, 'base64');

        // Respond with the audio content as a Blob
        const blob = new Blob([audioBuffer], { type: 'audio/mp3' });
        return new Response(blob, { status: 200 });

    } catch (error) {
        return new Response(JSON.stringify({message: "Error Occured in the Server"}), {status:500})
    }
}