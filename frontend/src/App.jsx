import { useState } from "react";
import "./App.css";

function App() {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
      setResult(null);
    }
  };

  const analyzeImage = async () => {
    if (!image) return alert("Upload an image first");
    const formData = new FormData();
    formData.append("image", image);

    setLoading(true);
    try {
      const res = await fetch("http://localhost:3001/analyze", { method: "POST", body: formData });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <header>
        <h2>🌿 Crop Detector</h2>
        <p>Upload a photo to detect disease and get treatment</p>
      </header>

      <div className="upload-card">
        <input type="file" accept="image/*" onChange={handleImageChange} id="file-upload" />
        {preview && <img src={preview} alt="preview" className="preview-img" />}
        <button className="main-btn" onClick={analyzeImage} disabled={loading}>
          {loading ? "Analyzing..." : "Analyze Image"}
        </button>
      </div>

      {result && (
        <div className="result-grid">
          <div className="info-box"><strong>Common Name:</strong><br/>{result.plantName}</div>
          <div className="info-box"><strong>Status:</strong><br/>{result.healthStatus}</div>
          <div className="info-box"><strong>Condition:</strong><br/>{result.analysisResult}</div>
          <div className="info-box"><strong>Confidence:</strong><br/>{result.confidence}</div>
          <div className="info-box full-width treatment-box">
            <strong>📋 Detailed Instructions:</strong>
            <p style={{ whiteSpace: "pre-line" }}>{result.recommendation}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;