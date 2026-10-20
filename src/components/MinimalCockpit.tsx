import React, { useState, useEffect } from 'react';
import {
  PontoRisco,
  IncidenteSeguranca,
  CameraStream,
  FuncionarioProdutividade,
  MaquinaOEE,
  VeiculoTelemetria,
  RegistroAcesso,
  PortaoSeguranca,
  AccessibilityConfig,
  PlantSpatialFocus
} from '../types';
import {
  Eye,
  ShieldAlert,
  ShieldCheck,
  KeyRound,
  Cpu,
  Users,
  Truck,
  Camera,
  Volume2,
  VolumeX,
  Lightbulb,
  BellRing,
  CheckCircle2,
  Maximize2,
  Minimize2,
  X,
  Box,
  Layers,
  ScanFace,
  LayoutGrid,
  Lock,
  Unlock
} from 'lucide-react';
import { soundAndVoice } from '../utils/soundAndVoice';
import { ArchitecturalPlantCanvas } from './ArchitecturalPlantCanvas';
import { ThreePlantScene } from './ThreePlantScene';
import { CameraAnalyticsScreen } from './CameraAnalyticsScreen';
import { AccessControlScreen } from './AccessControlScreen';

interface MinimalCockpitProps {
  pontos: PontoRisco[];
  incidentes: IncidenteSeguranca[];
  cameras: CameraStream[];
  funcionarios: FuncionarioProdutividade[];
  maquinas: MaquinaOEE[];
  veiculos: VeiculoTelemetria[];
  acessos: RegistroAcesso[];
  portoes?: PortaoSeguranca[];
  a11y: AccessibilityConfig;
  setA11y: React.Dispatch<React.SetStateAction<AccessibilityConfig>>;
  onSimulateIncident: () => void;
  onResolverIncidente: (id: string) => void;
  onTogglePortao?: (portaoId: string) => void;
  onToggleCameraLight: (camId: string) => void;
  onToggleCameraSiren: (camId: string) => void;
  onAddCameraAt: (x: number, y: number) => void;
  onBackToHub?: () => void;
  initialViewMode?: '3D_WEBGL' | '2D_CAD' | 'CAMERAS_IA' | 'ACESSOS_CADASTRO';
  hideFloatingHeader?: boolean;
  focusedCamId?: string;
  onSelectCamera?: (id: string) => void;
  spatialFocus?: PlantSpatialFocus;
  onUpdateSpatialFocus?: (focus: PlantSpatialFocus) => void;
}

export const MinimalCockpit: React.FC<MinimalCockpitProps> = ({
  incidentes,
  cameras,
  funcionarios,
  maquinas,
  veiculos,
  acessos,
  portoes = [],
  a11y,
  setA11y,
  onSimulateIncident,
  onResolverIncidente,
  onTogglePortao,
  onToggleCameraLight,
  onToggleCameraSiren,
  onAddCameraAt,
  onBackToHub,
  initialViewMode = '3D_WEBGL',
  hideFloatingHeader = false,
  focusedCamId: focusedCamIdProp,
  onSelectCamera: onSelectCameraProp,
  spatialFocus,
  onUpdateSpatialFocus
}) => {
  const [viewMode, setViewMode] = useState<'3D_WEBGL' | '2D_CAD' | 'CAMERAS_IA' | 'ACESSOS_CADASTRO'>(initialViewMode);

  // Sincroniza o modo de visão quando o usuário clica na barra lateral (Sidebar)
  useEffect(() => {
    if (initialViewMode) {
      setViewMode(initialViewMode);
    }
  }, [initialViewMode]);

  const [activeDrawer, setActiveDrawer] = useState<null | 'PORTOES' | 'MAQUINAS' | 'PESSOAS' | 'FROTAS' | 'CAMERAS'>(null);
  const [internalCamId, setInternalCamId] = useState<string>('CAM-05');
  const focusedCamId = focusedCamIdProp !== undefined ? focusedCamIdProp : internalCamId;
  const setFocusedCamId = (id: string) => {
    setInternalCamId(id);
    onSelectCameraProp?.(id);
  };
  const [pipExpanded, setPipExpanded] = useState(false);

  const activeIncidente = incidentes.find(i => i.status === 'EM_ABERTO');
  const focusedCam = cameras.find(c => c.id === focusedCamId) || cameras[0];
  const oeeMedio = Math.round(maquinas.reduce((acc, m) => acc + m.oee.oeeGeral, 0) / maquinas.length);

  const getCameraImage = (camId: string) => {
    if (camId === 'CAM-01' || camId === 'CAM-02') return '/cameras/cam-balanca.png';
    if (camId === 'CAM-04') return '/cameras/cam-forno.png';
    return '/cameras/cam-perimetro.png';
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#040A07] select-none">
      {/* =====================================================================
          CAMADA 0: CENA 3D WEBGL / PLANTA 2D CAD / CÂMERAS / PORTARIA & FACIAL
         ===================================================================== */}
      {viewMode === '3D_WEBGL' ? (
        <ThreePlantScene
          cameras={cameras}
          funcionarios={funcionarios}
          maquinas={maquinas}
          veiculos={veiculos}
          portoes={portoes}
          incidentes={incidentes}
          focusedCamId={focusedCamId}
          onSelectCamera={(id) => setFocusedCamId(id)}
          onSelectSector={(sec) => setActiveDrawer(sec)}
          onTogglePortao={onTogglePortao}
          onAddCameraAt={onAddCameraAt}
          onSimulateIncident={onSimulateIncident}
          voiceEnabled={a11y.voiceAlertsEnabled}
          spatialFocus={spatialFocus}
          onUpdateSpatialFocus={onUpdateSpatialFocus}
          onSwitchTo2D={() => {
            setViewMode('2D_CAD');
            soundAndVoice.playAlertSound('beep');
          }}
        />
      ) : viewMode === '2D_CAD' ? (
        <ArchitecturalPlantCanvas
          cameras={cameras}
          funcionarios={funcionarios}
          maquinas={maquinas}
          veiculos={veiculos}
          portoes={portoes}
          incidentes={incidentes}
          focusedCamId={focusedCamId}
          onSelectCamera={(id) => setFocusedCamId(id)}
          onSelectSector={(sec) => setActiveDrawer(sec)}
          onTogglePortao={onTogglePortao}
          onAddCameraAt={onAddCameraAt}
          onSimulateIncident={onSimulateIncident}
          voiceEnabled={a11y.voiceAlertsEnabled}
          spatialFocus={spatialFocus}
          onUpdateSpatialFocus={onUpdateSpatialFocus}
        />
      ) : viewMode === 'CAMERAS_IA' ? (
        <CameraAnalyticsScreen
          cameras={cameras}
          incidentes={incidentes}
          selectedCamId={focusedCamId}
          onSelectCamera={(id) => setFocusedCamId(id)}
          onToggleCameraLight={onToggleCameraLight}
          onToggleCameraSiren={onToggleCameraSiren}
          onSimulateIncident={onSimulateIncident}
          onResolverIncidente={onResolverIncidente}
          voiceEnabled={a11y.voiceAlertsEnabled}
        />
      ) : (
        <AccessControlScreen
          funcionarios={funcionarios}
          acessos={acessos}
          voiceEnabled={a11y.voiceAlertsEnabled}
        />
      )}

      {/* =====================================================================
          CAMADA 1: TOP HUD FLUTUANTE (Opcional, omitido quando em ERP layout lateral)
         ===================================================================== */}
      {!hideFloatingHeader && (
        <header className="fixed top-4 inset-x-4 z-30 px-4 py-2 rounded-2xl bg-night-950/90 backdrop-blur-md border border-night-700/80 flex items-center justify-between flex-wrap gap-3 shadow-2xl pointer-events-auto">
          <div className="flex items-center space-x-3">
            {onBackToHub && (
              <button
                onClick={() => {
                  soundAndVoice.playAlertSound('beep');
                  onBackToHub();
                }}
                className="px-2.5 py-1 rounded-xl bg-night-900 hover:bg-night-850 text-gray-300 hover:text-white border border-night-700 text-[10px] font-mono flex items-center space-x-1.5 transition-all shadow-xs"
                title="Voltar para a Grade Geral de Módulos CopperOS"
              >
                <LayoutGrid className="w-3.5 h-3.5 text-brand-400" />
                <span className="hidden sm:inline">MÓDULOS COPPEROS</span>
              </button>
            )}

            <div className="w-8 h-8 rounded-xl bg-brand-500 flex items-center justify-center text-night-950 shadow-glow-brand">
              <Eye className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-mono font-bold text-sm tracking-wider text-white">
                COPPER<span className="text-brand-400">GUARD</span>
              </span>

              <div className="flex items-center bg-night-900 p-0.5 rounded-lg border border-night-700 text-[10px] font-mono">
                <button
                  onClick={() => {
                    setViewMode('3D_WEBGL');
                    soundAndVoice.playAlertSound('beep');
                  }}
                  className={`px-2 py-0.5 rounded-md flex items-center space-x-1 transition-all ${
                    viewMode === '3D_WEBGL'
                      ? 'bg-brand-500 text-night-950 font-bold'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Box className="w-3 h-3" />
                  <span>MAQUETE 3D</span>
                </button>
                <button
                  onClick={() => {
                    setViewMode('2D_CAD');
                    soundAndVoice.playAlertSound('beep');
                  }}
                  className={`px-2 py-0.5 rounded-md flex items-center space-x-1 transition-all ${
                    viewMode === '2D_CAD'
                      ? 'bg-brand-500 text-night-950 font-bold'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Layers className="w-3 h-3" />
                  <span>PLANTA 2D CAD</span>
                </button>
                <button
                  onClick={() => {
                    setViewMode('CAMERAS_IA');
                    soundAndVoice.playAlertSound('beep');
                  }}
                  className={`px-2.5 py-0.5 rounded-md flex items-center space-x-1 transition-all ${
                    viewMode === 'CAMERAS_IA'
                      ? 'bg-brand-500 text-night-950 font-bold shadow-glow-brand'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Camera className="w-3 h-3" />
                  <span>CENTRAL CÂMERAS</span>
                </button>
                <button
                  onClick={() => {
                    setViewMode('ACESSOS_CADASTRO');
                    soundAndVoice.playAlertSound('beep');
                  }}
                  className={`px-2.5 py-0.5 rounded-md flex items-center space-x-1 transition-all ${
                    viewMode === 'ACESSOS_CADASTRO'
                      ? 'bg-brand-500 text-night-950 font-bold shadow-glow-brand'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <ScanFace className="w-3 h-3" />
                  <span>PORTARIA, FACIAL &amp; LINKS</span>
                </button>
              </div>

              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold flex items-center space-x-1 ${
                  activeIncidente
                    ? 'bg-rose-500 text-white animate-pulse'
                    : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                }`}
              >
                {activeIncidente ? (
                  <>
                    <ShieldAlert className="w-3 h-3" />
                    <span>ALARME: MURO NORTE VIOLADO (P2-P3)</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3 h-3" />
                    <span>PERÍMETRO 100% SEGURO</span>
                  </>
                )}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2 flex-wrap">
            <button
              onClick={() => setActiveDrawer(activeDrawer === 'PORTOES' ? null : 'PORTOES')}
              className={`px-3 py-1.5 rounded-xl border text-xs font-mono flex items-center space-x-2 transition-all ${
                activeDrawer === 'PORTOES'
                  ? 'bg-brand-500/20 border-brand-400 text-white'
                  : 'bg-night-900/90 border-night-800 text-gray-200 hover:border-night-700'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5 text-sky-400" />
              <span>{portoes.length} Portões</span>
            </button>

            <button
              onClick={() => setActiveDrawer(activeDrawer === 'MAQUINAS' ? null : 'MAQUINAS')}
              className={`px-3 py-1.5 rounded-xl border text-xs font-mono flex items-center space-x-2 transition-all ${
                activeDrawer === 'MAQUINAS'
                  ? 'bg-brand-500/20 border-brand-400 text-white'
                  : 'bg-night-900/90 border-night-800 text-gray-200 hover:border-night-700'
              }`}
            >
              <Cpu className="w-3.5 h-3.5 text-brand-400" />
              <span>OEE {oeeMedio}%</span>
            </button>

            <button
              onClick={() => setActiveDrawer(activeDrawer === 'PESSOAS' ? null : 'PESSOAS')}
              className={`px-3 py-1.5 rounded-xl border text-xs font-mono flex items-center space-x-2 transition-all ${
                activeDrawer === 'PESSOAS'
                  ? 'bg-brand-500/20 border-brand-400 text-white'
                  : 'bg-night-900/90 border-night-800 text-gray-200 hover:border-night-700'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-blue-400" />
              <span>{funcionarios.length} RFIDs</span>
            </button>

            <button
              onClick={() => setActiveDrawer(activeDrawer === 'FROTAS' ? null : 'FROTAS')}
              className={`px-3 py-1.5 rounded-xl border text-xs font-mono flex items-center space-x-2 transition-all ${
                activeDrawer === 'FROTAS'
                  ? 'bg-brand-500/20 border-brand-400 text-white'
                  : 'bg-night-900/90 border-night-800 text-gray-200 hover:border-night-700'
              }`}
            >
              <Truck className="w-3.5 h-3.5 text-amber-400" />
              <span>{veiculos.length} Frotas</span>
            </button>

            <button
              onClick={() => setActiveDrawer(activeDrawer === 'CAMERAS' ? null : 'CAMERAS')}
              className={`px-3 py-1.5 rounded-xl border text-xs font-mono flex items-center space-x-2 transition-all ${
                activeDrawer === 'CAMERAS'
                  ? 'bg-brand-500/20 border-brand-400 text-white'
                  : 'bg-night-900/90 border-night-800 text-gray-200 hover:border-night-700'
              }`}
            >
              <Camera className="w-3.5 h-3.5 text-brand-400" />
              <span>{cameras.length} CFTV</span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            {activeIncidente && (
              <button
                onClick={() => onResolverIncidente(activeIncidente.id)}
                className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-night-950 font-mono font-bold text-xs flex items-center space-x-1.5 shadow-glow-brand"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>SILENCIAR [ESPAÇO]</span>
              </button>
            )}

            <button
              onClick={() => setA11y(prev => ({ ...prev, voiceAlertsEnabled: !prev.voiceAlertsEnabled }))}
              className={`p-2 rounded-xl border transition-all ${
                a11y.voiceAlertsEnabled
                  ? 'bg-brand-500/15 border-brand-500/40 text-brand-300'
                  : 'bg-night-900 border-night-800 text-gray-500'
              }`}
              title="Avisos Sonoros por Voz IA (Português)"
            >
              {a11y.voiceAlertsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>
        </header>
      )}

      {/* =====================================================================
          CAMADA 2: PICTURE-IN-PICTURE (PiP) DA CÂMERA EM FOCO (Apenas no 3D/2D)
         ===================================================================== */}
      {(viewMode === '3D_WEBGL' || viewMode === '2D_CAD') && (
        <div
          className={`absolute right-5 bottom-20 z-30 rounded-2xl bg-night-950/90 backdrop-blur-md border overflow-hidden shadow-2xl transition-all duration-300 ${
            focusedCam.status === 'ALERTA' ? 'border-rose-500 shadow-glow-rose' : 'border-night-700'
          } ${pipExpanded ? 'w-[540px] h-[350px]' : 'w-[320px] h-[205px]'}`}
        >
          <div className="px-3 py-1.5 bg-night-950 border-b border-night-800 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center space-x-2 truncate">
              <span
                className={`w-2 h-2 rounded-full ${
                  focusedCam.status === 'ALERTA' ? 'bg-rose-500 animate-ping' : 'bg-emerald-400'
                }`}
              />
              <span className="font-bold text-brand-400">{focusedCam.id}</span>
              <span className="text-gray-200 truncate text-[11px]">{focusedCam.nome}</span>
            </div>
            <button
              onClick={() => setPipExpanded(!pipExpanded)}
              className="p-1 text-gray-400 hover:text-white rounded"
            >
              {pipExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="relative w-full h-[calc(100%-68px)] bg-black overflow-hidden">
            <img
              src={getCameraImage(focusedCam.id)}
              alt={focusedCam.nome}
              className="w-full h-full object-cover opacity-90"
            />
            {focusedCam.holofoteLigado && (
              <div className="absolute inset-0 bg-amber-100/20 pointer-events-none animate-pulse" />
            )}
            <div
              className={`absolute inset-x-4 bottom-5 h-0.5 ${
                focusedCam.status === 'ALERTA' ? 'bg-rose-500 shadow-glow-rose' : 'bg-brand-400/70'
              }`}
            />
            <div className="absolute top-2 left-2 bg-night-950/80 backdrop-blur px-2 py-0.5 rounded text-[10px] font-mono text-gray-200 border border-night-800">
              LIVE • {focusedCam.ip}
            </div>
          </div>

          <div className="px-3 py-1.5 bg-night-950 border-t border-night-800 flex items-center justify-between text-[11px] font-mono">
            <div className="flex items-center space-x-1.5">
              <button
                onClick={() => {
                  onToggleCameraLight(focusedCam.id);
                  soundAndVoice.playAlertSound('beep');
                }}
                className={`px-2 py-0.5 rounded border flex items-center space-x-1 ${
                  focusedCam.holofoteLigado
                    ? 'bg-amber-500/20 text-amber-300 border-amber-400'
                    : 'bg-night-900 text-gray-400 border-night-800 hover:text-white'
                }`}
              >
                <Lightbulb className="w-3 h-3" />
                <span>Luz</span>
              </button>

              <button
                onClick={() => {
                  onToggleCameraSiren(focusedCam.id);
                  soundAndVoice.playAlertSound('critical');
                }}
                className={`px-2 py-0.5 rounded border flex items-center space-x-1 ${
                  focusedCam.sireneLigada
                    ? 'bg-rose-600 text-white border-rose-400 animate-pulse'
                    : 'bg-night-900 text-gray-400 border-night-800 hover:text-white'
                }`}
              >
                <BellRing className="w-3 h-3" />
                <span>Sirene</span>
              </button>

              <button
                onClick={() => {
                  soundAndVoice.playAlertSound('warning');
                  soundAndVoice.speakAlert(
                    `Atenção! Área restrita monitorada pela câmera ${focusedCam.id}. Afaste-se do perímetro.`,
                    true
                  );
                }}
                className="px-2 py-0.5 rounded border bg-night-900 text-brand-300 border-night-800 hover:border-brand-500/40 flex items-center space-x-1"
              >
                <Volume2 className="w-3 h-3" />
                <span>Voz IP</span>
              </button>
            </div>

            <button
              onClick={() => {
                setViewMode('CAMERAS_IA');
                soundAndVoice.playAlertSound('beep');
              }}
              className="text-brand-400 hover:underline text-[10px] font-bold"
            >
              Abrir Central ({cameras.length})
            </button>
          </div>
        </div>
      )}

      {/* =====================================================================
          CAMADA 3: GAVETA LATERAL MINIMALISTA SOB DEMANDA
         ===================================================================== */}
      {activeDrawer && (
        <div className="absolute top-5 right-5 bottom-5 w-[380px] z-40 rounded-2xl bg-night-950/95 backdrop-blur-xl border border-night-700 shadow-2xl p-4 flex flex-col justify-between overflow-y-auto">
          <div>
            <div className="flex items-center justify-between border-b border-night-800 pb-3 mb-4">
              <span className="font-mono font-bold text-xs text-brand-400 uppercase">
                {activeDrawer === 'PORTOES' && 'Controle de Portões, Cancelas & Eclusas'}
                {activeDrawer === 'MAQUINAS' && 'Telemetria de Máquinas & OEE'}
                {activeDrawer === 'PESSOAS' && 'Produtividade & Crachás RFID'}
                {activeDrawer === 'FROTAS' && 'Frotas Internas & Horímetros'}
                {activeDrawer === 'CAMERAS' && 'Matriz de Câmeras CFTV'}
              </span>
              <button
                onClick={() => setActiveDrawer(null)}
                className="p-1 text-gray-400 hover:text-white rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {activeDrawer === 'PORTOES' && (
              <div className="space-y-3 text-xs font-mono">
                {portoes.map(g => {
                  const isOpen = g.status === 'ABERTO';
                  return (
                    <div key={g.id} className="p-3 rounded-xl bg-night-900 border border-night-800 space-y-2">
                      <div className="flex justify-between items-center">
                        <strong className="text-white font-sans text-xs">{g.nome}</strong>
                        <span className={isOpen ? 'text-amber-300 font-bold text-[10px]' : 'text-emerald-400 font-bold text-[10px]'}>
                          {isOpen ? 'ABERTO' : 'TRAVADO'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-gray-400">
                        <span>{g.quadra}</span>
                        <span>IVA: {g.sensorBarreiraIVA}</span>
                      </div>
                      {onTogglePortao && (
                        <button
                          onClick={() => onTogglePortao(g.id)}
                          className={`w-full py-1.5 rounded-lg text-[11px] font-bold flex items-center justify-center space-x-1.5 ${
                            isOpen
                              ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                              : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40'
                          }`}
                        >
                          {isOpen ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                          <span>{isOpen ? 'Fechar & Travar Portão' : 'Abrir Portão Remotamente'}</span>
                        </button>
                      )}
                    </div>
                  );
                })}

                <span className="text-[10px] text-gray-400 block uppercase pt-2">Entradas e Saídas Recentes:</span>
                {acessos.map(a => (
                  <div key={a.id} className="p-2.5 rounded-xl bg-night-900/70 border border-night-800 flex items-center justify-between">
                    <div>
                      <strong className="text-brand-300 block">{a.placaOuDoc}</strong>
                      <span className="text-[11px] text-gray-300 font-sans">{a.nomePessoa}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-white font-bold block">{a.horarioEntrada}</span>
                      <span className="text-[10px] text-gray-400">{a.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeDrawer === 'MAQUINAS' && (
              <div className="space-y-2.5 text-xs font-mono">
                {maquinas.map(m => (
                  <div key={m.id} className="p-3 rounded-xl bg-night-900 border border-night-800">
                    <div className="flex justify-between">
                      <strong className="text-white font-sans">{m.nome}</strong>
                      <span className="text-brand-400 font-bold">OEE {m.oee.oeeGeral}%</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-gray-400 mt-1.5">
                      <span>Horímetro: {m.horasTrabalhadasTurno}h / {m.horasDisponiveis}h</span>
                      <span>{m.temperaturaAtualC ? `${m.temperaturaAtualC} °C` : m.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeDrawer === 'PESSOAS' && (
              <div className="space-y-2.5 text-xs font-mono">
                {funcionarios.map(f => (
                  <div key={f.id} className="p-3 rounded-xl bg-night-900 border border-night-800">
                    <div className="flex justify-between">
                      <strong className="text-white font-sans">{f.nome}</strong>
                      <span className="text-emerald-400 font-bold">{f.eficienciaPercentual}%</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-gray-400 mt-1">
                      <span>{f.cargo}</span>
                      <span>{f.horasTrabalhadasHoje}h trab.</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeDrawer === 'FROTAS' && (
              <div className="space-y-2.5 text-xs font-mono">
                {veiculos.map(v => (
                  <div key={v.id} className="p-3 rounded-xl bg-night-900 border border-night-800">
                    <div className="flex justify-between">
                      <strong className="text-amber-300">{v.prefixo} • {v.modelo}</strong>
                      <span className={v.alertaExcessoVelocidade ? 'text-rose-400 font-bold' : 'text-white'}>
                        {v.velocidadeAtualKmH} km/h
                      </span>
                    </div>
                    <div className="flex justify-between text-[11px] text-gray-400 mt-1">
                      <span>Op: {v.operadorAtual}</span>
                      <span>Ativo: {v.horasOperandoTurno}h | Ocioso: {v.horasOciosasTurno}h</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeDrawer === 'CAMERAS' && (
              <div className="grid grid-cols-1 gap-2.5">
                {cameras.map(c => (
                  <div
                    key={c.id}
                    onClick={() => setFocusedCamId(c.id)}
                    className={`p-2 rounded-xl border cursor-pointer flex items-center space-x-3 ${
                      focusedCamId === c.id ? 'bg-brand-500/15 border-brand-400' : 'bg-night-900 border-night-800'
                    }`}
                  >
                    <img src={getCameraImage(c.id)} alt={c.nome} className="w-16 h-12 rounded object-cover" />
                    <div className="text-xs truncate">
                      <strong className="text-brand-300 font-mono block">{c.id}</strong>
                      <span className="text-gray-200 truncate block">{c.nome}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => setActiveDrawer(null)}
            className="mt-4 w-full py-2 rounded-xl bg-night-900 hover:bg-night-800 text-gray-300 border border-night-700 text-xs font-mono"
          >
            Fechar Painel
          </button>
        </div>
      )}
    </div>
  );
};
