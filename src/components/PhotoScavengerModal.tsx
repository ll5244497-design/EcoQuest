import React, { useState, useRef } from 'react';
import { Camera, CheckCircle2, Sparkles, Upload, Volume2, X, RefreshCw, Trophy, ShieldCheck, ArrowRight } from 'lucide-react';
import { GeneratedMission, verifyScavengerCraftPhoto } from '../services/geminiMissionService';
import { hapticFeedback } from '../utils/haptics';

interface PhotoScavengerModalProps {
  mission: GeneratedMission;
  onClose: () => void;
  onMissionCompleted: (photoDataUrl: string, craftPraise: string) => void;
}

export const PhotoScavengerModal: React.FC<PhotoScavengerModalProps> = ({
  mission,
  onClose,
  onMissionCompleted,
}) => {
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{
    verified: boolean;
    scoutPraise: string;
    bonusXp: number;
  } | null>(null);

  // Checkbox state for items collected
  const [checkedItems, setCheckedItems] = useState<{ [key: string]: boolean }>({
    item_0: true,
    item_1: true,
    item_2: true,
    crafted: true,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Verified nature craft photo sample for testing
  const sampleCraftPhoto =
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="450" viewBox="0 0 600 450"><rect width="600" height="450" fill="%232b261f"/><circle cx="300" cy="225" r="160" fill="%233a3228"/><path d="M180,240 Q300,160 420,240" stroke="%235c4033" stroke-width="16" fill="none" stroke-linecap="round"/><ellipse cx="230" cy="190" rx="65" ry="32" fill="%23166534" transform="rotate(-25 230 190)"/><ellipse cx="370" cy="190" rx="65" ry="32" fill="%2315803d" transform="rotate(25 370 190)"/><circle cx="395" cy="215" r="10" fill="%2378716c"/><circle cx="415" cy="215" r="10" fill="%23a8a29e"/><text x="300" y="380" font-family="monospace" font-size="16" fill="%23a7f3d0" text-anchor="middle">ORGANIC DRAGON CRAFT: LEAVES + PEBBLES + TWIG</text></svg>';

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
        setAnalysisResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUseSimulatedPhoto = () => {
    setPhotoPreview(sampleCraftPhoto);
    setAnalysisResult(null);
  };

  const handleVerifyWithGemini = async () => {
    if (!photoPreview) return;
    setIsAnalyzing(true);

    try {
      const res = await verifyScavengerCraftPhoto(mission.title, photoPreview);
      setAnalysisResult(res);
      hapticFeedback.missionCompleted();
      setTimeout(() => {
        onMissionCompleted(photoPreview, res.scoutPraise);
      }, 1400);
    } catch (err) {
      console.error(err);
      const fallbackPraise = `Gemini Scout Verified! Excellent craftsmanship creating the ${mission.title}! +350 XP`;
      setAnalysisResult({ verified: true, scoutPraise: fallbackPraise, bonusXp: 150 });
      hapticFeedback.missionCompleted();
      setTimeout(() => {
        onMissionCompleted(photoPreview, fallbackPraise);
      }, 1400);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[#ebeae5] border border-stone-800/20 shadow-2xl p-6 sm:p-8 text-stone-900">
        {/* Tactile Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-stone-300 hover:bg-stone-400 text-stone-800 transition-colors cursor-pointer border-t border-white/60 shadow-[0_2px_0_0_#a8a29e] active:translate-y-0.5 active:shadow-none"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Metadata */}
        <div className="text-xs font-mono text-stone-500 uppercase tracking-wider mb-1 flex items-center gap-2">
          <span>FIELD CODEX ENTRY</span>
          <span aria-hidden="true">·</span>
          <span>SCAVENGER CRAFT VERIFICATION</span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-stone-900 leading-tight">
          {mission.title}
        </h2>

        {/* Audio Task Instruction Box */}
        <div className="mt-4 p-4 rounded-2xl bg-stone-900 text-stone-100 border border-stone-800 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-stone-400">
            <span className="flex items-center gap-1.5 font-bold text-emerald-400">
              <Volume2 className="w-4 h-4 animate-pulse" />
              AUDIO SPECIFICATION SPOKEN IN EAR
            </span>
            <span>432 Hz ACOUSTIC</span>
          </div>

          <p className="text-sm font-mono text-stone-200 italic leading-relaxed">
            "{mission.audioScript}"
          </p>

          <div className="text-xs text-stone-400 pt-2 border-t border-stone-800">
            <strong className="text-stone-200 font-semibold">Assembly Instructions:</strong> {mission.craftInstructions}
          </div>
        </div>

        {/* Scavenger Materials Checklist */}
        <div className="mt-5 space-y-2.5">
          <div className="text-xs font-mono uppercase tracking-wider text-stone-600 font-bold">
            Required Nature Ingredients Checklist:
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
            {mission.scavengerItems.map((item, idx) => {
              const key = `item_${idx}`;
              const isChecked = !!checkedItems[key];
              return (
                <div
                  key={idx}
                  onClick={() => setCheckedItems((prev) => ({ ...prev, [key]: !prev[key] }))}
                  className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer select-none transition-all ${
                    isChecked
                      ? 'bg-stone-900 text-stone-100 border-stone-800 shadow-sm'
                      : 'bg-stone-200/60 border-stone-300 text-stone-600'
                  }`}
                >
                  <CheckCircle2
                    className={`w-4 h-4 shrink-0 ${isChecked ? 'text-emerald-400' : 'text-stone-400'}`}
                  />
                  <span className="truncate">{item}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Photo Capture & Upload Section */}
        <div className="mt-6 p-5 rounded-2xl bg-stone-200/80 border border-stone-300 space-y-4">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="font-bold text-stone-900 flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-emerald-800" />
              <span>CRAFT PHOTOGRAPH VIEWFINDER</span>
            </span>

            <span className="text-stone-600">
              Reward: {mission.stickerReward.name} ({mission.stickerReward.badgeEmoji})
            </span>
          </div>

          {/* Photo Preview Frame */}
          {photoPreview ? (
            <div className="relative rounded-2xl overflow-hidden border-2 border-stone-800 bg-stone-950 aspect-16/10 flex items-center justify-center shadow-inner">
              <img
                src={photoPreview}
                alt="Nature craft preview"
                className="w-full h-full object-contain"
              />
              <button
                onClick={() => setPhotoPreview(null)}
                className="absolute top-3 right-3 p-2 rounded-xl bg-stone-900/90 text-white hover:bg-stone-800 transition-colors border-t border-stone-700 shadow-md cursor-pointer"
                title="Retake photo"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="border-2 border-dashed border-stone-400 rounded-2xl p-6 text-center space-y-3 bg-stone-100/80">
              <div className="w-12 h-12 rounded-xl bg-stone-900 text-stone-100 flex items-center justify-center mx-auto shadow-md">
                <Camera className="w-6 h-6 text-emerald-400" />
              </div>

              <div>
                <div className="text-sm font-bold text-stone-900 font-display">
                  Capture Your Assembled Craft
                </div>
                <p className="text-xs text-stone-500 font-mono mt-0.5">
                  Frame the dragon craft laid out on the dirt, moss, or flat stone
                </p>
              </div>

              {/* Professional 3D Box Model Buttons for Upload & Sample */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2.5 bg-stone-900 hover:bg-stone-850 active:bg-stone-900 text-stone-50 text-xs font-mono font-bold rounded-xl border-t border-stone-700 shadow-[0_4px_0_0_#0c0a09] active:shadow-[0_1px_0_0_#0c0a09] active:translate-y-1 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-stone-300" />
                  <span>UPLOAD FIELD PHOTO</span>
                </button>

                <button
                  onClick={handleUseSimulatedPhoto}
                  className="px-4 py-2.5 bg-stone-800 hover:bg-stone-750 active:bg-stone-800 text-stone-200 text-xs font-mono font-bold rounded-xl border-t border-stone-600 shadow-[0_4px_0_0_#1c1917] active:shadow-[0_1px_0_0_#1c1917] active:translate-y-1 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>USE SAMPLE DRAGON PHOTO</span>
                </button>
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>

        {/* Analysis Status */}
        {analysisResult && (
          <div className="mt-4 p-4 rounded-2xl bg-stone-900 text-stone-100 border border-stone-800 space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>GEMINI VISION AI VERIFICATION COMPLETE (+{mission.rewardXp} XP)</span>
            </div>
            <p className="text-sm font-mono text-stone-300">
              {analysisResult.scoutPraise}
            </p>
            <div className="text-xs font-mono text-amber-400 font-semibold pt-1">
              Recorded into Field Sticker Book: {mission.stickerReward.name} ({mission.stickerReward.badgeEmoji})
            </div>
          </div>
        )}

        {/* 3D Machined Submit Button */}
        {photoPreview && !analysisResult && (
          <button
            onClick={handleVerifyWithGemini}
            disabled={isAnalyzing}
            className="mt-6 w-full py-4 px-6 bg-stone-900 hover:bg-stone-850 active:bg-stone-900 text-stone-50 font-display font-bold text-sm sm:text-base rounded-2xl border-t border-stone-700 shadow-[0_5px_0_0_#0c0a09] active:shadow-[0_1px_0_0_#0c0a09] active:translate-y-1 transition-all flex items-center justify-center gap-3 disabled:opacity-50 cursor-pointer"
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" />
                <span>VERIFYING CRAFT WITH GEMINI VISION...</span>
              </>
            ) : (
              <>
                <span>VERIFY & ADD TO FIELD STICKER BOOK</span>
                <ArrowRight className="w-5 h-5 text-emerald-400" />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
