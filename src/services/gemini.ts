import axios from 'axios';

const GEMINI_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY!;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`;

export const verifyFace = async (refBase64: string, liveBase64: string) => {
  const clean = (b64: string) => b64.replace(/^data:image\/\w+;base64,/, '');

  const payload = {
    contents: [{
      parts: [
        { text: 'Compare these two face images. Are they the same person? Return ONLY a JSON: {"match": boolean, "confidence": number 0-100}' },
        { inline_data: { mime_type: 'image/jpeg', data: clean(refBase64) } },
        { inline_data: { mime_type: 'image/jpeg', data: clean(liveBase64) } }
      ]
    }]
  };

  const { data } = await axios.post(GEMINI_URL, payload);
  let text = data.candidates[0].content.parts[0].text.replace(/```json|```/g, '').trim();
  
  try {
    const parsed = JSON.parse(text);
    return { match: parsed.match && parsed.confidence >= 85, confidence: parsed.confidence };
  } catch {
    return { match: false, confidence: 0 };
  }
};