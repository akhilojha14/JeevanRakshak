
require("dotenv").config();

const express = require("express");
const multer = require("multer");
const path = require("path");
const { GoogleGenAI } = require("@google/genai");

const app = express();
const PORT = process.env.PORT || 3000;

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Upload a JPG, PNG, or WEBP image."));
    }
  },
});

app.use(express.static(__dirname));

app.post("/api/analyze-accident", (req, res, next) => {
  upload.single("photo")(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        error: err.message || "Image upload failed.",
      });
    }
    next();
  });
}, async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "Gemini API key is not configured.",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        error: "Please upload an image.",
      });
    }

    const prompt = `
Analyze this image for visible evidence consistent with a road accident.

Return:
1. Assessment: "Possible accident evidence", "No clear accident evidence",
   or "Manual verification required".
2. Visible observations.
3. Limitations and recommended verification steps.

Important:
- Do not claim that the accident is definitely real or fake.
- A single image cannot reliably prove when, where, or how it was created.
- Do not claim to detect AI generation or editing unless there is
  independently verified evidence.
- If the image is unclear or ambiguous, choose manual verification.
- This is only preliminary visual analysis, not emergency verification.
`;

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{
        role: "user",
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: req.file.mimetype,
              data: req.file.buffer.toString("base64"),
            },
          },
        ],
      }],
    });

    res.json({
      analysis: result.text ||
        "The image could not be assessed. Please try again.",
      disclaimer:
        "AI analysis is not proof that an accident is real or fake.",
    });
  } catch (error) {
    console.error("Image analysis failed:", error.message);
    res.status(500).json({
      error: "Image analysis failed. Check the API key and try again.",
    });
  }
});

app.listen(PORT, () => {
  console.log(`JeevanRakshak running at http://localhost:${PORT}`);
});
