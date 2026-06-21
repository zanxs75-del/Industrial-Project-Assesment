require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenAI } = require("@google/genai");

const app = express();
app.use(express.json());
app.use(cors());

// Initialize Gemini (new @google/genai SDK)
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

app.get('/live', (req, res) => {
    res.json({ message: "Server is live" });
});

app.post('/api/travel-advisor', async (req, res) => {
    try {
        const { userMessage, lat, lng } = req.body;

        const prompt = `You are a professional travel advisor.
The user is located at latitude ${lat}, longitude ${lng}.
User asks: "${userMessage}"

INSTRUCTIONS:
1. You MUST use the Google Maps tool to look up real, currently-operating places near the user.
2. You MUST include EVERY place returned by the Google Maps tool as an entry in "locations". Do not skip any. Do not invent any.
3. For each place, copy its EXACT name, address, and coordinates from the Google Maps result. Do not paraphrase the name or guess the coordinates.
4. List the places in "locations" in the same order they appear in the Google Maps grounding results, so each locations[i] matches groundingChunks[i].

Respond ONLY with a raw JSON object (no markdown, no code fences) of the form:
{
  "locations": [
    {
      "name": "Exact place name from Google Maps",
      "lat": 1.234,
      "lng": 103.456,
      "description": "Short description grounded in the Maps result",
      "address": "Full address from Google Maps"
    }
  ]
}`;

        const response = await ai.models.generateContent({
            model: "gemini-3.1-flash-lite",
            contents: prompt,
            config: {
                // Enable Grounding with Google Maps
                tools: [{ googleMaps: {} }],
                // Pass the user's location as retrieval context
                toolConfig: {
                    retrievalConfig: {
                        latLng: {
                            latitude: Number(lat),
                            longitude: Number(lng),
                        },
                    },
                },
            },
        });

        let text = (response.text ?? "").replace(/```json/g, "").replace(/```/g, "").trim();

        // Extract Maps grounding attribution (required by Google Maps grounding TOS).
        // Forward the full `maps` object (title, uri, placeId, etc.) plus the widget
        // context token and the raw groundingSupports so the frontend can render
        // sources, the <gmp-places-contextual> widget, and per-segment citations.
        const grounding = response.candidates?.[0]?.groundingMetadata;
        const sources = [];
        const groundingChunks = grounding?.groundingChunks ?? [];
        for (const chunk of groundingChunks) {
            if (chunk.maps) {
                sources.push(chunk.maps);
            }
        }
       
        const groundingSupports = grounding?.groundingSupports ?? [];

        let parsed;
        try {
            parsed = JSON.parse(text);
        } catch (e) {
            return res.status(502).json({
                error: "Model did not return valid JSON",
                raw: text,
                sources                
            });
        }

        // Attach each Maps chunk to its location by position.
        // The LLM is told to keep locations[] in the same order as the
        // grounding chunks, so locations[i] pairs with sources[i].
        const locations = parsed.locations;
        for (let i = 0; i < locations.length; i++) {
            locations[i].source = sources[i];
        }

        res.json({
            locations,
            sources,
            groundingSupports
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to get advice", details: error?.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});