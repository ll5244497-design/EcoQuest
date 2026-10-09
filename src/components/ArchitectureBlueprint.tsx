import React, { useState } from 'react';
import { Check, Copy, Cpu, Globe, Radio, Server, Sparkles, Terminal } from 'lucide-react';

export const ArchitectureBlueprint: React.FC = () => {
  const [activeSnippet, setActiveSnippet] = useState<'server' | 'spatial' | 'shader'>('server');
  const [copied, setCopied] = useState(false);

  const serverSnippet = `// Backend: Express + Google Gemini Neural Voice Synthesis
import express from 'express';
import { GoogleGenAI } from '@google/genai';

const app = express();
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
});

// Real-Time Human Voice Synthesis endpoint
app.post('/api/voice-guide/speak', async (req, res) => {
  const { text, voiceName = 'Zephyr' } = req.body;

  // Synthesize with Google Gemini Neural Voice (gemini-3.8-flash-lite-tts)
  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash-lite-tts',
    contents: [{ role: 'user', parts: [{ text }] }],
    config: {
      responseModalities: ['AUDIO'],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName } }
      }
    }
  });

  const base64Wav = response.candidates[0].content.parts[0].inlineData.data;
  const wavBuffer = Buffer.from(base64Wav, 'base64');

  res.setHeader('Content-Type', 'audio/wav');
  res.end(wavBuffer);
});

app.listen(process.env.PORT || 3000, () => {
  console.log('EcoQuest Gemini Voice Gateway running');
});`;

  const spatialSnippet = `// Spatial Audio Compass: GPS Coordinates to StereoPannerNode Pan Value
export function calculateStereoPan(
  playerLat: number,
  playerLng: number,
  playerHeadingDeg: number, // From deviceorientation or GPS vector (0-360°)
  targetLat: number,
  targetLng: number
): { pan: number; distanceMeters: number; relativeAngleDeg: number } {
  // 1. Calculate Great-Circle Distance (Haversine formula)
  const R = 6371e3; // Earth radius in meters
  const dLat = (targetLat - playerLat) * (Math.PI / 180);
  const dLng = (targetLng - playerLng) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(playerLat * (Math.PI / 180)) *
      Math.cos(targetLat * (Math.PI / 180)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceMeters = Math.round(R * c);

  // 2. Calculate Bearing Angle to Target (0° = North, 90° = East)
  const y = Math.sin(dLng) * Math.cos(targetLat * (Math.PI / 180));
  const x =
    Math.cos(playerLat * (Math.PI / 180)) * Math.sin(targetLat * (Math.PI / 180)) -
    Math.sin(playerLat * (Math.PI / 180)) * Math.cos(targetLat * (Math.PI / 180)) * Math.cos(dLng);
  const bearingRad = Math.atan2(y, x);
  const bearingDeg = (bearingRad * (180 / Math.PI) + 360) % 360;

  // 3. Compute Relative Azimuth Angle relative to Player Heading
  let relativeAngle = bearingDeg - playerHeadingDeg;
  if (relativeAngle > 180) relativeAngle -= 360;
  if (relativeAngle < -180) relativeAngle += 360;

  // 4. Map Azimuth (-180° to +180°) to Web Audio StereoPannerNode [-1.0, 1.0]
  // Target on right (+90°) -> pan = +1.0
  // Target on left (-90°)  -> pan = -1.0
  // Target directly ahead (0°) or behind (180°) -> pan = 0.0
  const pan = Math.sin(relativeAngle * (Math.PI / 180));

  return {
    pan: Math.max(-1, Math.min(1, Number(pan.toFixed(3)))),
    distanceMeters,
    relativeAngleDeg: Math.round(relativeAngle),
  };
}`;

  const shaderSnippet = `// Three.js Audio-Reactive Companion Shader Script
import * as THREE from 'three';

export function createAudioReactivePetMaterial() {
  const uniforms = {
    uTime: { value: 0 },
    uAudioBass: { value: 0.0 }, // 20-250 Hz from AnalyserNode
    uAudioTreble: { value: 0.0 }, // 4000-16000 Hz
    uColorCore: { value: new THREE.Color('#10b981') },
    uColorSpore: { value: new THREE.Color('#6ee7b7') },
  };

  const vertexShader = \`
    uniform float uTime;
    uniform float uAudioBass;
    varying vec3 vNormal;
    varying vec3 vPosition;

    void main() {
      vNormal = normal;
      vec3 pos = position;
      
      // Pulse vertices along surface normal reacting to low-frequency audio
      float pulse = sin(pos.y * 8.0 + uTime * 4.0) * cos(pos.x * 8.0 + uTime * 3.0);
      pos += normal * (pulse * 0.08 * (1.0 + uAudioBass * 3.0));
      
      vPosition = pos;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  \`;

  const fragmentShader = \`
    uniform vec3 uColorCore;
    uniform vec3 uColorSpore;
    uniform float uAudioTreble;
    varying vec3 vNormal;
    varying vec3 vPosition;

    void main() {
      // Fresnel rim glow calculation
      vec3 viewDir = normalize(cameraPosition - vPosition);
      float fresnel = pow(1.0 - max(dot(viewDir, vNormal), 0.0), 2.5);
      
      // Treble spark reactivity
      vec3 finalColor = mix(uColorCore, uColorSpore, fresnel + (uAudioTreble * 0.5));
      gl_FragColor = vec4(finalColor, 0.9);
    }
  \`;

  return new THREE.ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader,
    transparent: true,
  });
}`;

  const getCode = () => {
    if (activeSnippet === 'server') return serverSnippet;
    if (activeSnippet === 'spatial') return spatialSnippet;
    return shaderSnippet;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="border-b border-stone-300 dark:border-stone-800 pb-6 mb-8">
        <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 block mb-1">
          TECHNICAL BLUEPRINT & INTEGRATION
        </span>
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight font-['Syne',sans-serif] text-stone-900 dark:text-white">
          System Workflow Architecture
        </h2>
        <p className="text-xs font-mono text-stone-500 mt-2 max-w-2xl">
          Tracing user actions from Live GPS updates through Express API Gateway, Gemini 3.8 conversational intelligence, to Gemini Neural Voice synthesis and Web Audio spectrum playback.
        </p>
      </div>

      {/* Interactive Step-by-Step System Flow */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-10">
        <div className="p-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
          <div className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold mb-2">
            STEP 01
          </div>
          <div className="text-sm font-semibold text-stone-900 dark:text-white mb-1">
            GPS Update
          </div>
          <p className="text-xs text-stone-500">
            HTML5 Geolocation watches player latitude, longitude, altitude & device heading vector.
          </p>
        </div>

        <div className="p-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
          <div className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold mb-2">
            STEP 02
          </div>
          <div className="text-sm font-semibold text-stone-900 dark:text-white mb-1">
            Render Gateway
          </div>
          <p className="text-xs text-stone-500">
            Node.js proxy secures API credentials, evaluates spatial proximity vectors, and syncs session state.
          </p>
        </div>

        <div className="p-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
          <div className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold mb-2">
            STEP 03
          </div>
          <div className="text-sm font-semibold text-stone-900 dark:text-white mb-1">
            Tinker LLM
          </div>
          <p className="text-xs text-stone-500">
            Generates concise (&lt;20 words) atmospheric, spoken responses tuned specifically for real-time TTS.
          </p>
        </div>

        <div className="p-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
          <div className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold mb-2">
            STEP 04
          </div>
          <div className="text-sm font-semibold text-stone-900 dark:text-white mb-1">
            Gemini Neural Voice
          </div>
          <p className="text-xs text-stone-500">
            Synthesizes warm human companion voices (Zephyr, Puck, Kore, Fenrir, Charon) with high-fidelity prosody and emotional cadence.
          </p>
        </div>

        <div className="p-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
          <div className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold mb-2">
            STEP 05
          </div>
          <div className="text-sm font-semibold text-stone-900 dark:text-white mb-1">
            Stereo Panning
          </div>
          <p className="text-xs text-stone-500">
            Web Audio StereoPannerNode shifts sound between left/right ears, pointing user to nature hands-free.
          </p>
        </div>
      </div>

      {/* Production Code Examples Viewer */}
      <div className="bg-stone-950 border border-stone-800 overflow-hidden text-stone-300">
        <div className="flex items-center justify-between px-4 py-3 border-b border-stone-800 bg-stone-900/60">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveSnippet('server')}
              className={`px-3 py-1 text-xs font-mono transition-colors ${
                activeSnippet === 'server'
                  ? 'bg-stone-800 text-emerald-400 font-semibold'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              1. Render Express WS Proxy
            </button>
            <button
              onClick={() => setActiveSnippet('spatial')}
              className={`px-3 py-1 text-xs font-mono transition-colors ${
                activeSnippet === 'spatial'
                  ? 'bg-stone-800 text-emerald-400 font-semibold'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              2. GPS StereoPannerNode Math
            </button>
            <button
              onClick={() => setActiveSnippet('shader')}
              className={`px-3 py-1 text-xs font-mono transition-colors ${
                activeSnippet === 'shader'
                  ? 'bg-stone-800 text-emerald-400 font-semibold'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              3. Three.js Audio Shader
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs font-mono text-stone-400 hover:text-white transition-colors px-2 py-1 bg-stone-800/80"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'COPIED' : 'COPY CODE'}</span>
          </button>
        </div>

        <pre className="p-5 text-xs font-mono overflow-x-auto leading-relaxed text-stone-300 bg-stone-950/90 max-h-[460px]">
          <code>{getCode()}</code>
        </pre>
      </div>
    </div>
  );
};
