# ElevenLabs Voice Cloning Guide

This README serves as a guide on how to use ElevenLabs for voice cloning. Follow the steps below to clone a voice, test it, and fine-tune it for the best results.

## Collecting Data

Before you start, you'll need voice data. For instance, if you're cloning the voice of Raiden Shogun from the game Genshin Impact, you can download the voice data from [this site](https://genshin-impact.fandom.com/wiki/Raiden_Shogun/Voice-Overs).

If you're creating your own dataset, ensure the audio is high quality. It should have no background noise, clear pronunciation, and be at least 1 minute long. 

The audio format must be mp3.

## Creating an ElevenLabs Account

Visit [ElevenLabs](https://beta.elevenlabs.io/) to create an account. You'll need this to access the speech synthesis and voice cloning features.

## Speech Synthesis/Voice Cloning

Follow these steps to clone a voice:

1. Go to the [speech synthesis page](https://beta.elevenlabs.io/speech-synthesis).
2. Click "Add Voice".
3. Click "Add Generative or Cloned Voice".
4. Click "Instant Voice Cloning".
5. Fill in all the required information and upload your audio samples.
6. Click "Add Voice".

## Testing Your Voice

To test the voice you've just created:

1. Go back to the [speech synthesis page](https://beta.elevenlabs.io/speech-synthesis).
2. Choose the voice you just created.
3. Adjust the voice settings and choose a model (monolingual or multilingual).
4. Type some text and click "Generate".

## Fine-tuning Your Voice

Compare the original voice and the generated voice using the same text. Adjust the settings or text based on this comparison. Here are some tips:

- If the voice is too monotone, lower the Stability to make it more emotional. However, setting the Stability to zero can sometimes lead to a strange accent.
- Longer sentences tend to be spoken better because they provide more context for the AI speaker to understand.
- For shorter sentences that are spoken too quickly, replace "." with "...". Add "-" or a newline for a pause.
- Add emotion-related words or phrases, or use punctuation marks like “!”, “?” to add emotions to the voice.

## Using Your Custom Voice in Our Project

1. Get the voice ID of the voice, and get the API key from your ElevenLabs account.
2. Paste the voice ID and API key in your .env file:
```
XI_VOICE_ID=<voice id>
XI_API_KEY=<api key>
```
3. Remember to add your fine-tuning tricks in the system prompt.

