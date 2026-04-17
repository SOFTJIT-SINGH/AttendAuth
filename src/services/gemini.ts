import axios from 'axios';

// Professional Grade AI Vision Service
const GEMINI_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
// Using the stabilized flash-latest model for production reliability
const MODEL = "gemini-flash-latest";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_KEY}`;

export const verifyFace = async (refBase64: string, liveBase64: string) => {
  if (!GEMINI_KEY) {
    throw new Error("Gemini API access not configured.");
  }
  
  if (!refBase64 || !liveBase64) {
    return { match: false, confidence: 0 };
  }

  const clean = (b64: string) => {
    // Ensure we only pass the raw base64 data to the API
    return b64.includes('base64,') ? b64.split('base64,')[1] : b64;
  };

  const payload = {
    contents: [{
      parts: [
        { text: 'Compare these two face images. Are they the same person? Return ONLY a JSON object: {"match": boolean, "confidence": number 0-100}. Use low confidence if lighting is bad.' },
        { inline_data: { mime_type: 'image/jpeg', data: clean(refBase64) } },
        { inline_data: { mime_type: 'image/jpeg', data: clean(liveBase64) } }
      ]
    }]
  };

  try {
    // Log the configuration once to verify URL in logs
    console.log(`[AI HUB] Routing to: v1/models/${MODEL}`);
    
    const { data } = await axios.post(GEMINI_URL, payload);
    
    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
        throw new Error("AI provider returned empty response.");
    }

    let text = data.candidates[0].content.parts[0].text;
    text = text.replace(/```json|```/g, '').trim();
    
    const parsed = JSON.parse(text);
    return { 
      match: parsed.match === true && parsed.confidence >= 85, 
      confidence: parsed.confidence || 0 
    };
  } catch (err: any) {
    const errorMsg = err?.response?.data?.error?.message || err.message;
    console.error("Gemini AI Core Fault:", errorMsg);
    return { match: false, confidence: 0 };
  }
};