import React, { useState, useRef, useEffect } from 'react';
import {
  CameraStream,
  FuncionarioProdutividade,
  MaquinaOEE,
  VeiculoTelemetria,
  IncidenteSeguranca,
  PortaoSeguranca,
  LightingCycleMode,
  MapRenderStyle,
  PlantSpatialFocus,
  PlantSectorId,
  SECTOR_FOCUS_PRESETS
} from '../types';
import {
  ZoomIn,
  ZoomOut,
  Box,
  Compass,
  PenTool,
  Plus,
  Play,
  ShieldAlert,
  Sun,
  Sunset,
  Moon,
  Globe,
  Layers,
  Lock,
  Unlock,
  Camera
} from 'lucide-react';
import { soundAndVoice } from '../utils/soundAndVoice';

export interface ArchWallNode {
  id: string;
  x: number; // em unidades de planta (0 a 1600)
  y: number; // em unidades de planta (0 a 1000)
  ring?: 'EXTERNO' | 'SEDE' | 'COFRE';
}

interface ArchitecturalPlantCanvasProps {
  cameras: CameraStream[];
  funcionarios: FuncionarioProdutividade[];
  maquinas: MaquinaOEE[];
  veiculos: VeiculoTelemetria[];
  portoes?: PortaoSeguranca[];
  incidentes: IncidenteSeguranca[];
  focusedCamId: string;
  onSelectCamera: (camId: string) => void;
  onSelectSector: (sector: 'PORTOES' | 'MAQUINAS' | 'PESSOAS' | 'FROTAS' | 'CAMERAS') => void;
  onTogglePortao?: (portaoId: string) => void;
  onAddCameraAt: (xPercent: number, yPercent: number) => void;
  onSimulateIncident: () => void;
  voiceEnabled: boolean;
  spatialFocus?: PlantSpatialFocus;
  onUpdateSpatialFocus?: (focus: PlantSpatialFocus) => void;
}

// Perímetro da Quadra Industrial Principal (Lado Leste da Rua Divisória)
const DEFAULT_PERIMETER_CAD: ArchWallNode[] = [
  { id: 'P1', x: 480, y: 108, ring: 'EXTERNO' },  // Canto Noroeste dos Galpões (Esquina Rua Divisória)
  { id: 'P2', x: 760, y: 108, ring: 'EXTERNO' },  // Divisa Norte / Anexo Norte (Zona Alarme)
  { id: 'P3', x: 950, y: 108, ring: 'EXTERNO' },  // Portão Azul Nº 250 / Controle LPR
  { id: 'P4', x: 1535, y: 108, ring: 'EXTERNO' }, // Canto Nordeste (Atrás do Galpão de Arco)
  { id: 'P5', x: 1535, y: 500, ring: 'EXTERNO' }, // Alambrado Leste (Mourões de Concreto)
  { id: 'P6', x: 1535, y: 885, ring: 'EXTERNO' }, // Canto Sudeste (R. David de Souza Franco)
  { id: 'P7', x: 940, y: 885, ring: 'EXTERNO' },  // Divisa Sul Pátio / Galpões Geminados
  { id: 'P8', x: 480, y: 885, ring: 'EXTERNO' },  // Canto Sudoeste da Nave 01 (Esquina R. David de Souza Franco)
];

// Perímetro da Sede Administrativa (Quadra Oeste — Do Outro Lado da Rua)
const SEDE_RING_CAD: ArchWallNode[] = [
  { id: 'S1', x: 68, y: 108, ring: 'SEDE' },
  { id: 'S2', x: 375, y: 108, ring: 'SEDE' },
  { id: 'S3', x: 375, y: 505, ring: 'SEDE' },
  { id: 'S4', x: 68, y: 505, ring: 'SEDE' },
];

// Anel Laser Interno do Cofre Blindado (Sul da Nave Central 02)
const VAULT_RING_CAD: ArchWallNode[] = [
  { id: 'C1', x: 720, y: 585, ring: 'COFRE' },
  { id: 'C2', x: 925, y: 585, ring: 'COFRE' },
  { id: 'C3', x: 925, y: 745, ring: 'COFRE' },
  { id: 'C4', x: 720, y: 745, ring: 'COFRE' },
];

// Postes de Iluminação Perimetral LED (acesos no Entardecer e Noite)
const LIGHT_POLES_CAD = [
  { id: 'LP-01', x: 370, y: 140 },
  { id: 'LP-02', x: 370, y: 360 },
  { id: 'LP-03', x: 472, y: 200 },
  { id: 'LP-04', x: 472, y: 520 },
  { id: 'LP-05', x: 960, y: 135 },
  { id: 'LP-06', x: 1140, y: 350 },
  { id: 'LP-07', x: 1515, y: 420 },
  { id: 'LP-08', x: 1515, y: 760 },
  { id: 'LP-09', x: 1045, y: 865 },
];

export const ArchitecturalPlantCanvas: React.FC<ArchitecturalPlantCanvasProps> = ({
  cameras,
  funcionarios,
  maquinas,
  veiculos,
  portoes = [],
  incidentes,
  focusedCamId,
  onSelectCamera,
  onSelectSector,
  onTogglePortao,
  onAddCameraAt,
  onSimulateIncident,
  voiceEnabled,
  spatialFocus,
  onUpdateSpatialFocus
}) => {
  // Estados de Pan, Zoom e Inclinação 2.5D da Planta CAD
  const [zoom, setZoom] = useState<number>(spatialFocus?.twoTarget.zoom || 1.0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ 
    x: spatialFocus?.twoTarget.panX || 0, 
    y: spatialFocus?.twoTarget.panY || 0 
  });
  const [currentSectorId, setCurrentSectorId] = useState<PlantSectorId>(spatialFocus?.sectorId || 'COMPLEXO_COMPLETO');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [is3D, setIs3D] = useState<boolean>(false);
  const [showDimensions, setShowDimensions] = useState<boolean>(true);

  // Sincronização Automática: quando o foco espacial muda no 3D ou externamente
  useEffect(() => {
    if (!spatialFocus) return;
    if (spatialFocus.lastUpdatedBy === '2D') return;

    setCurrentSectorId(spatialFocus.sectorId);
    setPan({ x: spatialFocus.twoTarget.panX, y: spatialFocus.twoTarget.panY });
    setZoom(spatialFocus.twoTarget.zoom);
  }, [spatialFocus]);

  const focusSector2D = (sectorId: PlantSectorId) => {
    const preset = SECTOR_FOCUS_PRESETS[sectorId];
    if (!preset) return;
    setCurrentSectorId(sectorId);
    setZoom(preset.twoTarget.zoom);
    setPan({ x: preset.twoTarget.panX, y: preset.twoTarget.panY });
    soundAndVoice.playAlertSound('beep');

    if (onUpdateSpatialFocus) {
      onUpdateSpatialFocus({
        sectorId,
        label: preset.label,
        threeTarget: preset.threeTarget,
        twoTarget: preset.twoTarget,
        lastUpdatedBy: '2D',
        timestamp: Date.now()
      });
    }
  };

  // Novo: Modo Textura Satélite Real vs CAD Tático + Ciclo Dia / Entardecer / Noite
  const [mapStyle, setMapStyle] = useState<MapRenderStyle>('CAD_TATICO');
  const [lightingMode, setLightingMode] = useState<LightingCycleMode>('NOITE');

  // Novo: Hover PiP (Mini-Player Flutuante ao passar o mouse sobre qualquer câmera no mapa)
  const [hoveredCam, setHoveredCam] = useState<{
    cam: CameraStream;
    screenX: number;
    screenY: number;
  } | null>(null);

  // Estados locais de portões caso não venham por prop
  const [localGate250Open, setLocalGate250Open] = useState<boolean>(true);
  const [localSedeGateOpen, setLocalSedeGateOpen] = useState<boolean>(false);
  const [localArcoGateOpen, setLocalArcoGateOpen] = useState<boolean>(true);

  const gate250Obj = portoes.find(p => p.id === 'GATE-01');
  const gateSedeObj = portoes.find(p => p.id === 'GATE-02');
  const gateArcoObj = portoes.find(p => p.id === 'GATE-04');
  const gateCofreObj = portoes.find(p => p.id === 'GATE-05');

  const isGate250Open = gate250Obj ? gate250Obj.status === 'ABERTO' : localGate250Open;
  const isSedeGateOpen = gateSedeObj ? gateSedeObj.status === 'ABERTO' : localSedeGateOpen;
  const isArcoGateOpen = gateArcoObj ? gateArcoObj.status === 'ABERTO' : localArcoGateOpen;
  const isCofreOpen = gateCofreObj ? gateCofreObj.status === 'ABERTO' : false;

  const handleToggleGateOnMap = (gateId: string) => {
    soundAndVoice.playAlertSound('beep');
    if (onTogglePortao) {
      onTogglePortao(gateId);
    } else {
      if (gateId === 'GATE-01') setLocalGate250Open(prev => !prev);
      if (gateId === 'GATE-02') setLocalSedeGateOpen(prev => !prev);
      if (gateId === 'GATE-04') setLocalArcoGateOpen(prev => !prev);
    }
  };

  // Modo Construtor de Planta / Perímetro
  const [tool, setTool] = useState<'PAN' | 'DRAW_PERIMETER' | 'PLACE_CAMERA'>('PAN');
  const [perimeterNodes, setPerimeterNodes] = useState<ArchWallNode[]>([
    ...DEFAULT_PERIMETER_CAD,
    ...SEDE_RING_CAD,
    ...VAULT_RING_CAD,
  ]);

  // Simulação de Construção da Planta Passo a Passo
  const [buildPhase, setBuildPhase] = useState<number>(0); // 0 = Tudo construído, 1..5 = Etapas
  const [buildLabel, setBuildLabel] = useState<string>('');

  // Posição da Ponte Rolante interna do Galpão de Arco Nordeste
  const [craneX, setCraneX] = useState<number>(1180);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const activeIncidente = incidentes.find(i => i.status === 'EM_ABERTO');

  const getCameraImage = (camId: string) => {
    if (camId === 'CAM-01' || camId === 'CAM-02') return '/cameras/cam-balanca.png';
    if (camId === 'CAM-04') return '/cameras/cam-forno.png';
    return '/cameras/cam-perimetro.png';
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setCraneX(prev => (prev > 1360 ? 1160 : prev + 20));
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  // Simulação Passo a Passo de Construção da Planta Baixa Real (2 Quadras separadas pela Rua)
  const startStepByStepBuild = () => {
    setBuildPhase(1);
    setBuildLabel('FASE 1/5: Arruamento Real — Rua Divisória Norte-Sul (Entre Sede e Galpões) e R. David de Souza Franco');
    soundAndVoice.playAlertSound('beep');
    soundAndVoice.speakAlert(
      'Construindo planta baixa real. Fase um: rua divisória entre a sede administrativa e o complexo de galpões.',
      voiceEnabled
    );
  };

  useEffect(() => {
    if (buildPhase === 0) return;
    const t = setTimeout(() => {
      if (buildPhase === 1) {
        setBuildPhase(2);
        setBuildLabel('FASE 2/5: Quadra Oeste (Sede Administrativa Azul Escalonada + Terreno Sul) e Quadra Leste (Galpões)');
        soundAndVoice.playAlertSound('beep');
        soundAndVoice.speakAlert(
          'Fase dois: erguendo a sede administrativa azul do outro lado da rua, os dois galpões geminados norte-sul e o galpão de teto em arco.',
          voiceEnabled
        );
      } else if (buildPhase === 2) {
        setBuildPhase(3);
        setBuildLabel('FASE 3/5: Portão Azul Nº 250 (Controle LPR & Cancela), Pátio Leste de Carretas, Big-Bags e Fornos');
        soundAndVoice.playAlertSound('beep');
        soundAndVoice.speakAlert(
          'Fase três: posicionando caminhão na baia de segurança do portão duzentos e cinquenta, carretas estacionadas, big-bags brancos e fornos.',
          voiceEnabled
        );
      } else if (buildPhase === 3) {
        setBuildPhase(4);
        setBuildLabel('FASE 4/5: Gradil Azul & Portão de Grade da Sede + Alambrado com Mourões de Concreto e Câmeras');
        soundAndVoice.playAlertSound('beep');
        soundAndVoice.speakAlert(
          'Fase quatro: ativando gradil azul da sede administrativa, alambrado com mourões de concreto do pátio e câmeras.',
          voiceEnabled
        );
      } else if (buildPhase === 4) {
        setBuildPhase(5);
        setBuildLabel('FASE 5/5: Simulação de Intrusão no Perímetro Norte (P2-P3) — Mira Travada!');
        onSimulateIncident();
      } else if (buildPhase === 5) {
        setBuildPhase(0);
        setBuildLabel('');
      }
    }, 3200);
    return () => clearTimeout(t);
  }, [buildPhase, voiceEnabled, onSimulateIncident]);

  // Controle de Zoom com Scroll do Mouse
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.15 : 0.87;
    setZoom(prev => Math.max(0.55, Math.min(4.5, Number((prev * factor).toFixed(2)))));
  };

  // Controle de Arrastar (Pan) ou Clicar para Construir
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (tool !== 'PAN') {
      if (!svgRef.current) return;
      const pt = svgRef.current.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const ctm = svgRef.current.getScreenCTM();
      if (ctm) {
        const transformed = pt.matrixTransform(ctm.inverse());
        const cadX = Math.round(transformed.x);
        const cadY = Math.round(transformed.y);

        if (tool === 'DRAW_PERIMETER') {
          const extCount = perimeterNodes.filter(n => n.ring === 'EXTERNO').length;
          setPerimeterNodes(prev => [
            ...prev,
            {
              id: `P${extCount + 1}`,
              x: Math.max(20, Math.min(1580, cadX)),
              y: Math.max(20, Math.min(980, cadY)),
              ring: 'EXTERNO',
            },
          ]);
          soundAndVoice.playAlertSound('beep');
        } else if (tool === 'PLACE_CAMERA') {
          const xPct = Math.round((cadX / 1600) * 100);
          const yPct = Math.round((cadY / 1000) * 100);
          onAddCameraAt(xPct, yPct);
          soundAndVoice.playAlertSound('beep');
          setTool('PAN');
        }
      }
      return;
    }

    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Foco Rápido de Câmera em um Setor Real da Planta
  const focusRoom = (targetX: number, targetY: number, targetZoom: number) => {
    setZoom(targetZoom);
    setPan({ x: targetX, y: targetY });
    soundAndVoice.playAlertSound('beep');
  };

  const extNodes = perimeterNodes.filter(n => n.ring === 'EXTERNO');
  const sedeNodes = perimeterNodes.filter(n => n.ring === 'SEDE');
  const vaultNodes = perimeterNodes.filter(n => n.ring === 'COFRE');

  const showWalls = buildPhase === 0 || buildPhase >= 2;
  const showInterior = buildPhase === 0 || buildPhase >= 3;
  const showPerimeter = buildPhase === 0 || buildPhase >= 4;

  const isSat = mapStyle === 'SATELITE_REAL';
  const isNightOrDusk = lightingMode === 'NOITE' || lightingMode === 'ENTARDECER';

  // Paleta dinâmica conforme Ciclo Dia/Entardecer/Noite e Modo Satélite vs CAD
  const canvasBgHex =
    lightingMode === 'DIA'
      ? isSat
        ? '#1B2A22'
        : '#0E1F17'
      : lightingMode === 'ENTARDECER'
      ? isSat
        ? '#151B1E'
        : '#091410'
      : '#040A07';

  const roadFillHex = isSat
    ? lightingMode === 'DIA'
      ? '#262B30'
      : '#171C20'
    : '#0B1410';

  const earthYardFillHex = isSat
    ? lightingMode === 'DIA'
      ? '#5C341D'
      : '#381F11'
    : '#1C120C';

  const eastYardFillHex = isSat
    ? lightingMode === 'DIA'
      ? '#2A342D'
      : '#151E19'
    : '#08130E';

  return (
    <div
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{ backgroundColor: canvasBgHex }}
      className={`relative w-full h-full overflow-hidden select-none transition-colors duration-300 ${
        tool !== 'PAN' ? 'cursor-crosshair' : isDragging ? 'cursor-grabbing' : 'cursor-grab'
      }`}
    >
      {/* =====================================================================
          BARRA SUPERIOR ESQUERDA: SELETOR SATÉLITE vs CAD + CICLO DIA/NOITE + PORTÕES
         ===================================================================== */}
      <div
        onMouseDown={e => e.stopPropagation()}
        className="absolute left-4 top-4 z-30 flex items-center flex-wrap gap-2 bg-night-950/90 backdrop-blur-md border border-night-700 p-2 rounded-xl shadow-2xl text-[11px] font-mono"
      >
        {/* Alternador CAD Tático vs Satélite Real */}
        <div className="flex items-center bg-night-900 p-0.5 rounded-lg border border-night-800">
          <button
            onClick={() => {
              setMapStyle('CAD_TATICO');
              soundAndVoice.playAlertSound('beep');
            }}
            className={`px-2.5 py-1 rounded-md flex items-center space-x-1.5 transition-all ${
              mapStyle === 'CAD_TATICO'
                ? 'bg-brand-500 text-night-950 font-bold'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>CAD Tático</span>
          </button>
          <button
            onClick={() => {
              setMapStyle('SATELITE_REAL');
              soundAndVoice.playAlertSound('beep');
            }}
            className={`px-2.5 py-1 rounded-md flex items-center space-x-1.5 transition-all ${
              mapStyle === 'SATELITE_REAL'
                ? 'bg-sky-400 text-night-950 font-bold'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Satélite / Asfalto Real</span>
          </button>
        </div>

        {/* Alternador Ciclo Dia / Entardecer / Noite */}
        <div className="flex items-center bg-night-900 p-0.5 rounded-lg border border-night-800">
          <button
            onClick={() => {
              setLightingMode('DIA');
              soundAndVoice.playAlertSound('beep');
            }}
            className={`px-2 py-1 rounded-md flex items-center space-x-1 transition-all ${
              lightingMode === 'DIA'
                ? 'bg-amber-400 text-night-950 font-bold'
                : 'text-gray-400 hover:text-white'
            }`}
            title="Iluminação Diurna Solar"
          >
            <Sun className="w-3.5 h-3.5" />
            <span>Dia</span>
          </button>
          <button
            onClick={() => {
              setLightingMode('ENTARDECER');
              soundAndVoice.playAlertSound('beep');
            }}
            className={`px-2 py-1 rounded-md flex items-center space-x-1 transition-all ${
              lightingMode === 'ENTARDECER'
                ? 'bg-orange-500 text-white font-bold'
                : 'text-gray-400 hover:text-white'
            }`}
            title="Entardecer (Holofotes Acesos)"
          >
            <Sunset className="w-3.5 h-3.5" />
            <span>Entardecer</span>
          </button>
          <button
            onClick={() => {
              setLightingMode('NOITE');
              soundAndVoice.playAlertSound('beep');
            }}
            className={`px-2 py-1 rounded-md flex items-center space-x-1 transition-all ${
              lightingMode === 'NOITE'
                ? 'bg-indigo-500 text-white font-bold'
                : 'text-gray-400 hover:text-white'
            }`}
            title="Noturno Tático (Postes LED + Infravermelho)"
          >
            <Moon className="w-3.5 h-3.5" />
            <span>Noite</span>
          </button>
        </div>

        {/* Controles Rápidos dos Portões Reais direto no Topo da Planta */}
        <div className="flex items-center space-x-1.5 border-l border-night-700 pl-2">
          <button
            onClick={() => handleToggleGateOnMap('GATE-01')}
            className={`px-2.5 py-1 rounded-lg border flex items-center space-x-1 transition-all ${
              isGate250Open
                ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
            }`}
            title="Clique para Abrir/Fechar o Portão Azul Nº 250 (Quadra Leste)"
          >
            {isGate250Open ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
            <span>Portão Nº 250: {isGate250Open ? 'ABERTO' : 'TRAVADO'}</span>
          </button>

          <button
            onClick={() => handleToggleGateOnMap('GATE-02')}
            className={`px-2.5 py-1 rounded-lg border flex items-center space-x-1 transition-all ${
              isSedeGateOpen
                ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
            }`}
            title="Clique para Abrir/Fechar o Portão de Grade Azul da Sede (Quadra Oeste)"
          >
            {isSedeGateOpen ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
            <span>Grade Sede: {isSedeGateOpen ? 'ABERTO' : 'TRAVADO'}</span>
          </button>
        </div>
      </div>

      {/* =====================================================================
          PAINEL FLUTUANTE DE ZOOM RÁPIDO POR SETOR REAL (SUPERIOR DIREITO)
         ===================================================================== */}
      <div
        onMouseDown={e => e.stopPropagation()}
        className="absolute right-4 top-4 z-30 flex flex-col space-y-1.5 bg-night-950/90 backdrop-blur-md border border-night-700 p-2.5 rounded-xl shadow-2xl text-[11px] font-mono"
      >
        <div className="flex items-center justify-between px-2 pt-0.5">
          <span className="text-[9px] text-gray-400 uppercase font-bold tracking-wider">
            Setores Reais (2 Quadras):
          </span>
          <span className="text-[8px] px-1.5 py-0.2 rounded bg-emerald-950 border border-emerald-800 text-emerald-400">
            2D⇄3D SYNC
          </span>
        </div>

        <button
          onClick={() => focusSector2D('COMPLEXO_COMPLETO')}
          className={`px-2.5 py-1.5 rounded-lg border text-left flex items-center justify-between space-x-3 transition-colors ${
            currentSectorId === 'COMPLEXO_COMPLETO'
              ? 'bg-brand-500/20 text-brand-300 border-brand-400 font-bold'
              : 'bg-night-900 hover:bg-brand-500/20 text-gray-200 hover:text-brand-300 border-night-800'
          }`}
        >
          <span>Complexo Completo (2 Quadras)</span>
          <span className="text-[9px] text-gray-500">1.0x</span>
        </button>

        <button
          onClick={() => focusSector2D('SEDE_ADMIN')}
          className={`px-2.5 py-1.5 rounded-lg border text-left flex items-center justify-between space-x-3 transition-colors ${
            currentSectorId === 'SEDE_ADMIN'
              ? 'bg-sky-500/20 text-sky-200 border-sky-400 font-bold'
              : 'bg-night-900 hover:bg-sky-500/20 text-sky-200 border-night-800'
          }`}
        >
          <span>Sede Admin Azul (Outro Lado Rua)</span>
          <span className="text-[9px] text-sky-400">2.2x</span>
        </button>

        <button
          onClick={() => focusSector2D('PORTAO_250')}
          className={`px-2.5 py-1.5 rounded-lg border text-left flex items-center justify-between space-x-3 transition-colors ${
            currentSectorId === 'PORTAO_250'
              ? 'bg-brand-500/20 text-brand-300 border-brand-400 font-bold'
              : 'bg-night-900 hover:bg-brand-500/20 text-gray-200 hover:text-brand-300 border-night-800'
          }`}
        >
          <span>Portão Azul Nº 250 &amp; Controle LPR</span>
          <span className="text-[9px] text-brand-400">2.2x</span>
        </button>

        <button
          onClick={() => focusSector2D('GALPOES_GEMINADOS')}
          className={`px-2.5 py-1.5 rounded-lg border text-left flex items-center justify-between space-x-3 transition-colors ${
            currentSectorId === 'GALPOES_GEMINADOS'
              ? 'bg-brand-500/20 text-brand-300 border-brand-400 font-bold'
              : 'bg-night-900 hover:bg-brand-500/20 text-gray-200 hover:text-brand-300 border-night-800'
          }`}
        >
          <span>Galpões Geminados 01 e 02</span>
          <span className="text-[9px] text-brand-400">1.8x</span>
        </button>

        <button
          onClick={() => focusSector2D('GALPAO_ARCO')}
          className={`px-2.5 py-1.5 rounded-lg border text-left flex items-center justify-between space-x-3 transition-colors ${
            currentSectorId === 'GALPAO_ARCO'
              ? 'bg-amber-500/20 text-amber-200 border-amber-400 font-bold'
              : 'bg-night-900 hover:bg-amber-500/20 text-amber-200 border-night-800'
          }`}
        >
          <span>Galpão de Arco (Nordeste)</span>
          <span className="text-[9px] text-amber-400">2.2x</span>
        </button>

        <button
          onClick={() => focusSector2D('PATIO_CARRETAS')}
          className={`px-2.5 py-1.5 rounded-lg border text-left flex items-center justify-between space-x-3 transition-colors ${
            currentSectorId === 'PATIO_CARRETAS'
              ? 'bg-brand-500/20 text-brand-300 border-brand-400 font-bold'
              : 'bg-night-900 hover:bg-brand-500/20 text-gray-200 hover:text-brand-300 border-night-800'
          }`}
        >
          <span>Pátio Carretas &amp; Big-Bags</span>
          <span className="text-[9px] text-brand-400">2.0x</span>
        </button>

        <button
          onClick={() => focusSector2D('ALAMBRADO_NORTE')}
          className={`px-2.5 py-1.5 rounded-lg border text-left flex items-center justify-between space-x-3 transition-colors ${
            currentSectorId === 'ALAMBRADO_NORTE'
              ? 'bg-rose-950/70 text-rose-200 border-rose-500 font-bold'
              : 'bg-rose-950/40 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30'
          }`}
        >
          <span>Alambrado Norte (Alarme)</span>
          <span className="text-[9px] text-rose-400">2.4x</span>
        </button>

        <div className="border-t border-night-800 pt-1.5 mt-1 flex items-center justify-between px-1">
          <button
            onClick={() => setZoom(z => Math.max(0.55, Number((z - 0.25).toFixed(2))))}
            className="p-1.5 rounded bg-night-900 hover:bg-night-800 text-gray-300 border border-night-700"
            title="Diminuir Zoom"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-brand-400 font-bold">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom(z => Math.min(4.5, Number((z + 0.25).toFixed(2))))}
            className="p-1.5 rounded bg-night-900 hover:bg-night-800 text-gray-300 border border-night-700"
            title="Aumentar Zoom"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>

        <button
          onClick={() => setShowDimensions(!showDimensions)}
          className={`mt-1 px-2 py-1 rounded text-[10px] border ${
            showDimensions
              ? 'bg-brand-500/15 text-brand-300 border-brand-500/30'
              : 'bg-night-900 text-gray-500 border-night-800'
          }`}
        >
          {showDimensions ? 'Cotas & Metragem: ON' : 'Cotas & Metragem: OFF'}
        </button>
      </div>

      {/* =====================================================================
          HOVER PICTURE-IN-PICTURE (MINI-PLAYER FLUTUANTE AO PASSAR O MOUSE NA CÂMERA)
         ===================================================================== */}
      {hoveredCam && (
        <div
          style={{
            left: `${Math.min(window.innerWidth - 290, Math.max(20, hoveredCam.screenX + 18))}px`,
            top: `${Math.min(window.innerHeight - 210, Math.max(20, hoveredCam.screenY - 90))}px`,
          }}
          className="fixed z-50 w-64 rounded-2xl bg-night-950/95 backdrop-blur-md border border-brand-400/70 shadow-2xl overflow-hidden pointer-events-none animate-fadeIn"
        >
          <div className="px-2.5 py-1.5 bg-night-900 border-b border-night-800 flex items-center justify-between text-[10px] font-mono">
            <div className="flex items-center space-x-1.5 truncate">
              <Camera className="w-3 h-3 text-brand-400 shrink-0" />
              <span className="font-bold text-brand-300">{hoveredCam.cam.id}</span>
              <span className="text-white truncate">{hoveredCam.cam.setor}</span>
            </div>
            <span
              className={`px-1.5 py-0.2 rounded font-bold text-[9px] ${
                hoveredCam.cam.status === 'ALERTA'
                  ? 'bg-rose-500 text-white'
                  : 'bg-emerald-500/20 text-emerald-400'
              }`}
            >
              {hoveredCam.cam.status}
            </span>
          </div>
          <div className="relative w-full h-32 bg-black">
            <img
              src={getCameraImage(hoveredCam.cam.id)}
              alt={hoveredCam.cam.nome}
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-1.5 inset-x-1.5 bg-black/80 px-2 py-0.5 rounded text-[9px] font-mono text-gray-200 truncate">
              {hoveredCam.cam.nome}
            </div>
          </div>
          <div className="px-2.5 py-1 bg-night-950 text-[9px] font-mono text-gray-400 flex items-center justify-between">
            <span>{hoveredCam.cam.ip} • {hoveredCam.cam.resolucao}</span>
            <span className="text-brand-400">Clique p/ fixar PiP</span>
          </div>
        </div>
      )}

      {/* BANNER DISCRETO DA CONSTRUÇÃO PASSO A PASSO */}
      {buildPhase > 0 && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-40 bg-night-950/95 border border-brand-500/50 px-5 py-2 rounded-xl shadow-2xl flex items-center space-x-3 text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
          <span className="text-white font-semibold">{buildLabel}</span>
        </div>
      )}

      {/* =====================================================================
          VIEWPORT VETORIAL INFINITO (PLANTA ARQUITETÔNICA CAD 2D/3D REAL)
         ===================================================================== */}
      <div
        className="w-full h-full flex items-center justify-center transition-transform duration-150 ease-out"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) ${
            is3D ? 'perspective(1200px) rotateX(42deg) rotateZ(-6deg)' : ''
          }`,
          transformStyle: 'preserve-3d',
        }}
      >
        <svg
          ref={svgRef}
          viewBox="0 0 1600 1000"
          className="w-[1500px] h-[937px] overflow-visible"
        >
          <defs>
            {/* Malha Milimétrica de Engenharia (10px = 1m, 100px = 10m) */}
            <pattern id="cad-subgrid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#0C1E15" strokeWidth="0.6" />
            </pattern>
            <pattern id="cad-grid" width="100" height="100" patternUnits="userSpaceOnUse">
              <rect width="100" height="100" fill="url(#cad-subgrid)" />
              <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#143022" strokeWidth="1.2" />
            </pattern>

            {/* Textura de Telhado Metálico Ondulado (Galpões Geminados Norte-Sul) */}
            <pattern id="corrugated-roof-v" width="14" height="20" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="0" y2="20" stroke="#334155" strokeWidth="1.2" strokeOpacity="0.45" />
              <line x1="7" y1="0" x2="7" y2="20" stroke="#475569" strokeWidth="0.8" strokeOpacity="0.3" />
            </pattern>

            {/* Textura de Telhado em Arco Metálico (Galpão Nordeste Leste-Oeste) */}
            <pattern id="arched-roof-h" width="20" height="12" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="20" y2="0" stroke="#38BDF8" strokeWidth="1" strokeOpacity="0.22" />
              <line x1="0" y1="6" x2="20" y2="6" stroke="#94A3B8" strokeWidth="0.8" strokeOpacity="0.2" />
            </pattern>

            {/* Gradiente Radial para Postes de Iluminação Noturna */}
            <radialGradient id="night-pole-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FDE68A" stopOpacity="0.38" />
              <stop offset="55%" stopColor="#F59E0B" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
            </radialGradient>

            {/* Brilhos suaves */}
            <filter id="cad-glow-green" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="cad-glow-red" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* =================================================================
              CAMADA 1: TERRENO E ARRUAMENTO REAL (RUA DIVISÓRIA + R. DAVID DE SOUZA FRANCO)
             ================================================================= */}
          <rect
            x="0"
            y="0"
            width="1600"
            height="1000"
            rx="14"
            fill={isSat ? (lightingMode === 'DIA' ? '#1E2D24' : '#0E1712') : '#050E0A'}
            stroke="#1B3B2B"
            strokeWidth="2.5"
          />
          {!isSat && <rect x="0" y="0" width="1600" height="1000" fill="url(#cad-grid)" />}

          {/* Vegetação / Árvores de Calçada e Divisa quando em Modo Satélite Real */}
          {isSat && (
            <g opacity={lightingMode === 'DIA' ? 0.85 : 0.45}>
              {[120, 260, 580, 720, 1180, 1340, 1480].map(tx => (
                <circle key={`tree-n-${tx}`} cx={tx} cy="96" r="14" fill="#15803D" stroke="#22C55E" strokeWidth="1" />
              ))}
              {[140, 290, 620, 880, 1150, 1390].map(tx => (
                <circle key={`tree-s-${tx}`} cx={tx} cy="896" r="13" fill="#166534" stroke="#22C55E" strokeWidth="1" />
              ))}
            </g>
          )}

          {/* 1.1 VIA PÚBLICA SUL: R. DAVID DE SOUZA FRANCO (Y: 905..975) */}
          <g>
            <rect x="20" y="905" width="1560" height="68" rx="4" fill={roadFillHex} stroke="#1E382B" strokeWidth="1.5" />
            <line
              x1="40"
              y1="939"
              x2="1560"
              y2="939"
              stroke={isSat ? '#EAB308' : '#2E5A42'}
              strokeWidth="1.8"
              strokeDasharray="26 18"
            />
            <text x="80" y="932" fill="#6EE7B7" fontSize="11" fontFamily="JetBrains Mono" fontWeight="bold">
              R. DAVID DE SOUZA FRANCO (VIA SUL — CONECTA QUADRA DA SEDE E QUADRA DOS GALPÕES)
            </text>
            <text x="1140" y="960" fill="#4B7B60" fontSize="9.5" fontFamily="JetBrains Mono">
              MODO: {isSat ? 'SATÉLITE REAL' : 'CAD VETORIAL'} • CICLO: {lightingMode}
            </text>
          </g>

          {/* 1.2 VIA PÚBLICA NORTE — ACESSO SEDE & PORTÃO AZUL Nº 250 (Y: 20..88) */}
          <g>
            <rect x="20" y="20" width="1560" height="68" rx="4" fill={roadFillHex} stroke="#1E382B" strokeWidth="1.5" />
            <line
              x1="40"
              y1="54"
              x2="1560"
              y2="54"
              stroke={isSat ? '#EAB308' : '#2E5A42'}
              strokeWidth="1.8"
              strokeDasharray="26 18"
            />
            <text x="80" y="44" fill="#6EE7B7" fontSize="10.5" fontFamily="JetBrains Mono" fontWeight="bold">
              VIA NORTE — ACESSO À SEDE ADMINISTRATIVA (OESTE) E AO PORTÃO AZUL Nº 250 (LESTE)
            </text>
          </g>

          {/* 1.3 RUA DIVISÓRIA NORTE-SUL ENTRE A SEDE ADMINISTRATIVA (ESQUERDA) E OS GALPÕES (DIREITA) */}
          <g>
            <rect x="382" y="20" width="86" height="953" fill={roadFillHex} stroke="#1E382B" strokeWidth="1.5" />
            <line
              x1="425"
              y1="40"
              x2="425"
              y2="945"
              stroke={isSat ? '#EAB308' : '#2E5A42'}
              strokeWidth="1.8"
              strokeDasharray="24 18"
            />
            {/* Calçada Oeste da Rua (frente do Gradil Azul da Sede Administrativa) */}
            <rect x="372" y="105" width="12" height="780" fill={isSat ? '#475569' : '#13241C'} stroke="#1E382B" strokeWidth="1" />
            {/* Calçada Leste da Rua (empena oeste do Galpão Geminado 01) */}
            <rect x="466" y="105" width="12" height="780" fill={isSat ? '#475569' : '#13241C'} stroke="#1E382B" strokeWidth="1" />

            <text
              x="418"
              y="530"
              textAnchor="middle"
              fill="#6EE7B7"
              fontSize="10"
              fontFamily="JetBrains Mono"
              fontWeight="bold"
              transform="rotate(-90, 418, 530)"
            >
              RUA ENTRE SEDE ADMINISTRATIVA (OESTE) E GALPÕES (LESTE)
            </text>

            {/* Carros Pretos Estacionados na Rua em frente ao Gradil Azul da Sede (Fotos 5 e 6!) */}
            {showInterior && (
              <g>
                <rect x="387" y="185" width="18" height="36" rx="4" fill="#0F172A" stroke="#64748B" strokeWidth="1.5" />
                <rect x="387" y="232" width="18" height="36" rx="4" fill="#0F172A" stroke="#64748B" strokeWidth="1.5" />
                <rect x="444" y="250" width="18" height="36" rx="4" fill="#1E293B" stroke="#64748B" strokeWidth="1.2" />
                <rect x="444" y="305" width="18" height="36" rx="4" fill="#1E293B" stroke="#64748B" strokeWidth="1.2" />
              </g>
            )}
          </g>

          {/* =================================================================
              CAMADA 2: EDIFICAÇÕES REAIS (QUADRA OESTE: SEDE + QUADRA LESTE: GALPÕES)
             ================================================================= */}
          {showWalls && (
            <g>
              {/* =============================================================
                  QUADRA OESTE (DO OUTRO LADO DA RUA): SEDE ADMINISTRATIVA AZUL,
                  COBERTURA ESCALONADA EM 4 NÍVEIS, GRADIL AZUL & TERRENO SUL
                 ============================================================= */}
              <g
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectSector('PESSOAS');
                  onSelectCamera('CAM-02');
                }}
                className="cursor-pointer"
              >
                {/* Galpão Vizinho na Extrema Esquerda da Foto 5 */}
                <rect x="18" y="110" width="44" height="770" fill="#0A1216" stroke="#334155" strokeWidth="1.5" />
                <text x="40" y="480" textAnchor="middle" fill="#475569" fontSize="8.5" fontFamily="JetBrains Mono" transform="rotate(-90, 40, 480)">
                  GALPÃO VIZINHO OESTE (DIVISA DE LOTE)
                </text>

                {/* Pátio Concretado Norte & Leste da Sede Administrativa (Foto 5 Satélite) */}
                <rect
                  x="68"
                  y="108"
                  width="307"
                  height="397"
                  rx="3"
                  fill={isSat ? '#1E293B' : '#0C1821'}
                  stroke="#38BDF8"
                  strokeWidth="2.5"
                />

                <text x="82" y="130" fill="#BAE6FD" fontSize="10.5" fontFamily="JetBrains Mono" fontWeight="bold">
                  QUADRA OESTE // SEDE ADMINISTRATIVA
                </text>
                <text x="82" y="144" fill="#7DD3FC" fontSize="8.5" fontFamily="JetBrains Mono">
                  (Do outro lado da rua dos Galpões — Fotos 4, 5 e 6)
                </text>

                {/* COBERTURA ESCALONADA EM 4 MÓDULOS HORIZONTAIS (Vista de Satélite Foto 5) */}
                <rect x="120" y="156" width="198" height="56" fill={isSat ? '#334155' : '#132536'} stroke="#94A3B8" strokeWidth="2" />
                <rect x="122" y="158" width="194" height="52" fill="url(#corrugated-roof-v)" />

                <rect x="105" y="212" width="219" height="86" fill={isSat ? '#3B4D63' : '#162C42'} stroke="#CBD5E1" strokeWidth="2.5" />
                <rect x="107" y="214" width="215" height="82" fill="url(#corrugated-roof-v)" />
                <text x="210" y="246" textAnchor="middle" fill="#F1F5F9" fontSize="9.5" fontFamily="JetBrains Mono" fontWeight="bold">
                  2º PAVIMENTO ADMINISTRATIVO
                </text>
                <text x="210" y="262" textAnchor="middle" fill="#93C5FD" fontSize="8" fontFamily="JetBrains Mono">
                  4 Janelas Superiores + Placa Institucional
                </text>

                <rect x="100" y="298" width="228" height="94" fill={isSat ? '#2E4057' : '#13273B'} stroke="#94A3B8" strokeWidth="2.5" />
                <rect x="102" y="300" width="224" height="90" fill="url(#corrugated-roof-v)" />
                <text x="210" y="338" textAnchor="middle" fill="#E2E8F0" fontSize="9.5" fontFamily="JetBrains Mono" fontWeight="bold">
                  DIRETORIA, COMERCIAL &amp; CCO TI
                </text>
                <text x="210" y="355" textAnchor="middle" fill="#7DD3FC" fontSize="8" fontFamily="JetBrains Mono">
                  Servidores CopperOS &amp; Monitoramento
                </text>

                <rect x="72" y="392" width="263" height="106" fill={isSat ? '#475569' : '#102030'} stroke="#CBD5E1" strokeWidth="2.5" />
                <rect x="74" y="394" width="259" height="102" fill="url(#corrugated-roof-v)" />
                <text x="203" y="438" textAnchor="middle" fill="#F1F5F9" fontSize="9.5" fontFamily="JetBrains Mono" fontWeight="bold">
                  NAVE SUL DA SEDE (APOIO &amp; ALMOXARIFADO)
                </text>
                <text x="203" y="455" textAnchor="middle" fill="#94A3B8" fontSize="8" fontFamily="JetBrains Mono">
                  Telhado Escalonado Nível 4 (Foto 5 Satélite)
                </text>

                {/* FACHADA FRONTAL AZUL TÉRREA VOLTADA PARA A RUA (Fotos 4 e 6) */}
                <rect
                  x="324"
                  y="212"
                  width="36"
                  height="180"
                  rx="2"
                  fill="#1D4ED8"
                  stroke="#60A5FA"
                  strokeWidth="2.5"
                />
                {[222, 254, 286, 318].map((wy, idx) => (
                  <g key={`win-sede-${wy}`}>
                    <rect x="346" y={wy} width="12" height="22" rx="1" fill="#78350F" stroke="#F59E0B" strokeWidth="1.2" />
                    <rect x="334" y={wy + 4} width="8" height="14" rx="1" fill="#F8FAFC" stroke="#64748B" strokeWidth="0.8" />
                    {idx < 2 && (
                      <text x="329" y={wy + 13} textAnchor="end" fill="#BAE6FD" fontSize="6.5" fontFamily="JetBrains Mono">
                        AC
                      </text>
                    )}
                  </g>
                ))}
                {/* Porta de Vidro da Recepção & Biometria Facial (Foto 6) */}
                <rect
                  x="344"
                  y="350"
                  width="16"
                  height="34"
                  fill="#0284C7"
                  stroke="#E0F2FE"
                  strokeWidth="1.5"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleGateOnMap('GATE-03');
                  }}
                />
                <text
                  x="337"
                  y="367"
                  textAnchor="middle"
                  fill="#E0F2FE"
                  fontSize="7"
                  fontFamily="JetBrains Mono"
                  fontWeight="bold"
                  transform="rotate(-90, 337, 367)"
                >
                  RECEPÇÃO
                </text>

                {/* GRADIL AZUL COM PILARES BRANCOS + PORTÃO DE GRADE AZUL INTERATIVO (Foto 6) */}
                <g
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleGateOnMap('GATE-02');
                  }}
                >
                  <line x1="374" y1="205" x2="374" y2="495" stroke="#2563EB" strokeWidth="4.5" />
                  {[205, 240, 275, 310, 345, 380, 415, 455, 495].map(py => (
                    <rect
                      key={`pilar-sede-${py}`}
                      x="369"
                      y={py - 4}
                      width="10"
                      height="8"
                      rx="1"
                      fill="#F8FAFC"
                      stroke="#2563EB"
                      strokeWidth="1.2"
                    />
                  ))}
                  {/* Portão Grande de Grade Azul de Veículos da Sede */}
                  <line
                    x1="374"
                    y1="115"
                    x2={isSedeGateOpen ? '335' : '374'}
                    y2={isSedeGateOpen ? '155' : '198'}
                    stroke={isSedeGateOpen ? '#FBBF24' : '#3B82F6'}
                    strokeWidth="5"
                  />
                  <text
                    x="363"
                    y="158"
                    textAnchor="middle"
                    fill={isSedeGateOpen ? '#FDE68A' : '#93C5FD'}
                    fontSize="7.5"
                    fontFamily="JetBrains Mono"
                    fontWeight="bold"
                    transform="rotate(-90, 363, 158)"
                  >
                    {isSedeGateOpen ? 'GRADE ABERTA' : 'PORTÃO GRADE AZUL'}
                  </text>
                </g>

                {/* METADE SUL DA QUADRA OESTE: TERRENO DE TERRA BATIDA ABAIXO DA SEDE */}
                <rect
                  x="68"
                  y="505"
                  width="307"
                  height="380"
                  rx="3"
                  fill={earthYardFillHex}
                  stroke="#78350F"
                  strokeWidth="2"
                />
                <text x="84" y="530" fill="#FDBA74" fontSize="10" fontFamily="JetBrains Mono" fontWeight="bold">
                  PÁTIO / TERRENO SUL DA SEDE (TERRA BATIDA)
                </text>
                <text x="84" y="545" fill="#D97706" fontSize="8.5" fontFamily="JetBrains Mono">
                  Área de Apoio Sul da Quadra Oeste (Foto 5 Satélite)
                </text>

                <rect
                  x="76"
                  y="572"
                  width="54"
                  height="64"
                  rx="2"
                  fill="#1E293B"
                  stroke="#CBD5E1"
                  strokeWidth="2"
                />
                <text x="103" y="602" textAnchor="middle" fill="#F1F5F9" fontSize="7.5" fontFamily="JetBrains Mono" fontWeight="bold">
                  ANEXO
                </text>
                <text x="103" y="614" textAnchor="middle" fill="#94A3B8" fontSize="7" fontFamily="JetBrains Mono">
                  OESTE
                </text>

                {showInterior && (
                  <g>
                    <rect x="235" y="605" width="76" height="24" rx="2" fill="#291D14" stroke="#D97706" strokeWidth="1.5" />
                    <circle cx="205" cy="615" r="12" fill="#291D14" stroke="#F59E0B" strokeWidth="1.2" />
                    <rect x="180" y="810" width="95" height="22" rx="2" fill="#291D14" stroke="#A16207" strokeWidth="1.2" />
                  </g>
                )}
              </g>

              {/* =============================================================
                  QUADRA LESTE PRINCIPAL (DO OUTRO LADO DA RUA):
                  DOIS GRANDES GALPÕES GEMINADOS NORTE-SUL (NAVES 01 & 02)
                 ============================================================= */}
              <g
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectSector('PESSOAS');
                  onSelectCamera('CAM-06');
                }}
                className="cursor-pointer"
              >
                {/* NAVE INDUSTRIAL OESTE 01 */}
                <rect
                  x="482"
                  y="225"
                  width="228"
                  height="650"
                  fill={isSat ? '#1E293B' : '#0D1922'}
                  stroke="#94A3B8"
                  strokeWidth="4"
                />
                <rect x="486" y="229" width="220" height="642" fill="url(#corrugated-roof-v)" />
                <line x1="596" y1="225" x2="596" y2="875" stroke="#CBD5E1" strokeWidth="2" strokeDasharray="12 6" />
                {[280, 365, 450, 535, 620, 705, 790].map(sy => (
                  <g key={`sky1-${sy}`}>
                    <rect x="520" y={sy} width="32" height="13" rx="2" fill="#38BDF8" fillOpacity="0.22" stroke="#7DD3FC" strokeWidth="0.8" />
                    <rect x="640" y={sy} width="32" height="13" rx="2" fill="#38BDF8" fillOpacity="0.22" stroke="#7DD3FC" strokeWidth="0.8" />
                  </g>
                ))}

                <text x="496" y="252" fill="#F1F5F9" fontSize="11" fontFamily="JetBrains Mono" fontWeight="bold">
                  GALPÃO GEMINADO OESTE 01
                </text>
                <text x="496" y="268" fill="#94A3B8" fontSize="9" fontFamily="JetBrains Mono">
                  Nave Norte-Sul (22,8m x 65,0m)
                </text>

                {showInterior && (
                  <g>
                    <rect x="498" y="290" width="196" height="195" rx="4" fill="#091318" stroke="#334155" strokeWidth="1.5" />
                    <text x="510" y="312" fill="#FBBF24" fontSize="9.5" fontFamily="JetBrains Mono" fontWeight="bold">
                      BOBINAS DE COBRE MEL
                    </text>
                    {[525, 570, 615, 660].map(bx =>
                      [345, 395, 445].map(by => (
                        <g key={`coil-${bx}-${by}`}>
                          <circle cx={bx} cy={by} r="14" fill="#78350F" stroke="#F59E0B" strokeWidth="2" />
                          <circle cx={bx} cy={by} r="5" fill="#091318" stroke="#F59E0B" strokeWidth="1" />
                        </g>
                      ))
                    )}

                    <rect x="498" y="505" width="196" height="125" rx="4" fill="#0B1D18" stroke="#10B981" strokeWidth="2" />
                    <text x="510" y="530" fill="#A7F3D0" fontSize="9.5" fontFamily="JetBrains Mono" fontWeight="bold">
                      PRENSA HIDRÁULICA ENFARDADEIRA
                    </text>
                    <text x="510" y="548" fill="#6EE7B7" fontSize="8.5" fontFamily="JetBrains Mono">
                      Pressão: 250 bar • Fardos Cobre
                    </text>
                    {[515, 562, 609, 652].map(fx => (
                      <rect key={fx} x={fx} y="570" width="32" height="32" rx="2" fill="#7C2D12" stroke="#FB923C" strokeWidth="1.5" />
                    ))}

                    <rect x="498" y="650" width="196" height="205" rx="4" fill="#091318" stroke="#334155" strokeWidth="1.5" />
                    <text x="596" y="745" textAnchor="middle" fill="#E2E8F0" fontSize="9.5" fontFamily="JetBrains Mono" fontWeight="bold">
                      EXPEDIÇÃO SUL NAVE 01
                    </text>
                    <text x="596" y="765" textAnchor="middle" fill="#94A3B8" fontSize="8.5" fontFamily="JetBrains Mono">
                      Frente p/ R. David de Souza Franco
                    </text>
                  </g>
                )}

                {/* NAVE INDUSTRIAL CENTRAL 02 */}
                <rect
                  x="710"
                  y="225"
                  width="225"
                  height="530"
                  fill={isSat ? '#263345' : '#0F1D26'}
                  stroke="#CBD5E1"
                  strokeWidth="4"
                />
                <rect x="714" y="229" width="217" height="522" fill="url(#corrugated-roof-v)" />
                <line x1="822" y1="225" x2="822" y2="755" stroke="#CBD5E1" strokeWidth="2" strokeDasharray="12 6" />

                <text x="724" y="252" fill="#F1F5F9" fontSize="11" fontFamily="JetBrains Mono" fontWeight="bold">
                  GALPÃO GEMINADO CENTRAL 02
                </text>
                <text x="724" y="268" fill="#94A3B8" fontSize="9" fontFamily="JetBrains Mono">
                  Nave Norte-Sul (22,5m x 53,0m)
                </text>

                {showInterior && (
                  <g>
                    <rect x="725" y="290" width="195" height="130" rx="4" fill="#09161B" stroke="#38BDF8" strokeWidth="1.5" />
                    <text x="738" y="316" fill="#BAE6FD" fontSize="9.5" fontFamily="JetBrains Mono" fontWeight="bold">
                      TRIAGEM &amp; ESPECTRÔMETRO
                    </text>
                    <text x="738" y="336" fill="#34D399" fontSize="8.5" fontFamily="JetBrains Mono">
                      Pureza Média: 99,18% Cu
                    </text>
                    <text x="738" y="356" fill="#94A3B8" fontSize="8" fontFamily="JetBrains Mono">
                      Fernando Dias (RFID-9904)
                    </text>

                    <rect x="725" y="435" width="195" height="130" rx="4" fill="#07110E" stroke="#1E3A2F" strokeWidth="1.5" strokeDasharray="6 4" />
                    <text x="822" y="492" textAnchor="middle" fill="#6EE7B7" fontSize="9" fontFamily="JetBrains Mono" fontWeight="bold">
                      DOCA INTERNA NAVE 02
                    </text>
                    <text x="822" y="510" textAnchor="middle" fill="#34D399" fontSize="8" fontFamily="JetBrains Mono">
                      Acesso ao Pátio de Carretas
                    </text>

                    {/* COFRE BLINDADO DE CATODOS & ECLUSA BIOMÉTRICA INTERATIVA */}
                    <g
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleGateOnMap('GATE-05');
                      }}
                    >
                      <rect
                        x="722"
                        y="588"
                        width="200"
                        height="154"
                        rx="4"
                        fill="#130D21"
                        stroke={isCofreOpen ? '#FBBF24' : '#A855F7'}
                        strokeWidth="3.5"
                      />
                      <text x="734" y="610" fill="#E9D5FF" fontSize="9.5" fontFamily="JetBrains Mono" fontWeight="bold">
                        COFRE &amp; ECLUSA ({isCofreOpen ? 'ABERTA' : 'TRAVADA'})
                      </text>
                      {[734, 796, 858].map((rx, idx) => (
                        <g key={`rack-${rx}`}>
                          <rect
                            x={rx}
                            y="624"
                            width="52"
                            height="48"
                            rx="3"
                            fill="#23163B"
                            stroke="#C084FC"
                            strokeWidth="1.5"
                          />
                          <text x={rx + 26} y="646" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontFamily="JetBrains Mono" fontWeight="bold">
                            RACK 0{idx + 1}
                          </text>
                          <text x={rx + 26} y="660" textAnchor="middle" fill="#C084FC" fontSize="7.5" fontFamily="JetBrains Mono">
                            CATODO Cu
                          </text>

                          <rect
                            x={rx}
                            y="682"
                            width="52"
                            height="48"
                            rx="3"
                            fill="#23163B"
                            stroke="#C084FC"
                            strokeWidth="1.5"
                          />
                          <text x={rx + 26} y="704" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontFamily="JetBrains Mono" fontWeight="bold">
                            RACK 0{idx + 4}
                          </text>
                          <text x={rx + 26} y="718" textAnchor="middle" fill="#34D399" fontSize="7.5" fontFamily="JetBrains Mono">
                            99,99%
                          </text>
                        </g>
                      ))}
                    </g>
                  </g>
                )}

                {/* GALPÃO ANEXO CENTRAL */}
                <rect
                  x="935"
                  y="625"
                  width="92"
                  height="135"
                  fill="#101E26"
                  stroke="#94A3B8"
                  strokeWidth="3"
                />
                <text x="981" y="685" textAnchor="middle" fill="#E2E8F0" fontSize="8.5" fontFamily="JetBrains Mono" fontWeight="bold">
                  ANEXO
                </text>
                <text x="981" y="700" textAnchor="middle" fill="#94A3B8" fontSize="8" fontFamily="JetBrains Mono">
                  CENTRAL
                </text>
              </g>

              {/* -------------------------------------------------------------
                  SETOR NOROESTE DOS GALPÕES: PÁTIO NOROESTE & ANEXO NORTE BRANCO
                 ------------------------------------------------------------- */}
              <g>
                <rect
                  x="482"
                  y="108"
                  width="453"
                  height="115"
                  fill="#081410"
                  stroke="#1E3F2E"
                  strokeWidth="2"
                />
                <text x="495" y="128" fill="#6EE7B7" fontSize="9.5" fontFamily="JetBrains Mono" fontWeight="bold">
                  PÁTIO NOROESTE &amp; MANOBRA
                </text>
                {showInterior && (
                  <g transform="rotate(-24, 595, 168)">
                    <rect x="535" y="154" width="120" height="28" rx="3" fill="#1E293B" stroke="#94A3B8" strokeWidth="1.5" />
                    <text x="595" y="172" textAnchor="middle" fill="#CBD5E1" fontSize="7.5" fontFamily="JetBrains Mono">
                      CARRETA NW
                    </text>
                  </g>
                )}
                <rect
                  x="810"
                  y="114"
                  width="122"
                  height="104"
                  rx="3"
                  fill="#132530"
                  stroke="#CBD5E1"
                  strokeWidth="2.5"
                />
                <text x="871" y="160" textAnchor="middle" fill="#F8FAFC" fontSize="9" fontFamily="JetBrains Mono" fontWeight="bold">
                  ANEXO NORTE
                </text>
                <text x="871" y="176" textAnchor="middle" fill="#94A3B8" fontSize="8" fontFamily="JetBrains Mono">
                  Guarita &amp; Controle
                </text>
              </g>

              {/* -------------------------------------------------------------
                  SETOR CENTRO-NORTE: PORTÃO AZUL Nº 250, CORREDOR ASFALTADO
                  ESCURO, CANCELA DUPLA LPR & BARREIRA IVA (100% SEGURANÇA!)
                  (X: 940 a 1125, Y: 108 a 355)
                 ------------------------------------------------------------- */}
              <g
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectSector('PORTOES');
                  onSelectCamera('CAM-01');
                }}
                className="cursor-pointer"
              >
                <rect
                  x="940"
                  y="110"
                  width="180"
                  height="245"
                  fill={roadFillHex}
                  stroke="#38BDF8"
                  strokeWidth="2"
                />

                {/* PILAR DE ALVENARIA AZUL "Nº 250" + PORTÃO DUPLO DE TELA AZUL INTERATIVO (Foto 3) */}
                <g
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleGateOnMap('GATE-01');
                  }}
                >
                  <rect x="942" y="100" width="42" height="22" rx="2" fill="#1D4ED8" stroke="#93C5FD" strokeWidth="2" />
                  <text x="963" y="115" textAnchor="middle" fill="#FFFFFF" fontSize="9.5" fontFamily="JetBrains Mono" fontWeight="bold">
                    Nº 250
                  </text>
                  <rect x="1092" y="100" width="28" height="22" rx="2" fill="#1D4ED8" stroke="#93C5FD" strokeWidth="2" />

                  <line
                    x1="984"
                    y1="110"
                    x2={isGate250Open ? '984' : '1038'}
                    y2={isGate250Open ? '162' : '110'}
                    stroke={isGate250Open ? '#34D399' : '#F43F5E'}
                    strokeWidth="5.5"
                  />
                  <line
                    x1="1092"
                    y1="110"
                    x2={isGate250Open ? '1092' : '1038'}
                    y2={isGate250Open ? '162' : '110'}
                    stroke={isGate250Open ? '#34D399' : '#F43F5E'}
                    strokeWidth="5.5"
                  />
                  <text x="1038" y="130" textAnchor="middle" fill="#93C5FD" fontSize="8.5" fontFamily="JetBrains Mono" fontWeight="bold">
                    {isGate250Open ? 'PORTÃO Nº 250 (ABERTO)' : 'PORTÃO Nº 250 (TRAVADO)'}
                  </text>
                </g>

                {/* BAIA DE INSPEÇÃO VEICULAR LPR & BARREIRA INFRAVERMELHA (IVA) */}
                <rect
                  x="968"
                  y="144"
                  width="128"
                  height="192"
                  rx="4"
                  fill="#071510"
                  stroke="#10B981"
                  strokeWidth="2.5"
                />
                <line x1="968" y1="150" x2="1096" y2="150" stroke="#34D399" strokeWidth="2" strokeDasharray="4 3" />
                <line x1="968" y1="330" x2="1096" y2="330" stroke="#34D399" strokeWidth="2" strokeDasharray="4 3" />

                {/* Caminhão Cavalo Mecânico Prata (VW Constellation da Foto 3) na Baia LPR */}
                {showInterior && (
                  <g>
                    <rect
                      x="994"
                      y="160"
                      width="76"
                      height="112"
                      rx="3"
                      fill="#1E293B"
                      stroke="#94A3B8"
                      strokeWidth="2"
                    />
                    <rect
                      x="998"
                      y="276"
                      width="68"
                      height="42"
                      rx="5"
                      fill="#64748B"
                      stroke="#F8FAFC"
                      strokeWidth="2"
                    />
                    <text x="1032" y="206" textAnchor="middle" fill="#FFFFFF" fontSize="9" fontFamily="JetBrains Mono" fontWeight="bold">
                      ABC-8E90
                    </text>
                    <text x="1032" y="222" textAnchor="middle" fill="#34D399" fontSize="8.5" fontFamily="JetBrains Mono" fontWeight="bold">
                      LPR 4K VERIFICADO
                    </text>
                    <text x="1032" y="238" textAnchor="middle" fill="#93C5FD" fontSize="7.5" fontFamily="JetBrains Mono">
                      BARREIRA IVA OK
                    </text>
                    <text x="1032" y="301" textAnchor="middle" fill="#F8FAFC" fontSize="8" fontFamily="JetBrains Mono" fontWeight="bold">
                      CONSTELLATION
                    </text>
                  </g>
                )}

                <text x="1032" y="350" textAnchor="middle" fill="#6EE7B7" fontSize="8.5" fontFamily="JetBrains Mono" fontWeight="bold">
                  CONTROLE LPR &amp; CANCELA
                </text>
              </g>

              {/* -------------------------------------------------------------
                  SETOR NORDESTE: GALPÃO DE TETO EM ARCO AZUL E PRATA
                 ------------------------------------------------------------- */}
              <g
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectSector('MAQUINAS');
                  onSelectCamera('CAM-04');
                }}
                className="cursor-pointer"
              >
                <rect
                  x="1125"
                  y="140"
                  width="400"
                  height="200"
                  rx="8"
                  fill={isSat ? '#1E293B' : '#101824'}
                  stroke="#38BDF8"
                  strokeWidth="4.5"
                />
                <rect x="1129" y="144" width="392" height="192" rx="6" fill="url(#arched-roof-h)" />

                {/* Toldo Azul (Canopy) sobre o Portão Industrial Interativo (Foto 3) */}
                <g
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleGateOnMap('GATE-04');
                  }}
                >
                  <rect
                    x="1148"
                    y="333"
                    width="135"
                    height="17"
                    rx="3"
                    fill="#1D4ED8"
                    stroke={isArcoGateOpen ? '#34D399' : '#93C5FD'}
                    strokeWidth="2"
                  />
                  <text x="1215" y="345" textAnchor="middle" fill="#FFFFFF" fontSize="7.5" fontFamily="JetBrains Mono" fontWeight="bold">
                    TOLDO AZUL ({isArcoGateOpen ? 'PORTÃO ABERTO' : 'FECHADO'})
                  </text>
                </g>

                <text x="1142" y="166" fill="#BAE6FD" fontSize="10.5" fontFamily="JetBrains Mono" fontWeight="bold">
                  GALPÃO NORDESTE — TETO EM ARCO AZUL/PRATA
                </text>
                <text x="1142" y="182" fill="#FDE68A" fontSize="8.5" fontFamily="JetBrains Mono">
                  Fornos de Indução &amp; Subestação 13.8kV (Foto 3)
                </text>

                {showInterior && (
                  <g>
                    <g style={{ transition: 'all 1.6s ease-in-out' }}>
                      <rect
                        x={craneX}
                        y="190"
                        width="14"
                        height="134"
                        fill="rgba(245, 158, 11, 0.28)"
                        stroke="#FBBF24"
                        strokeWidth="2"
                      />
                    </g>

                    <circle cx="1205" cy="252" r="34" fill="#451A03" stroke="#F59E0B" strokeWidth="3.5" />
                    <circle cx="1205" cy="252" r="20" fill="#EA580C" />
                    <text x="1205" y="249" textAnchor="middle" fill="#FFFFFF" fontSize="8.5" fontFamily="JetBrains Mono" fontWeight="bold">
                      FORNO 01
                    </text>
                    <text x="1205" y="262" textAnchor="middle" fill="#FEF08A" fontSize="9" fontFamily="JetBrains Mono" fontWeight="bold">
                      {maquinas[0]?.temperaturaAtualC || 1145}°C
                    </text>

                    <circle cx="1295" cy="252" r="32" fill="#451A03" stroke="#F59E0B" strokeWidth="3.5" />
                    <circle cx="1295" cy="252" r="18" fill="#D97706" />
                    <text x="1295" y="249" textAnchor="middle" fill="#FFFFFF" fontSize="8.5" fontFamily="JetBrains Mono" fontWeight="bold">
                      FORNO 02
                    </text>
                    <text x="1295" y="262" textAnchor="middle" fill="#FEF08A" fontSize="9" fontFamily="JetBrains Mono" fontWeight="bold">
                      {maquinas[1]?.temperaturaAtualC || 1130}°C
                    </text>

                    <rect x="1365" y="195" width="142" height="125" rx="4" fill="#18130E" stroke="#F59E0B" strokeWidth="2" />
                    <text x="1436" y="232" textAnchor="middle" fill="#FDE68A" fontSize="9" fontFamily="JetBrains Mono" fontWeight="bold">
                      SUBESTAÇÃO 13.8kV
                    </text>
                    <text x="1436" y="250" textAnchor="middle" fill="#FBBF24" fontSize="8.5" fontFamily="JetBrains Mono">
                      OEE: {maquinas[0]?.oee.oeeGeral}% • 920kW
                    </text>
                    <text x="1436" y="270" textAnchor="middle" fill="#34D399" fontSize="8" fontFamily="JetBrains Mono">
                      CLP MODBUS TCP OK
                    </text>
                  </g>
                )}
              </g>

              {/* -------------------------------------------------------------
                  SETOR LESTE & SUDESTE: GRANDE PÁTIO ABERTO DE CARRETAS,
                  CAMINHÕES, BIG-BAGS BRANCOS & ALAMBRADO COM MOURÕES DE CONCRETO
                 ------------------------------------------------------------- */}
              <g
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectSector('FROTAS');
                  onSelectCamera('CAM-03');
                }}
                className="cursor-pointer"
              >
                <rect
                  x="1032"
                  y="362"
                  width="492"
                  height="512"
                  rx="4"
                  fill={eastYardFillHex}
                  stroke="#2E5A42"
                  strokeWidth="2.5"
                />

                <text x="1048" y="388" fill="#A7F3D0" fontSize="11" fontFamily="JetBrains Mono" fontWeight="bold">
                  PÁTIO LESTE/SUDESTE — CARRETAS &amp; BIG-BAGS
                </text>
                <text x="1048" y="404" fill="#6EE7B7" fontSize="8.5" fontFamily="JetBrains Mono">
                  Alambrado com Mourões de Concreto Inclinados (Fotos 1 e 2)
                </text>

                {showInterior && (
                  <g>
                    {[425, 470, 515, 560, 605, 650].map((ty, idx) => (
                      <g key={`west-trailer-${ty}`}>
                        <rect
                          x="1044"
                          y={ty}
                          width="125"
                          height="34"
                          rx="3"
                          fill={idx % 2 === 0 ? '#1E293B' : '#0F291E'}
                          stroke="#64748B"
                          strokeWidth="1.5"
                        />
                        <text x="1106" y={ty + 21} textAnchor="middle" fill="#E2E8F0" fontSize="7.5" fontFamily="JetBrains Mono">
                          CARRETA OESTE 0{idx + 1}
                        </text>
                      </g>
                    ))}

                    <rect
                      x="1182"
                      y="425"
                      width="182"
                      height="260"
                      rx="4"
                      fill="#06100B"
                      stroke="#1F4231"
                      strokeWidth="1.5"
                      strokeDasharray="8 6"
                    />
                    <text x="1273" y="545" textAnchor="middle" fill="#6EE7B7" fontSize="9" fontFamily="JetBrains Mono" fontWeight="bold">
                      GIRO DE CARRETAS
                    </text>
                    <text x="1273" y="562" textAnchor="middle" fill="#4B7B60" fontSize="8" fontFamily="JetBrains Mono">
                      &amp; PÁ CARREGADEIRA
                    </text>

                    <rect
                      x="1376"
                      y="425"
                      width="136"
                      height="38"
                      rx="3"
                      fill="#064E3B"
                      stroke="#34D399"
                      strokeWidth="2"
                    />
                    <text x="1444" y="442" textAnchor="middle" fill="#ECFDF5" fontSize="8" fontFamily="JetBrains Mono" fontWeight="bold">
                      CARRETA LONADA VERDE
                    </text>
                    <text x="1444" y="454" textAnchor="middle" fill="#6EE7B7" fontSize="7" fontFamily="JetBrains Mono">
                      (Foto 2 Alambrado)
                    </text>

                    {[476, 524, 572, 620].map((ty, idx) => (
                      <g key={`east-trailer-${ty}`}>
                        <rect
                          x="1382"
                          y={ty}
                          width="130"
                          height="35"
                          rx="3"
                          fill={idx === 0 ? '#1E3A8A' : '#1E293B'}
                          stroke="#94A3B8"
                          strokeWidth="1.5"
                        />
                        <text x="1447" y={ty + 21} textAnchor="middle" fill="#E2E8F0" fontSize="7.5" fontFamily="JetBrains Mono">
                          {idx === 0 ? 'CAMINHÃO CHASSI' : `CARRETA LESTE 0${idx + 1}`}
                        </text>
                      </g>
                    ))}

                    <rect
                      x="1044"
                      y="704"
                      width="468"
                      height="82"
                      rx="4"
                      fill="#0B1912"
                      stroke="#34D399"
                      strokeWidth="1.5"
                    />
                    <text x="1058" y="722" fill="#F8FAFC" fontSize="9" fontFamily="JetBrains Mono" fontWeight="bold">
                      LOTES DE BIG-BAGS DE RÁFIA BRANCA (SUCATA DE COBRE — FOTO 2)
                    </text>
                    {[1058, 1096, 1134, 1172, 1210, 1248, 1286, 1324, 1362, 1400, 1438, 1474].map((bgx, idx) => (
                      <g key={`bag-${bgx}`}>
                        <rect
                          x={bgx}
                          y="732"
                          width="28"
                          height="26"
                          rx="5"
                          fill="#F1F5F9"
                          stroke="#64748B"
                          strokeWidth="1.5"
                        />
                        <circle cx={bgx + 14} cy="745" r="5.5" fill="#B45309" />
                        {idx % 3 === 0 && (
                          <text x={bgx + 14} y="772" textAnchor="middle" fill="#CBD5E1" fontSize="6.5" fontFamily="JetBrains Mono">
                            BAG#{idx + 1}
                          </text>
                        )}
                      </g>
                    ))}

                    {[1048, 1205, 1362].map((bx, idx) => (
                      <g key={`south-truck-${bx}`}>
                        <rect
                          x={bx}
                          y="800"
                          width="142"
                          height="36"
                          rx="3"
                          fill="#1E293B"
                          stroke="#64748B"
                          strokeWidth="1.5"
                        />
                        <text x={bx + 71} y="822" textAnchor="middle" fill="#CBD5E1" fontSize="7.5" fontFamily="JetBrains Mono">
                          CARRETA SUL 0{idx + 1}
                        </text>
                      </g>
                    ))}
                  </g>
                )}

                <g>
                  {[960, 1030, 1100, 1170, 1240, 1310, 1380, 1450, 1520].map(mx => (
                    <rect
                      key={`mourao-sul-${mx}`}
                      x={mx - 3}
                      y="879"
                      width="6"
                      height="11"
                      fill="#CBD5E1"
                      stroke="#475569"
                      strokeWidth="1"
                    />
                  ))}
                  <text x="1245" y="899" textAnchor="middle" fill="#A7F3D0" fontSize="8.5" fontFamily="JetBrains Mono" fontWeight="bold">
                    ALAMBRADO COM MOURÕES DE CONCRETO INCLINADOS (FOTO 2)
                  </text>
                </g>
              </g>
            </g>
          )}

          {/* =================================================================
              CAMADA 2.5: ILUMINAÇÃO DE POSTES LED & HOLOFOTES (ENTARDECER / NOITE)
             ================================================================= */}
          {isNightOrDusk && (
            <g className="pointer-events-none">
              {LIGHT_POLES_CAD.map(lp => (
                <g key={lp.id}>
                  <circle cx={lp.x} cy={lp.y} r="75" fill="url(#night-pole-glow)" />
                  <circle cx={lp.x} cy={lp.y} r="4" fill="#FEF08A" stroke="#F59E0B" strokeWidth="1.5" />
                </g>
              ))}
            </g>
          )}

          {/* =================================================================
              CAMADA 3: PERÍMETRO DUPLO (QUADRA SEDE + QUADRA GALPÕES + COFRE)
             ================================================================= */}
          {showPerimeter && (
            <g>
              {sedeNodes.length >= 3 && (
                <polygon
                  points={sedeNodes.map(n => `${n.x},${n.y}`).join(' ')}
                  fill="rgba(56, 189, 248, 0.03)"
                  stroke="#38BDF8"
                  strokeWidth="2.5"
                  strokeDasharray="8 5"
                />
              )}

              {vaultNodes.length >= 3 && (
                <polygon
                  points={vaultNodes.map(n => `${n.x},${n.y}`).join(' ')}
                  fill="rgba(168, 85, 247, 0.05)"
                  stroke="#C084FC"
                  strokeWidth="3"
                  strokeDasharray="10 6"
                  filter="url(#cad-glow-green)"
                />
              )}

              {extNodes.map((node, index) => {
                const nextNode = index < extNodes.length - 1 ? extNodes[index + 1] : extNodes[0];
                if (!nextNode) return null;

                const isNorthBreach = index === 1;
                const isViolated = Boolean(activeIncidente && isNorthBreach);

                const midX = (node.x + nextNode.x) / 2;
                const midY = (node.y + nextNode.y) / 2;
                const distMeters = Math.round(
                  Math.sqrt(Math.pow(nextNode.x - node.x, 2) + Math.pow(nextNode.y - node.y, 2)) / 10
                );

                return (
                  <g key={`${node.id}-${nextNode.id}`}>
                    <line
                      x1={node.x}
                      y1={node.y}
                      x2={nextNode.x}
                      y2={nextNode.y}
                      stroke={isViolated ? '#F43F5E' : '#10B981'}
                      strokeWidth={isViolated ? '6' : '4'}
                      filter={isViolated ? 'url(#cad-glow-red)' : 'url(#cad-glow-green)'}
                    />
                    <line
                      x1={node.x}
                      y1={node.y + (node.y < 200 ? 9 : node.y > 800 ? -9 : 0)}
                      x2={nextNode.x}
                      y2={nextNode.y + (nextNode.y < 200 ? 9 : nextNode.y > 800 ? -9 : 0)}
                      stroke={isViolated ? '#FB7185' : '#34D399'}
                      strokeWidth="1.5"
                      strokeDasharray="6 4"
                    />

                    {showDimensions && distMeters > 8 && (
                      <g>
                        <rect
                          x={midX - 36}
                          y={midY - 10}
                          width="72"
                          height="18"
                          rx="4"
                          fill="#040A07"
                          stroke={isViolated ? '#F43F5E' : '#1A3324'}
                          strokeWidth="1"
                        />
                        <text
                          x={midX}
                          y={midY + 3}
                          textAnchor="middle"
                          fill={isViolated ? '#FDA4AF' : '#6EE7B7'}
                          fontSize="9"
                          fontFamily="JetBrains Mono"
                          fontWeight="bold"
                        >
                          {distMeters}m • 10kV
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}

              {perimeterNodes.map((node) => {
                const isViolated = Boolean(activeIncidente && (node.id === 'P2' || node.id === 'P3'));
                return (
                  <g
                    key={node.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (tool === 'DRAW_PERIMETER' && extNodes.length > 3 && node.ring === 'EXTERNO') {
                        setPerimeterNodes(prev => prev.filter(n => n.id !== node.id));
                        soundAndVoice.playAlertSound('beep');
                      }
                    }}
                    className="cursor-pointer"
                  >
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={isViolated ? 12 : 8.5}
                      fill={
                        isViolated
                          ? '#E11D48'
                          : node.ring === 'COFRE'
                          ? '#7E22CE'
                          : node.ring === 'SEDE'
                          ? '#0284C7'
                          : '#059669'
                      }
                      stroke="#FFFFFF"
                      strokeWidth="2"
                    />
                    <text
                      x={node.x}
                      y={node.y - 13}
                      textAnchor="middle"
                      fill="#FFFFFF"
                      fontSize="9.5"
                      fontFamily="JetBrains Mono"
                      fontWeight="bold"
                    >
                      {node.id}
                    </text>
                  </g>
                );
              })}

              {/* CÂMERAS COM CONE DE VISÃO (FOV) E PREVIEW PiP AO PASSAR O MOUSE */}
              {cameras.map((cam) => {
                const cx = (cam.coords.x / 100) * 1600;
                const cy = (cam.coords.y / 100) * 1000;
                const isAlert = cam.status === 'ALERTA';
                const isFocused = focusedCamId === cam.id;

                const targetX =
                  cam.id === 'CAM-05'
                    ? 840
                    : cam.id === 'CAM-01'
                    ? 1032
                    : cam.id === 'CAM-02'
                    ? 240
                    : cx < 800
                    ? cx + 150
                    : cx - 150;
                const targetY =
                  cam.id === 'CAM-05'
                    ? 110
                    : cam.id === 'CAM-01'
                    ? 280
                    : cam.id === 'CAM-02'
                    ? 310
                    : cy < 500
                    ? cy + 125
                    : cy - 125;

                return (
                  <g
                    key={cam.id}
                    onMouseEnter={(e) => {
                      setHoveredCam({
                        cam,
                        screenX: e.clientX,
                        screenY: e.clientY,
                      });
                    }}
                    onMouseMove={(e) => {
                      setHoveredCam({
                        cam,
                        screenX: e.clientX,
                        screenY: e.clientY,
                      });
                    }}
                    onMouseLeave={() => setHoveredCam(null)}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectCamera(cam.id);
                      soundAndVoice.playAlertSound('beep');
                    }}
                    className="cursor-pointer"
                  >
                    <polygon
                      points={`${cx},${cy} ${targetX - 65},${targetY} ${targetX + 65},${targetY}`}
                      fill={
                        isAlert
                          ? 'rgba(244, 63, 94, 0.25)'
                          : cam.holofoteLigado || isNightOrDusk
                          ? 'rgba(250, 204, 21, 0.16)'
                          : isFocused
                          ? 'rgba(16, 185, 129, 0.20)'
                          : 'rgba(56, 189, 248, 0.10)'
                      }
                      stroke={isAlert ? '#F43F5E' : isFocused ? '#10B981' : '#38BDF8'}
                      strokeWidth="1"
                      strokeDasharray="4 4"
                    />
                    <circle
                      cx={cx}
                      cy={cy}
                      r="14"
                      fill={isAlert ? '#E11D48' : isFocused ? '#10B981' : '#091912'}
                      stroke="#FFFFFF"
                      strokeWidth="2"
                    />
                    <text
                      x={cx}
                      y={cy + 4}
                      textAnchor="middle"
                      fill={isFocused && !isAlert ? '#040A07' : '#FFFFFF'}
                      fontSize="9"
                      fontFamily="JetBrains Mono"
                      fontWeight="bold"
                    >
                      {cam.id.replace('CAM-0', 'C')}
                    </text>
                  </g>
                );
              })}

              {/* ALVO INVASOR E DOMO DE RADAR QUANDO HOUVER VIOLAÇÃO NO ALAMBRADO NORTE */}
              {activeIncidente && (
                <g
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectCamera('CAM-05');
                    focusRoom(40, 350, 2.4);
                  }}
                  className="cursor-pointer"
                >
                  <circle
                    cx="850"
                    cy="108"
                    r="58"
                    fill="rgba(244, 63, 94, 0.18)"
                    stroke="#F43F5E"
                    strokeWidth="2"
                    strokeDasharray="6 4"
                  />
                  <circle
                    cx="850"
                    cy="108"
                    r="26"
                    fill="rgba(244, 63, 94, 0.35)"
                    stroke="#FFFFFF"
                    strokeWidth="2"
                  />
                  <line
                    x1={(cameras[0]?.coords.x / 100) * 1600}
                    y1={(cameras[0]?.coords.y / 100) * 1000}
                    x2="850"
                    y2="108"
                    stroke="#F43F5E"
                    strokeWidth="2"
                    strokeDasharray="6 4"
                  />
                  <line
                    x1={(cameras[4]?.coords.x / 100) * 1600}
                    y1={(cameras[4]?.coords.y / 100) * 1000}
                    x2="850"
                    y2="108"
                    stroke="#F43F5E"
                    strokeWidth="2"
                    strokeDasharray="6 4"
                  />
                  <rect x="725" y="54" width="250" height="24" rx="5" fill="#E11D48" stroke="#FFFFFF" strokeWidth="1.2" />
                  <text x="850" y="70" textAnchor="middle" fill="#FFFFFF" fontSize="10.5" fontFamily="JetBrains Mono" fontWeight="bold">
                    INTRUSÃO NORTE (MIRA TRAVADA)
                  </text>
                </g>
              )}
            </g>
          )}

          {/* =================================================================
              CAMADA 4: OPERADORES (RFID) E EMPILHADEIRAS EM MOVIMENTO NA PLANTA
             ================================================================= */}
          {showInterior && (
            <g>
              {veiculos.map((v) => {
                const vx = (v.coords.x / 100) * 1600;
                const vy = (v.coords.y / 100) * 1000;
                return (
                  <g
                    key={v.id}
                    style={{ transition: 'all 1.8s linear' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectSector('FROTAS');
                    }}
                    className="cursor-pointer"
                  >
                    <rect
                      x={vx - 26}
                      y={vy - 14}
                      width="52"
                      height="28"
                      rx="5"
                      fill={v.alertaExcessoVelocidade ? '#E11D48' : '#78350F'}
                      stroke={v.alertaExcessoVelocidade ? '#FFFFFF' : '#FBBF24'}
                      strokeWidth="2"
                    />
                    <text
                      x={vx}
                      y={vy + 4}
                      textAnchor="middle"
                      fill="#FFFFFF"
                      fontSize="9.5"
                      fontFamily="JetBrains Mono"
                      fontWeight="bold"
                    >
                      {v.prefixo}
                    </text>
                  </g>
                );
              })}

              {funcionarios.map((f) => {
                const fx = (f.coords.x / 100) * 1600;
                const fy = (f.coords.y / 100) * 1000;
                return (
                  <g
                    key={f.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectSector('PESSOAS');
                    }}
                    className="cursor-pointer"
                  >
                    <circle cx={fx} cy={fy} r="10" fill="#1D4ED8" stroke="#93C5FD" strokeWidth="2" />
                    <text
                      x={fx}
                      y={fy - 14}
                      textAnchor="middle"
                      fill="#93C5FD"
                      fontSize="9.5"
                      fontFamily="JetBrains Mono"
                      fontWeight="bold"
                    >
                      {f.nome.split(' ')[0]} ({f.rfidTag})
                    </text>
                  </g>
                );
              })}
            </g>
          )}
        </svg>
      </div>

      {/* =====================================================================
          DOCK TÁTICO INFERIOR CENTRALIZADO PARA CONSTRUIR E CONTROLAR A PLANTA
         ===================================================================== */}
      <footer
        onMouseDown={e => e.stopPropagation()}
        className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 px-3.5 py-2 rounded-xl bg-night-950/90 backdrop-blur-md border border-night-700 flex items-center space-x-2 shadow-2xl flex-wrap justify-center gap-y-2"
      >
        <button
          onClick={startStepByStepBuild}
          disabled={buildPhase > 0}
          className="px-3.5 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-400 text-night-950 font-mono font-bold text-xs flex items-center space-x-1.5 transition-all"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>
            {buildPhase > 0 ? `Construindo Planta (${buildPhase}/5)...` : 'Construir Planta Real (5 Fases)'}
          </span>
        </button>

        <span className="text-night-700">|</span>

        <button
          onClick={() => setTool('PAN')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold flex items-center space-x-1.5 border transition-all ${
            tool === 'PAN'
              ? 'bg-brand-500/20 text-brand-300 border-brand-400'
              : 'bg-night-900 text-gray-300 border-night-800 hover:text-white'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Arrastar / Zoom</span>
        </button>

        <button
          onClick={() => {
            setTool(tool === 'DRAW_PERIMETER' ? 'PAN' : 'DRAW_PERIMETER');
            soundAndVoice.playAlertSound('beep');
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold flex items-center space-x-1.5 border transition-all ${
            tool === 'DRAW_PERIMETER'
              ? 'bg-brand-500/20 text-brand-300 border-brand-400'
              : 'bg-night-900 text-gray-300 border-night-800 hover:text-white'
          }`}
        >
          <PenTool className="w-3.5 h-3.5" />
          <span>+ Torre Perímetro ({extNodes.length})</span>
        </button>

        <button
          onClick={() => {
            setTool(tool === 'PLACE_CAMERA' ? 'PAN' : 'PLACE_CAMERA');
            soundAndVoice.playAlertSound('beep');
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold flex items-center space-x-1.5 border transition-all ${
            tool === 'PLACE_CAMERA'
              ? 'bg-brand-500/20 text-brand-300 border-brand-400'
              : 'bg-night-900 text-gray-300 border-night-800 hover:text-white'
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Câmera CAD</span>
        </button>

        <button
          onClick={() => {
            setIs3D(!is3D);
            soundAndVoice.playAlertSound('beep');
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold flex items-center space-x-1.5 border transition-all ${
            is3D
              ? 'bg-brand-500/20 text-brand-300 border-brand-500/50'
              : 'bg-night-900 text-gray-300 border-night-800 hover:text-white'
          }`}
        >
          <Box className="w-3.5 h-3.5" />
          <span>{is3D ? 'Planta 2.5D Ativa' : 'Inclinar Planta 2.5D'}</span>
        </button>

        <button
          onClick={onSimulateIncident}
          className="px-3.5 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/40 text-xs font-mono font-bold flex items-center space-x-1.5 transition-all"
        >
          <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
          <span>Simular Invasão</span>
        </button>
      </footer>
    </div>
  );
};
