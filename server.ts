import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Set up body parsers with limits for base64 images
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ limit: "15mb", extended: true }));

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Server-side Gemini analysis endpoint
app.post("/api/gemini/analyze", async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ error: "No image data provided" });
    }

    if (!apiKey) {
      return res.status(500).json({ 
        error: "GEMINI_API_KEY is not configured on the server. Please add it in Settings > Secrets." 
      });
    }

    // Parse base64 image data and mimeType
    let mimeType = "image/jpeg";
    let data = image;

    const match = image.match(/^data:(image\/[a-zA-Z+.-]+);base64,(.+)$/);
    if (match) {
      mimeType = match[1];
      data = match[2];
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        {
          inlineData: {
            mimeType: mimeType,
            data: data,
          },
        },
        "Analyze this image of a municipal/civic issue (e.g., potholes, garbage accumulation, water leak, broken streetlight, open drainage, or safety hazard). Classify it and estimate severity."
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: {
              type: Type.STRING,
              description: "The category of the issue. Must be one of the following exactly: 'Potholes', 'Garbage', 'Water Leakage', 'Streetlights', 'Drainage', 'Safety'.",
            },
            severity: {
              type: Type.STRING,
              description: "The severity or urgency level. Must be one of: 'Low', 'Medium', 'High'.",
            },
            summary: {
              type: Type.STRING,
              description: "A concise, detailed summary of the issue shown (max 150 characters). E.g. 'Deep pothole on Indiranagar 12th main road, causing two-wheelers to swerve dangerously.'",
            },
            confidence: {
              type: Type.NUMBER,
              description: "Confidence rating of the AI matching this issue category, from 0 to 100. E.g., 94.5.",
            }
          },
          required: ["category", "severity", "summary", "confidence"],
        },
      },
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("Empty response received from Gemini model");
    }

    const parsedResult = JSON.parse(resultText.trim());
    res.json(parsedResult);
  } catch (error: any) {
    console.error("Gemini analysis error:", error);
    res.status(500).json({ error: error.message || "An error occurred during Gemini analysis" });
  }
});

// Vite middleware setup for full-stack compatibility
async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

setupVite();
