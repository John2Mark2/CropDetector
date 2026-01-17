import express from "express";
import multer from "multer";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

app.post("/analyze", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No image uploaded" });

    const base64Image = req.file.buffer.toString("base64");

    // Move configuration to the URL query string to fix "Unknown modifier"
    const apiUrl = "https://plant.id/api/v3/identification?details=common_names,treatment,cause,description&language=en";

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Api-Key": process.env.PLANT_ID_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        images: [base64Image],
        health: "all",
        similar_images: true
      })
    });

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const errorText = await response.text();
      return res.status(500).json({ error: "API Error: " + errorText });
    }

    const data = await response.json();

    // Extract Common Name
    const plantSug = data.result?.classification?.suggestions?.[0];
    const commonName = plantSug?.details?.common_names?.[0] || plantSug?.name || "Unknown Plant";

    const isHealthy = data.result?.is_healthy?.binary;
    const disease = data.result?.disease?.suggestions?.[0];

    // Build Complete Treatment Instructions
    let detailedTreatment = "Plant is healthy! Maintain regular care.";
    if (!isHealthy && disease) {
      const t = disease.details?.treatment;
      detailedTreatment = `
        DIAGNOSIS: ${disease.name}
        1. BIOLOGICAL: ${t?.biological || "None specified."}
        2. CHEMICAL: ${t?.chemical || "None specified."}
        3. PREVENTION: ${t?.prevention || "Monitor regularly."}
      `.trim();
    }

    res.json({
      plantName: commonName,
      healthStatus: isHealthy ? "Healthy" : "Diseased",
      analysisResult: isHealthy ? "No issues" : disease?.name,
      confidence: `${Math.round((isHealthy ? data.result.is_healthy.probability : (disease?.probability || 0)) * 100)}%`,
      recommendation: detailedTreatment
    });

  } catch (err) {
    console.error("Server Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Use the port Render gives you, or default to 3001
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: "*" // Allows your Cloudflare link to talk to the backend
}));

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend running on port ${PORT}`);
});