import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  CameraStream,
  IncidenteSeguranca
} from '../types';
import {
  Maximize2,
  Minimize2,
  X,
  Keyboard,
  Play,
  Pause,
  Grid,
  Sun,
  Lightbulb,
  BellRing,
  RotateCcw,
  Volume2,
  ShieldAlert
} from 'lucide-react';
import { soundAndVoice } from '../utils/soundAndVoice';

export type WallboardLayout = 'SINGLE' | 'GRID_4' | 'GRID_6' | 'FOCUS_1_PLUS_5';

interface CleanCCTVWallboardProps {
  cameras: CameraStream[];
  incidentes: IncidenteSeguranca[];
  selectedCamId: string;
  onSelectCamera: (camId: string) => void;
  onToggleCameraLight: (camId: string) => void;
  onToggleCameraSiren: (camId: string) => void;
  onExitWallboard: () => void;
  voiceEnabled: boolean;
}

export const CleanCCTVWallboard: React.FC<CleanCCTVWallboardProps> = ({
  cameras,
  incidentes,
  selectedCamId,
  onSelectCamera,
  onToggleCameraLight,
  onToggleCameraSiren,
  onExitWallboard,
  voiceEnabled
}) => {
  const [layout, setLayout] = useState<WallboardLayout>('SINGLE');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [autoCycle, setAutoCycle] = useState(false);
  const [cycleIntervalSec, setCycleIntervalSec] = useState(6);
  const [nightBoost, setNightBoost] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showMouseControls, setShowMouseControls] = useState(true);
  const [osdMessage, setOsdMessage] = useState<string | null>(
    'MODO TELÃO ATIVO • Teclas 1 a 6 trocam câmeras • M alterna Mosaico • F tela cheia • H ajuda'
  );

  // Zoom & Pan PTZ digital para a câmera selecionada
  const [zoom, setZoom] = useState<number>(1.0);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOrigin, setDragOrigin] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const mouseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const osdTimerRef = useRef<NodeJS.Timeout | null>(null);

  const activeCam = cameras.find(c => c.id === selectedCamId) || cameras[0];
  const activeIncidente = incidentes.find(i => i.status === 'EM_ABERTO');

  const getCameraImage = (camId: string) => {
    if (camId === 'CAM-01' || camId === 'CAM-02') return '/cameras/cam-balanca.png';
    if (camId === 'CAM-04') return '/cameras/cam-forno.png';
    return '/cameras/cam-perimetro.png';
  };

  // Exibe mensagem OSD (On-Screen Display) que desaparece após 2.5s
  const triggerOsd = useCallback((msg: string) => {
    setOsdMessage(msg);
    if (osdTimerRef.current) clearTimeout(osdTimerRef.current);
    osdTimerRef.current = setTimeout(() => {
      setOsdMessage(null);
    }, 2500);
  }, []);

  // Timer inicial do OSD de boas-vindas (some após 4s)
  useEffect(() => {
    osdTimerRef.current = setTimeout(() => {
      setOsdMessage(null);
    }, 4500);
    return () => {
      if (osdTimerRef.current) clearTimeout(osdTimerRef.current);
    };
  }, []);

  // Auto-hide do cursor do mouse após 3.5 segundos sem movimento
  const handleMouseMove = useCallback(() => {
    setShowMouseControls(true);
    if (mouseTimerRef.current) clearTimeout(mouseTimerRef.current);
    mouseTimerRef.current = setTimeout(() => {
      setShowMouseControls(false);
    }, 3500);
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (mouseTimerRef.current) clearTimeout(mouseTimerRef.current);
    };
  }, [handleMouseMove]);

  // Alternador de Fullscreen nativo
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
        triggerOsd('TELA CHEIA NATIVA ATIVADA [F ou ESC]');
        soundAndVoice.playAlertSound('beep');
      }).catch(() => {
        setIsFullscreen(true);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => {
          setIsFullscreen(false);
          triggerOsd('TELA CHEIA FINALIZADA');
          soundAndVoice.playAlertSound('beep');
        });
      }
    }
  }, [triggerOsd]);

  // Sincroniza estado de fullscreen se o usuário sair via Esc padrão do navegador
  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  // Ronda Automática (Auto-Cycle entre câmeras a cada N segundos)
  useEffect(() => {
    if (!autoCycle || layout !== 'SINGLE') return;

    const interval = setInterval(() => {
      const curIdx = cameras.findIndex(c => c.id === activeCam.id);
      const nextIdx = (curIdx + 1) % cameras.length;
      const nextCam = cameras[nextIdx];
      onSelectCamera(nextCam.id);
      setZoom(1.0);
      setPanOffset({ x: 0, y: 0 });
      triggerOsd(`RONDA AUTOMÁTICA • ${nextCam.id} (${nextCam.nome})`);
    }, cycleIntervalSec * 1000);

    return () => clearInterval(interval);
  }, [autoCycle, layout, activeCam.id, cameras, cycleIntervalSec, onSelectCamera, triggerOsd]);

  // Controles de Teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignora se o usuário estiver digitando em um input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const key = e.key;

      // 1 a 6: Seleciona câmera direta
      if (['1', '2', '3', '4', '5', '6'].includes(key)) {
        const camIdx = parseInt(key, 10) - 1;
        if (cameras[camIdx]) {
          onSelectCamera(cameras[camIdx].id);
          setZoom(1.0);
          setPanOffset({ x: 0, y: 0 });
          soundAndVoice.playAlertSound('beep');
          triggerOsd(`CÂMERA SELECIONADA: ${cameras[camIdx].id} • ${cameras[camIdx].nome}`);
        }
        return;
      }

      // Seta Esquerda / Seta Direita ou A / D para trocar de câmera
      if (key === 'ArrowLeft' || key === 'a' || key === 'A') {
        const curIdx = cameras.findIndex(c => c.id === activeCam.id);
        const prevIdx = (curIdx - 1 + cameras.length) % cameras.length;
        onSelectCamera(cameras[prevIdx].id);
        setZoom(1.0);
        setPanOffset({ x: 0, y: 0 });
        soundAndVoice.playAlertSound('beep');
        triggerOsd(`${cameras[prevIdx].id} • ${cameras[prevIdx].nome}`);
        return;
      }

      if (key === 'ArrowRight' || key === 'd' || key === 'D') {
        const curIdx = cameras.findIndex(c => c.id === activeCam.id);
        const nextIdx = (curIdx + 1) % cameras.length;
        onSelectCamera(cameras[nextIdx].id);
        setZoom(1.0);
        setPanOffset({ x: 0, y: 0 });
        soundAndVoice.playAlertSound('beep');
        triggerOsd(`${cameras[nextIdx].id} • ${cameras[nextIdx].nome}`);
        return;
      }

      // M ou G: Alterna modos de Layout (Single -> Quad -> Hexa -> 1+5)
      if (key === 'm' || key === 'M' || key === 'g' || key === 'G') {
        setLayout(prev => {
          let next: WallboardLayout = 'SINGLE';
          if (prev === 'SINGLE') next = 'GRID_4';
          else if (prev === 'GRID_4') next = 'GRID_6';
          else if (prev === 'GRID_6') next = 'FOCUS_1_PLUS_5';
          else next = 'SINGLE';

          soundAndVoice.playAlertSound('beep');
          const names = {
            SINGLE: 'CÂMERA ÚNICA (100% TELA)',
            GRID_4: 'MOSAICO QUAD (2x2)',
            GRID_6: 'MOSAICO COMPLETO (3x2)',
            FOCUS_1_PLUS_5: 'DESTAQUE 1+5'
          };
          triggerOsd(`LAYOUT: ${names[next]}`);
          return next;
        });
        return;
      }

      // F ou Enter: Tela cheia
      if (key === 'f' || key === 'F' || key === 'Enter') {
        toggleFullscreen();
        return;
      }

      // Espaço: Ronda Automática (Auto-Cycle)
      if (key === ' ') {
        e.preventDefault();
        setAutoCycle(prev => {
          const next = !prev;
          soundAndVoice.playAlertSound('beep');
          triggerOsd(next ? `RONDA ATIVA (${cycleIntervalSec}s por câmera)` : 'RONDA PAUSADA');
          return next;
        });
        return;
      }

      // N: Ganho Noturno / Night Boost
      if (key === 'n' || key === 'N') {
        setNightBoost(prev => {
          const next = !prev;
          soundAndVoice.playAlertSound('beep');
          triggerOsd(next ? 'GANHO NOTURNO ATIVADO (ALTO CONTRASTE)' : 'IMAGEM PADRÃO');
          return next;
        });
        return;
      }

      // L: Holofote no poste
      if (key === 'l' || key === 'L') {
        onToggleCameraLight(activeCam.id);
        soundAndVoice.playAlertSound('beep');
        triggerOsd(`HOLOFOTE POSTE ${activeCam.id}: ${activeCam.holofoteLigado ? 'DESLIGADO' : 'LIGADO'}`);
        return;
      }

      // S: Sirene física
      if (key === 's' || key === 'S') {
        onToggleCameraSiren(activeCam.id);
        soundAndVoice.playAlertSound('beep');
        triggerOsd(`SIRENE FÍSICA ${activeCam.id}: ${activeCam.sireneLigada ? 'SILENCIADA' : 'DISPARADA'}`);
        return;
      }

      // + ou =: Zoom In
      if (key === '+' || key === '=') {
        setZoom(prev => {
          const next = Math.min(3.0, +(prev + 0.25).toFixed(2));
          triggerOsd(`ZOOM PTZ: ${next.toFixed(1)}x`);
          return next;
        });
        return;
      }

      // - ou _: Zoom Out
      if (key === '-' || key === '_') {
        setZoom(prev => {
          const next = Math.max(1.0, +(prev - 0.25).toFixed(2));
          if (next === 1.0) setPanOffset({ x: 0, y: 0 });
          triggerOsd(`ZOOM PTZ: ${next.toFixed(1)}x`);
          return next;
        });
        return;
      }

      // 0 ou R: Reset Zoom
      if (key === '0' || key === 'r' || key === 'R') {
        setZoom(1.0);
        setPanOffset({ x: 0, y: 0 });
        triggerOsd('ENQUADRAMENTO RESETADO (1.0x)');
        soundAndVoice.playAlertSound('beep');
        return;
      }

      // H ou ?: Ajuda de atalhos
      if (key === 'h' || key === 'H' || key === '?') {
        setShowHelp(prev => !prev);
        soundAndVoice.playAlertSound('beep');
        return;
      }

      // Escape: Se ajuda aberta, fecha ajuda; se fullscreen, sai de fullscreen; senão volta
      if (key === 'Escape') {
        if (showHelp) {
          setShowHelp(false);
          return;
        }
        if (document.fullscreenElement) {
          document.exitFullscreen();
          return;
        }
        onExitWallboard();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    activeCam,
    cameras,
    cycleIntervalSec,
    layout,
    onExitWallboard,
    onSelectCamera,
    onToggleCameraLight,
    onToggleCameraSiren,
    showHelp,
    toggleFullscreen,
    triggerOsd
  ]);

  // Arrastar vídeo para Pan quando com Zoom
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1.0) {
      setIsDragging(true);
      setDragOrigin({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  };

  const handleVideoDrag = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPanOffset({
      x: Math.max(-360, Math.min(360, e.clientX - dragOrigin.x)),
      y: Math.max(-240, Math.min(240, e.clientY - dragOrigin.y))
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.2 : -0.2;
    setZoom(prev => {
      const next = Math.min(3.0, Math.max(1.0, +(prev + delta).toFixed(2)));
      if (next === 1.0) setPanOffset({ x: 0, y: 0 });
      triggerOsd(`ZOOM PTZ: ${next.toFixed(1)}x`);
      return next;
    });
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      className={`fixed inset-0 z-50 w-screen h-screen bg-black overflow-hidden select-none ${
        !showMouseControls ? 'cursor-none' : 'cursor-default'
      }`}
    >
      {/* =====================================================================
          CAMADA DE VÍDEO DAS CÂMERAS (ZERO HUD, 100% PREENCHIMENTO)
         ===================================================================== */}
      {layout === 'SINGLE' && (
        <div
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleVideoDrag}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className={`w-full h-full relative overflow-hidden bg-black ${
            activeCam.status === 'ALERTA' ? 'ring-4 ring-inset ring-rose-500 ring-offset-0 animate-pulse' : ''
          }`}
        >
          <div
            style={{
              transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
              transformOrigin: 'center center',
              transition: isDragging ? 'none' : 'transform 100ms ease-out'
            }}
            className="w-full h-full relative"
          >
            <img
              src={getCameraImage(activeCam.id)}
              alt={activeCam.nome}
              draggable={false}
              className="w-full h-full object-cover"
              style={{
                filter: nightBoost
                  ? 'brightness(1.4) contrast(1.3) saturate(1.1)'
                  : 'contrast(1.06)'
              }}
            />

            {/* Reflexo do Holofote Físico */}
            {activeCam.holofoteLigado && (
              <div className="absolute inset-0 bg-amber-100/25 pointer-events-none animate-pulse" />
            )}
          </div>

          {/* Identificador Sutil no canto (visível apenas ao mover mouse) */}
          <div
            className={`absolute bottom-3 left-3 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 font-mono text-xs text-white flex items-center space-x-2 transition-opacity duration-300 pointer-events-none ${
              showMouseControls ? 'opacity-90' : 'opacity-0'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                activeCam.status === 'ALERTA' ? 'bg-rose-500 animate-ping' : 'bg-emerald-400'
              }`}
            />
            <span className="font-bold text-emerald-400">{activeCam.id}</span>
            <span>•</span>
            <span className="text-gray-200">{activeCam.nome}</span>
            <span className="text-gray-400 text-[10px]">({activeCam.resolucao} @ {activeCam.fps}fps)</span>
            {zoom > 1.0 && <span className="text-amber-400 font-bold ml-1">PTZ {zoom.toFixed(1)}x</span>}
          </div>
        </div>
      )}

      {layout === 'GRID_4' && (
        <div className="w-full h-full grid grid-cols-2 grid-rows-2 gap-1 bg-black p-1">
          {cameras.slice(0, 4).map(cam => {
            const isSel = cam.id === activeCam.id;
            const isAlert = cam.status === 'ALERTA';
            return (
              <div
                key={cam.id}
                onClick={() => {
                  onSelectCamera(cam.id);
                  setLayout('SINGLE');
                  soundAndVoice.playAlertSound('beep');
                  triggerOsd(`CÂMERA SELECIONADA: ${cam.id}`);
                }}
                className={`relative w-full h-full overflow-hidden bg-black cursor-pointer group ${
                  isAlert
                    ? 'ring-2 ring-rose-500 animate-pulse'
                    : isSel
                    ? 'ring-2 ring-emerald-500'
                    : ''
                }`}
              >
                <img
                  src={getCameraImage(cam.id)}
                  alt={cam.nome}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  style={{
                    filter: nightBoost
                      ? 'brightness(1.4) contrast(1.3) saturate(1.1)'
                      : 'contrast(1.06)'
                  }}
                />
                <div
                  className={`absolute bottom-2 left-2 bg-black/80 backdrop-blur-md px-2 py-1 rounded text-[11px] font-mono text-white flex items-center space-x-1.5 transition-opacity ${
                    showMouseControls ? 'opacity-90' : 'opacity-0'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${isAlert ? 'bg-rose-500' : 'bg-emerald-400'}`} />
                  <span className="font-bold text-emerald-400">{cam.id}</span>
                  <span className="text-gray-300">{cam.nome}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {layout === 'GRID_6' && (
        <div className="w-full h-full grid grid-cols-3 grid-rows-2 gap-1 bg-black p-1">
          {cameras.map(cam => {
            const isSel = cam.id === activeCam.id;
            const isAlert = cam.status === 'ALERTA';
            return (
              <div
                key={cam.id}
                onClick={() => {
                  onSelectCamera(cam.id);
                  setLayout('SINGLE');
                  soundAndVoice.playAlertSound('beep');
                  triggerOsd(`CÂMERA SELECIONADA: ${cam.id}`);
                }}
                className={`relative w-full h-full overflow-hidden bg-black cursor-pointer group ${
                  isAlert
                    ? 'ring-2 ring-rose-500 animate-pulse'
                    : isSel
                    ? 'ring-2 ring-emerald-500'
                    : ''
                }`}
              >
                <img
                  src={getCameraImage(cam.id)}
                  alt={cam.nome}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  style={{
                    filter: nightBoost
                      ? 'brightness(1.4) contrast(1.3) saturate(1.1)'
                      : 'contrast(1.06)'
                  }}
                />
                <div
                  className={`absolute bottom-2 left-2 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-mono text-white flex items-center space-x-1.5 transition-opacity ${
                    showMouseControls ? 'opacity-90' : 'opacity-0'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isAlert ? 'bg-rose-500' : 'bg-emerald-400'}`} />
                  <span className="font-bold text-emerald-400">{cam.id}</span>
                  <span className="text-gray-300">{cam.nome}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {layout === 'FOCUS_1_PLUS_5' && (
        <div className="w-full h-full flex gap-1 bg-black p-1">
          {/* Câmera Principal em Grande Destaque (75% da largura) */}
          <div
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleVideoDrag}
            onMouseUp={handleMouseUp}
            className={`flex-1 h-full relative overflow-hidden bg-black ${
              activeCam.status === 'ALERTA' ? 'ring-2 ring-rose-500 animate-pulse' : ''
            }`}
          >
            <div
              style={{
                transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
                transformOrigin: 'center center',
                transition: isDragging ? 'none' : 'transform 100ms ease-out'
              }}
              className="w-full h-full relative"
            >
              <img
                src={getCameraImage(activeCam.id)}
                alt={activeCam.nome}
                className="w-full h-full object-cover"
                style={{
                  filter: nightBoost
                    ? 'brightness(1.4) contrast(1.3) saturate(1.1)'
                    : 'contrast(1.06)'
                }}
              />
            </div>
            <div
              className={`absolute bottom-3 left-3 bg-black/80 backdrop-blur-md px-3 py-1 rounded text-xs font-mono text-white flex items-center space-x-2 transition-opacity ${
                showMouseControls ? 'opacity-90' : 'opacity-0'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${activeCam.status === 'ALERTA' ? 'bg-rose-500' : 'bg-emerald-400'}`} />
              <span className="font-bold text-emerald-400">{activeCam.id}</span>
              <span>{activeCam.nome}</span>
            </div>
          </div>

          {/* Faixa Lateral com as outras 5 câmeras */}
          <div className="w-72 h-full flex flex-col gap-1 overflow-y-auto">
            {cameras.map(cam => {
              const isSel = cam.id === activeCam.id;
              const isAlert = cam.status === 'ALERTA';
              return (
                <div
                  key={cam.id}
                  onClick={() => {
                    onSelectCamera(cam.id);
                    setZoom(1.0);
                    setPanOffset({ x: 0, y: 0 });
                    soundAndVoice.playAlertSound('beep');
                  }}
                  className={`flex-1 relative overflow-hidden bg-black cursor-pointer group ${
                    isAlert
                      ? 'ring-2 ring-rose-500'
                      : isSel
                      ? 'ring-2 ring-emerald-400'
                      : 'opacity-75 hover:opacity-100'
                  }`}
                >
                  <img
                    src={getCameraImage(cam.id)}
                    alt={cam.nome}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-1 left-1 bg-black/80 px-1.5 py-0.5 rounded text-[9px] font-mono text-white">
                    {cam.id}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =====================================================================
          MENSAGEM OSD FLUTUANTE (REFINADA E DISCRETA)
         ===================================================================== */}
      {osdMessage && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-night-950/85 backdrop-blur-md border border-night-700/80 text-gray-200 font-mono text-xs px-4 py-1.5 rounded-full shadow-xl z-50 pointer-events-none flex items-center space-x-2 animate-fadeIn">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span className="text-gray-300 font-medium tracking-wide">{osdMessage}</span>
        </div>
      )}

      {/* =====================================================================
          ALERTA PERIMETRAL VIVO (REFINADO E DISCRETO)
         ===================================================================== */}
      {activeIncidente && (
        <div className="absolute top-4 left-4 bg-night-950/85 backdrop-blur-md border border-rose-500/40 text-rose-300 font-mono text-xs px-3.5 py-1.5 rounded-lg shadow-xl z-50 flex items-center space-x-2 animate-fadeIn">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          <span className="font-semibold tracking-wide">VIOLAÇÃO MURO NORTE (P2-P3)</span>
          <span className="text-gray-400 text-[10px] hidden sm:inline">• Pressione 5</span>
        </div>
      )}

      {/* =====================================================================
          BARRA DE CONTROLES FLUTUANTE (APARECE APENAS AO MOVER O MOUSE)
         ===================================================================== */}
      <div
        className={`absolute top-4 right-4 z-50 flex items-center space-x-2 font-mono text-xs transition-opacity duration-300 ${
          showMouseControls ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <button
          onClick={() => {
            setAutoCycle(!autoCycle);
            soundAndVoice.playAlertSound('beep');
            triggerOsd(!autoCycle ? 'RONDA AUTOMÁTICA ATIVADA' : 'RONDA PAUSADA');
          }}
          className={`px-3 py-1.5 rounded-xl border flex items-center space-x-1.5 transition-all shadow-lg ${
            autoCycle
              ? 'bg-brand-500 text-night-950 border-brand-400 font-bold'
              : 'bg-black/80 text-gray-300 border-white/20 hover:text-white'
          }`}
          title="Ronda Automática (Espaço)"
        >
          {autoCycle ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          <span>{autoCycle ? 'Ronda Ativa' : 'Ronda'}</span>
        </button>

        <button
          onClick={() => {
            setLayout(prev => {
              if (prev === 'SINGLE') return 'GRID_6';
              if (prev === 'GRID_6') return 'GRID_4';
              return 'SINGLE';
            });
            soundAndVoice.playAlertSound('beep');
          }}
          className="px-3 py-1.5 rounded-xl bg-black/80 text-gray-300 border border-white/20 hover:text-white flex items-center space-x-1.5 transition-all shadow-lg"
          title="Alternar Mosaico (M)"
        >
          <Grid className="w-3.5 h-3.5 text-emerald-400" />
          <span>Layout (M)</span>
        </button>

        <button
          onClick={toggleFullscreen}
          className="p-2 rounded-xl bg-black/80 text-gray-300 border border-white/20 hover:text-white transition-all shadow-lg"
          title="Tela Cheia (F)"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4 text-emerald-400" /> : <Maximize2 className="w-4 h-4 text-emerald-400" />}
        </button>

        <button
          onClick={() => setShowHelp(prev => !prev)}
          className="px-2.5 py-1.5 rounded-xl bg-black/80 text-gray-300 border border-white/20 hover:text-white flex items-center space-x-1 transition-all shadow-lg"
          title="Mapa de Atalhos do Teclado (H ou ?)"
        >
          <Keyboard className="w-4 h-4 text-brand-400" />
          <span>Atalhos (H)</span>
        </button>

        <button
          onClick={onExitWallboard}
          className="px-3 py-1.5 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-500/60 text-rose-200 font-bold flex items-center space-x-1.5 transition-all shadow-lg"
          title="Sair do Telão (Esc)"
        >
          <X className="w-4 h-4 text-rose-400" />
          <span>Sair (Esc)</span>
        </button>
      </div>

      {/* =====================================================================
          MODAL DE AJUDA COM TODOS OS ATALHOS DE TECLADO (H ou ?) - REFINADO
         ===================================================================== */}
      {showHelp && (
        <div
          onClick={() => setShowHelp(false)}
          className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-6 animate-fadeIn"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="w-full max-w-lg bg-[#070F0B]/95 border border-white/10 rounded-2xl p-5 shadow-2xl font-mono space-y-4 text-slate-200"
          >
            <div className="flex items-center justify-between border-b border-night-800 pb-2.5">
              <div className="flex items-center space-x-2 text-brand-400">
                <Keyboard className="w-4 h-4" />
                <h3 className="font-bold text-xs tracking-wider text-white uppercase">CONTROLES POR TECLADO</h3>
              </div>
              <button
                onClick={() => setShowHelp(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-night-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-[11px]">
              <div className="space-y-2 bg-night-900/60 p-2.5 rounded-xl border border-night-800/80">
                <h4 className="font-bold text-emerald-400 text-[10px] uppercase tracking-wider border-b border-night-800/80 pb-1">Seleção & Mosaico</h4>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Câmeras 1 a 6:</span>
                  <span className="px-1.5 py-0.5 rounded bg-night-800 border border-night-700 text-brand-300 font-bold">1 a 6</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Próxima / Anterior:</span>
                  <span className="px-1.5 py-0.5 rounded bg-night-800 border border-night-700 text-brand-300 font-bold">←  → / A D</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Alternar Mosaico:</span>
                  <span className="px-1.5 py-0.5 rounded bg-night-800 border border-night-700 text-brand-300 font-bold">M / G</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Ronda Automática:</span>
                  <span className="px-1.5 py-0.5 rounded bg-night-800 border border-night-700 text-brand-300 font-bold">Espaço</span>
                </div>
              </div>

              <div className="space-y-2 bg-night-900/60 p-2.5 rounded-xl border border-night-800/80">
                <h4 className="font-bold text-emerald-400 text-[10px] uppercase tracking-wider border-b border-night-800/80 pb-1">PTZ & Hardware</h4>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Zoom In / Out:</span>
                  <span className="px-1.5 py-0.5 rounded bg-night-800 border border-night-700 text-brand-300 font-bold">+ / -</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Resetar Zoom:</span>
                  <span className="px-1.5 py-0.5 rounded bg-night-800 border border-night-700 text-brand-300 font-bold">0 / R</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Holofote Poste:</span>
                  <span className="px-1.5 py-0.5 rounded bg-night-800 border border-night-700 text-brand-300 font-bold">L</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Sirene Física:</span>
                  <span className="px-1.5 py-0.5 rounded bg-night-800 border border-night-700 text-brand-300 font-bold">S</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Ganho Noturno:</span>
                  <span className="px-1.5 py-0.5 rounded bg-night-800 border border-night-700 text-brand-300 font-bold">N</span>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center bg-night-900/60 px-3 py-2 rounded-xl border border-night-800/80 text-[11px]">
              <div className="flex items-center space-x-2">
                <span className="text-gray-400">Tela Cheia:</span>
                <span className="px-1.5 py-0.5 rounded bg-night-800 border border-night-700 text-brand-300 font-bold">F / Enter</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-gray-400">Sair do Telão:</span>
                <span className="px-1.5 py-0.5 rounded bg-night-800 border border-night-700 text-rose-300 font-bold">Esc</span>
              </div>
            </div>

            <button
              onClick={() => setShowHelp(false)}
              className="w-full py-2 rounded-xl bg-brand-500/20 hover:bg-brand-500/30 border border-brand-500/40 text-brand-300 font-bold text-xs uppercase tracking-wider transition-all"
            >
              Fechar Ajuda
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
