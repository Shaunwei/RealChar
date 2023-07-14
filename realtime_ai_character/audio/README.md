# ElevenLabs Voice Cloning Guide

This README serves as a guide on how to use ElevenLabs for voice cloning. Follow the steps below to clone a voice, test it, and fine-tune it for the best results.

## Collecting Data

Before you start, you'll need voice data. Download high quality vocal only audio clips. Check the [training_data](./training_data) folder for reference.

If you're creating your own dataset, ensure the audio is high quality. It should have no background noise, clear pronunciation.

The audio format must be mp3 and should be about 1 minute long in total.

## Creating an ElevenLabs Account

Visit [ElevenLabs](https://beta.elevenlabs.io/) to create an account. You'll need this to access the speech synthesis and voice cloning features.

Get your `ELEVEN_LABS_API_KEY`:
1. Click profile icon and select 'profile'.
2. Copy API Key

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
2. Choose the voice you just created in Settings.
4. Type some text and click "Generate".

## Fine-tuning Your Voice

You can make the voice read better by adjusting system and user prompts.
Here are some tips:

- If the voice is too monotone, lower the Stability to make it more emotional. However, setting the Stability to zero can sometimes lead to a strange accent.
- Longer sentences tend to be spoken better because they provide more context for the AI speaker to understand.
- For shorter sentences that are spoken too quickly, replace "." with "...". Add "-" or a newline for a pause.
- Add emotion-related words or phrases, or use punctuation marks like “!”, “?” to add emotions to the voice.

## Using Your Custom Voice in Our Project

You need the voice id of cloned voice. Here's how:
1. go to https://api.elevenlabs.io/docs
2. choose Get Voices api
3. follow the instruction and find the specific voice_id in the Responses.
4. Do not forget to update your .env file with `ELEVEN_LABS_API_KEY` and voice ids.