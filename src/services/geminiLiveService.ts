// Client-Side Gemini Live API (gemini-3.8-live) Real-Time Voice Manager
// Manages bidirectional WebSocket streaming audio (16kHz PCM input, 24kHz PCM output)

export interface LiveSessionMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export type LiveSessionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'listening'
  | 'speaking'
  | 'error';

export interface LiveSessionState {
  status: LiveSessionStatus;
  isMicMuted: boolean;
  messages: LiveSessionMessage[];
  currentModelText: string;
  currentUserText: string;
  audioInputLevel: number; // 0 to 100 for VU meter
  errorMessage: string | null;
}

export class GeminiLiveService {
  private ws: WebSocket | null = null;
  private inputAudioCtx: AudioContext | null = null;
  private outputAudioCtx: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private scriptProcessor: ScriptProcessorNode | null = null;
  private nextStartTime: number = 0;
  private activeAudioNodes: AudioBufferSourceNode[] = [];
  private listeners: Set<(state: LiveSessionState) => void> = new Set();

  private state: LiveSessionState = {
    status: 'disconnected',
    isMicMuted: false,
    messages: [],
    currentModelText: '',
    currentUserText: '',
    audioInputLevel: 0,
    errorMessage: null,
  };

  public getState(): LiveSessionState {
    return { ...this.state };
  }

  public subscribe(listener: (state: LiveSessionState) => void): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  private notify() {
    const s = this.getState();
    this.listeners.forEach((l) => l(s));
  }

  public async connect(): Promise<boolean> {
    if (this.state.status === 'connected' || this.state.status === 'connecting') {
      return true;
    }

    this.stopPlayback();
    this.state.status = 'connecting';
    this.state.errorMessage = null;
    this.state.currentModelText = '';
    this.state.currentUserText = '';
    this.notify();

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/live`;

      const ws = new WebSocket(wsUrl);
      this.ws = ws;

      ws.onopen = async () => {
        console.log('[Gemini Live] WebSocket opened. Initializing audio capture...');
        this.state.status = 'connected';
        this.notify();
        await this.startMicrophoneCapture();
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'session_ready') {
            this.state.status = 'listening';
            this.notify();
          } else if (data.type === 'audio' && data.audio) {
            this.state.status = 'speaking';
            this.playAudioChunk24kHz(data.audio);
            this.notify();
          } else if (data.type === 'text') {
            if (data.role === 'model') {
              this.state.currentModelText = data.text;
              this.appendOrUpdateMessage('model', data.text);
            } else if (data.role === 'user') {
              this.state.currentUserText = data.text;
              this.appendOrUpdateMessage('user', data.text);
            }
            this.notify();
          } else if (data.type === 'interrupted') {
            console.log('[Gemini Live] Interruption received, clearing output queue');
            this.stopPlayback();
            this.state.status = 'listening';
            this.notify();
          } else if (data.type === 'error') {
            this.state.errorMessage = data.message || 'Live session error';
            this.state.status = 'error';
            this.notify();
          }
        } catch (e) {
          console.error('[Gemini Live] Error parsing server message:', e);
        }
      };

      ws.onerror = (e) => {
        console.error('[Gemini Live] WebSocket error:', e);
        this.state.status = 'error';
        this.state.errorMessage = 'Connection to Live API failed';
        this.notify();
      };

      ws.onclose = () => {
        console.log('[Gemini Live] WebSocket closed');
        this.disconnect();
      };

      return true;
    } catch (err: any) {
      console.error('[Gemini Live] Connect failed:', err);
      this.state.status = 'error';
      this.state.errorMessage = err.message || 'Failed to start Live session';
      this.notify();
      return false;
    }
  }

  public disconnect() {
    this.stopMicrophoneCapture();
    this.stopPlayback();

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.close();
    }
    this.ws = null;

    this.state.status = 'disconnected';
    this.state.audioInputLevel = 0;
    this.notify();
  }

  public toggleMute() {
    this.state.isMicMuted = !this.state.isMicMuted;
    this.notify();
  }

  public sendTextMessage(text: string) {
    if (!text.trim() || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.appendOrUpdateMessage('user', text.trim(), true);
    this.ws.send(JSON.stringify({ text: text.trim() }));
  }

  private appendOrUpdateMessage(role: 'user' | 'model', text: string, isFinal = false) {
    const last = this.state.messages[this.state.messages.length - 1];
    if (last && last.role === role && !isFinal) {
      last.text = text;
      last.timestamp = Date.now();
    } else {
      this.state.messages.push({
        id: `msg-${Date.now()}-${Math.random()}`,
        role,
        text,
        timestamp: Date.now(),
      });
    }
  }

  // 16kHz PCM Microphone Capture for Live API input
  private async startMicrophoneCapture() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
          sampleRate: 16000,
        },
      });
      this.mediaStream = stream;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const inputCtx = new AudioCtx({ sampleRate: 16000 });
      this.inputAudioCtx = inputCtx;

      const source = inputCtx.createMediaStreamSource(stream);
      // ScriptProcessor buffers 2048 float samples at 16kHz
      const processor = inputCtx.createScriptProcessor(2048, 1, 1);
      this.scriptProcessor = processor;

      processor.onaudioprocess = (e) => {
        if (this.state.isMicMuted || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
          this.state.audioInputLevel = 0;
          return;
        }

        const inputChannel = e.inputBuffer.getChannelData(0);

        // Calculate visual audio VU meter level
        let sum = 0;
        for (let i = 0; i < inputChannel.length; i++) {
          sum += Math.abs(inputChannel[i]);
        }
        const avg = sum / inputChannel.length;
        this.state.audioInputLevel = Math.min(100, Math.round(avg * 300));
        this.notify();

        // Convert Float32Array to 16-bit PCM little-endian Buffer
        const pcmBuffer = new Int16Array(inputChannel.length);
        for (let i = 0; i < inputChannel.length; i++) {
          const s = Math.max(-1, Math.min(1, inputChannel[i]));
          pcmBuffer[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }

        // Convert to base64
        const uint8 = new Uint8Array(pcmBuffer.buffer);
        let binary = '';
        for (let i = 0; i < uint8.byteLength; i++) {
          binary += String.fromCharCode(uint8[i]);
        }
        const base64Audio = btoa(binary);

        this.ws.send(JSON.stringify({ audio: base64Audio }));
      };

      source.connect(processor);
      processor.connect(inputCtx.destination);
    } catch (err: any) {
      console.warn('[Gemini Live] Mic capture notice:', err);
    }
  }

  private stopMicrophoneCapture() {
    if (this.scriptProcessor) {
      this.scriptProcessor.disconnect();
      this.scriptProcessor = null;
    }
    if (this.inputAudioCtx && this.inputAudioCtx.state !== 'closed') {
      try {
        this.inputAudioCtx.close();
      } catch (_) {}
      this.inputAudioCtx = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop());
      this.mediaStream = null;
    }
  }

  // 24kHz PCM Audio Playback for Live API output with scheduled gapless streaming
  private playAudioChunk24kHz(base64Audio: string) {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!this.outputAudioCtx || this.outputAudioCtx.state === 'closed') {
        this.outputAudioCtx = new AudioCtx({ sampleRate: 24000 });
        this.nextStartTime = this.outputAudioCtx.currentTime;
      }

      if (this.outputAudioCtx.state === 'suspended') {
        this.outputAudioCtx.resume();
      }

      const binary = atob(base64Audio);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const int16 = new Int16Array(bytes.buffer);

      const buffer = this.outputAudioCtx.createBuffer(1, int16.length, 24000);
      const channel = buffer.getChannelData(0);
      for (let i = 0; i < int16.length; i++) {
        channel[i] = int16[i] / 32768.0;
      }

      const source = this.outputAudioCtx.createBufferSource();
      source.buffer = buffer;
      source.connect(this.outputAudioCtx.destination);

      const currentTime = this.outputAudioCtx.currentTime;
      const startTime = Math.max(currentTime, this.nextStartTime);
      source.start(startTime);
      this.nextStartTime = startTime + buffer.duration;

      this.activeAudioNodes.push(source);
      source.onended = () => {
        const idx = this.activeAudioNodes.indexOf(source);
        if (idx !== -1) {
          this.activeAudioNodes.splice(idx, 1);
        }
        if (this.activeAudioNodes.length === 0 && this.state.status === 'speaking') {
          this.state.status = 'listening';
          this.notify();
        }
      };
    } catch (e) {
      console.warn('[Gemini Live] Audio playback decode error:', e);
    }
  }

  private stopPlayback() {
    this.activeAudioNodes.forEach((node) => {
      try {
        node.stop();
      } catch (_) {}
    });
    this.activeAudioNodes = [];
    if (this.outputAudioCtx) {
      this.nextStartTime = this.outputAudioCtx.currentTime;
    }
  }
}

export const geminiLiveService = new GeminiLiveService();
