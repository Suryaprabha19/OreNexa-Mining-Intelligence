import React, { useState, useRef } from "react";
import {
  Video,
  Upload,
  Sparkles,
  Play,
  RotateCcw,
  Download,
  AlertCircle,
  Clock,
  Layers,
  CheckCircle2,
  Maximize2,
  X,
} from "lucide-react";

interface VeoVideoAnimatorProps {
  isOpen: boolean;
  onClose: () => void;
  mineName: string;
}

interface PresetImage {
  id: string;
  name: string;
  category: string;
  description: string;
  url: string;
  recommendedPrompt: string;
}

const PRESET_IMAGES: PresetImage[] = [
  {
    id: "balaghat-bench",
    name: "Balaghat Opencast Highwall",
    category: "Satellite & Pit",
    description: "Multi-bench manganese extraction highwall with active haul ramp",
    url: "https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?auto=format&fit=crop&w=800&q=80",
    recommendedPrompt:
      "Cinematic aerial drone fly-through over opencast mining benches showing manganese extraction and dynamic dust motion",
  },
  {
    id: "dongri-buzurg",
    name: "Dongri Buzurg Pit Overview",
    category: "Drone Photogrammetry",
    description: "Deep pit perspective showing quartz-gondite strata and dewatering sump",
    url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80",
    recommendedPrompt:
      "Smooth orbiting camera moving down along quarry terraces revealing geological strata and mining equipment",
  },
  {
    id: "chikla-vein",
    name: "Chikla Geological Outcrop",
    category: "Geological Survey",
    description: "Braunite-pyrolusite strike zone with SWIR 2.2µm anomalous reflectance",
    url: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=800&q=80",
    recommendedPrompt:
      "Forward push-in cinematic camera sweep over rugged geological rocky terrain with atmospheric light shift",
  },
];

export const VeoVideoAnimator: React.FC<VeoVideoAnimatorProps> = ({
  isOpen,
  onClose,
  mineName,
}) => {
  const [selectedImage, setSelectedImage] = useState<string>(PRESET_IMAGES[0].url);
  const [selectedMimeType, setSelectedMimeType] = useState<string>("image/jpeg");
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "9:16">("16:9");
  const [prompt, setPrompt] = useState<string>(PRESET_IMAGES[0].recommendedPrompt);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"presets" | "upload">("presets");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  if (!isOpen) return null;

  // Handle custom image upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedMimeType(file.type || "image/jpeg");
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setSelectedImage(result);
      setGeneratedVideoUrl(null);
      setErrorMessage(null);
    };
    reader.readAsDataURL(file);
  };

  // Convert remote image URL to base64 if needed
  const getImageBase64 = async (url: string): Promise<string> => {
    if (url.startsWith("data:")) {
      return url;
    }
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Trigger Veo Video Generation
  const handleGenerateVideo = async () => {
    try {
      setIsGenerating(true);
      setErrorMessage(null);
      setGeneratedVideoUrl(null);
      setProgressPercent(10);
      setStatusMessage("Preparing image and submitting to Veo 3.1 video engine...");

      const base64Data = await getImageBase64(selectedImage);

      // Step 1: Start Veo operation
      const startRes = await fetch("/api/generate-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: base64Data,
          mimeType: selectedMimeType,
          prompt: prompt.trim() || `Cinematic flyover over ${mineName} manganese mine`,
          aspectRatio,
        }),
      });

      if (!startRes.ok) {
        const errJson = await startRes.json();
        throw new Error(errJson.error || "Failed to start Veo video generation");
      }

      const { operationName } = await startRes.json();
      setProgressPercent(25);
      setStatusMessage("Veo 3.1 generating temporal motion and spatial dynamics...");

      // Step 2: Poll operation status
      let isDone = false;
      let pollCount = 0;
      const maxPolls = 60; // 60 * 2s = 120s max

      while (!isDone && pollCount < maxPolls) {
        await new Promise((r) => setTimeout(r, 2000));
        pollCount++;

        const statusRes = await fetch("/api/video-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ operationName }),
        });

        if (statusRes.ok) {
          const statusData = await statusRes.json();
          if (statusData.error) {
            throw new Error(statusData.error.message || "Veo generation error");
          }

          if (statusData.progress) {
            setProgressPercent(statusData.progress);
          } else {
            setProgressPercent(Math.min(30 + pollCount * 8, 92));
          }

          if (statusData.message) {
            setStatusMessage(statusData.message);
          }

          if (statusData.done) {
            isDone = true;
            setProgressPercent(98);
            setStatusMessage("Finalizing MP4 video stream...");
            break;
          }
        }
      }

      if (!isDone) {
        throw new Error("Video generation request timed out. Please retry.");
      }

      // Step 3: Fetch video stream/URL
      const dlRes = await fetch("/api/video-download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operationName }),
      });

      if (!dlRes.ok) {
        throw new Error("Failed to download generated video stream");
      }

      const contentType = dlRes.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const dlJson = await dlRes.json();
        setGeneratedVideoUrl(dlJson.videoUrl);
      } else {
        const videoBlob = await dlRes.blob();
        const blobUrl = URL.createObjectURL(videoBlob);
        setGeneratedVideoUrl(blobUrl);
      }

      setProgressPercent(100);
      setStatusMessage("Veo 3.1 video generation completed!");
    } catch (err: any) {
      console.error("Veo video generation error:", err);
      setErrorMessage(err.message || "An unexpected error occurred during video generation");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 font-sans">
      <div className="bg-[#0f172a] border border-slate-700 rounded-lg w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-[#0a0f18]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded">
              <Video className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xs sm:text-sm font-bold uppercase tracking-tight text-white">
                  Veo 3.1 Video Animator • Space & Pit Imagery
                </h2>
                <span className="px-1.5 py-0.2 text-[9px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded">
                  veo-3.1-fast-generate-preview
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                Transform geological aerial drone or satellite photos into dynamic cinematic mining animations
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {/* Top Controls: Aspect Ratio & Image Selection Tab */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            {/* Aspect Ratio Selector (Mandatory 16:9 or 9:16) */}
            <div className="md:col-span-6 bg-slate-900/90 border border-slate-800 p-2 rounded flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase text-slate-400">
                Aspect Ratio:
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setAspectRatio("16:9")}
                  disabled={isGenerating}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold transition ${
                    aspectRatio === "16:9"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  16:9 Landscape
                </button>
                <button
                  type="button"
                  onClick={() => setAspectRatio("9:16")}
                  disabled={isGenerating}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold transition ${
                    aspectRatio === "9:16"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  9:16 Portrait
                </button>
              </div>
            </div>

            {/* Presets vs Upload Switcher */}
            <div className="md:col-span-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setActiveTab("presets")}
                className={`px-3 py-1 rounded text-[11px] font-semibold border ${
                  activeTab === "presets"
                    ? "bg-slate-800 text-blue-400 border-blue-500/50"
                    : "bg-slate-900 text-slate-400 border-slate-800"
                }`}
              >
                Curated Presets ({PRESET_IMAGES.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("upload");
                  fileInputRef.current?.click();
                }}
                className={`px-3 py-1 rounded text-[11px] font-semibold border flex items-center gap-1.5 ${
                  activeTab === "upload"
                    ? "bg-slate-800 text-blue-400 border-blue-500/50"
                    : "bg-slate-900 text-slate-400 border-slate-800"
                }`}
              >
                <Upload className="w-3 h-3" />
                <span>Upload Custom Photo</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* Preset Selector or Upload Preview */}
          {activeTab === "presets" ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {PRESET_IMAGES.map((img) => (
                <div
                  key={img.id}
                  onClick={() => {
                    setSelectedImage(img.url);
                    setPrompt(img.recommendedPrompt);
                    setGeneratedVideoUrl(null);
                    setErrorMessage(null);
                  }}
                  className={`cursor-pointer rounded border p-2 bg-slate-900/60 transition ${
                    selectedImage === img.url
                      ? "border-blue-500 ring-1 ring-blue-500/60 bg-blue-950/20"
                      : "border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="relative aspect-video w-full overflow-hidden rounded mb-1.5 bg-black">
                    <img
                      src={img.url}
                      alt={img.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <span className="absolute bottom-1 right-1 text-[9px] font-mono bg-black/75 text-slate-300 px-1 py-0.5 rounded">
                      {img.category}
                    </span>
                  </div>
                  <div className="font-bold text-white text-[11px] truncate">
                    {img.name}
                  </div>
                  <div className="text-[10px] text-slate-400 line-clamp-1">
                    {img.description}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-slate-900/80 border border-slate-800 rounded p-3 flex flex-col items-center justify-center gap-2">
              <div className="relative max-h-48 overflow-hidden rounded border border-slate-700 bg-black">
                <img
                  src={selectedImage}
                  alt="Custom upload"
                  className="max-h-44 object-contain"
                />
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-[10px] text-blue-400 hover:underline flex items-center gap-1"
              >
                <Upload className="w-3 h-3" />
                <span>Replace selected photo</span>
              </button>
            </div>
          )}

          {/* Prompt Configuration */}
          <div className="bg-slate-900/90 border border-slate-800 rounded p-2.5">
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
              Veo 3.1 Motion Directives & Camera Trajectory:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={isGenerating}
                placeholder="e.g. Cinematic camera crane-shot moving downward into the open pit with haul truck movement"
                className="flex-1 bg-[#0a0f18] border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={handleGenerateVideo}
                disabled={isGenerating}
                className={`px-4 py-1.5 rounded font-bold text-xs flex items-center gap-1.5 text-white transition ${
                  isGenerating
                    ? "bg-slate-800 border border-slate-700 cursor-not-allowed text-slate-400"
                    : "bg-blue-600 hover:bg-blue-500 border border-blue-500 shadow-md"
                }`}
              >
                <Sparkles className={`w-3.5 h-3.5 ${isGenerating ? "animate-spin text-blue-300" : ""}`} />
                <span>{isGenerating ? "GENERATING..." : "ANIMATE VIDEO"}</span>
              </button>
            </div>
          </div>

          {/* Progress / Status HUD */}
          {isGenerating && (
            <div className="bg-blue-950/30 border border-blue-800/60 rounded p-3 space-y-2 animate-pulse">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-blue-300 font-semibold flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 animate-spin" />
                  <span>{statusMessage}</span>
                </span>
                <span className="font-mono font-bold text-blue-400">
                  {progressPercent}%
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
              <p className="text-[10px] text-slate-400 italic">
                Veo 3.1 synthesizes 1080p spatial vectors, physics motion, and illumination from the source image.
              </p>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="bg-red-950/40 border border-red-800 text-red-300 p-2.5 rounded flex items-start gap-2 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
              <div>
                <span className="font-bold">Generation Error: </span>
                <span>{errorMessage}</span>
              </div>
            </div>
          )}

          {/* Generated Video Player */}
          {generatedVideoUrl && (
            <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  <span className="font-bold text-white text-xs">
                    Veo 3.1 Animation Ready ({aspectRatio} {aspectRatio === "16:9" ? "Landscape" : "Portrait"})
                  </span>
                </div>
                <a
                  href={generatedVideoUrl}
                  download={`moil-${mineName.toLowerCase()}-veo-video.mp4`}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 text-[11px] font-semibold"
                >
                  <Download className="w-3 h-3" />
                  <span>Download MP4</span>
                </a>
              </div>

              {/* Responsive Video Container based on Aspect Ratio */}
              <div className="flex justify-center bg-black/90 rounded border border-slate-800 p-2">
                <div
                  className={`relative overflow-hidden rounded ${
                    aspectRatio === "9:16"
                      ? "w-[240px] aspect-[9/16]"
                      : "w-full max-w-2xl aspect-[16/9]"
                  }`}
                >
                  <video
                    ref={videoRef}
                    src={generatedVideoUrl}
                    controls
                    autoPlay
                    loop
                    className="w-full h-full object-cover rounded shadow-lg"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-4 py-2.5 border-t border-slate-800 bg-[#0a0f18] flex items-center justify-between text-[10px] text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            <span>Veo 3.1 Video Engine • Target Latency &lt;15s</span>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-[11px]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
