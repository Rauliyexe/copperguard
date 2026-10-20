import React, { useState, useEffect } from 'react';
import {
  CameraStream,
  IncidenteSeguranca,
  PortaoSeguranca,
  RegistroAcesso,
  FuncionarioProdutividade,
  MaquinaOEE,
  VeiculoTelemetria,
  PontoRisco
} from '../types';
import {
  Plus,
  Maximize2,
  Minimize2,
  MoveLeft,
  MoveRight,
  RotateCcw,
  Lock,
  Unlock,
  Camera,
  ScanFace,
  Flame,
  Truck,
  Cpu,
  ShieldAlert,
  Lightbulb,
  X,
  LayoutGrid
} from 'lucide-react';
import { soundAndVoice } from '../utils/soundAndVoice';
import { ThreePlantScene } from './ThreePlantScene';
import { ArchitecturalPlantCanvas } from './ArchitecturalPlantCanvas';

export type WidgetType =
  | 'CAMERA_SINGLE'
  | 'PORTOES_ECLUSAS'
  | 'PORTARIA_ACESSO'
  | 'PERIMETER_STATUS'
  | 'FORNOS_INDUCAO'
  | 'MAQUETE_3D_MINI'
  | 'PLANTA_2D_MINI'
  | 'FROTAS_TELEMETRIA'
  | 'MAQUINAS_OEE'
  | 'CFTV_MOSAICO';

export interface ModularWidget {
  id: string;
  type: WidgetType;
  title: string;
  camId?: string;
  colSpan: 3 | 4 | 6 | 8 | 12;
  height: 'standard' | 'tall';
}

interface CustomModularDashboardProps {
  cameras: CameraStream[];
  incidentes: IncidenteSeguranca[];
  portoes: PortaoSeguranca[];
  acessos: RegistroAcesso[];
  funcionarios: FuncionarioProdutividade[];
  maquinas: MaquinaOEE[];
  veiculos: VeiculoTelemetria[];
  pontos: PontoRisco[];
  onToggleCameraLight: (camId: string) => void;
  onToggleCameraSiren: (camId: string) => void;
  onTogglePortao: (portaoId: string) => void;
  onResolverIncidente: (id: string) => void;
  onSimulateIncident: () => void;
  voiceEnabled: boolean;
}

const DEFAULT_MODULAR_WIDGETS: ModularWidget[] = [
  {
    id: 'w-cam-portao-250',
    type: 'CAMERA_SINGLE',
    title: 'Câmera Portão Nº 250 (LPR)',
    camId: 'CAM-01',
    colSpan: 6,
    height: 'standard'
  },
  {
    id: 'w-portoes-remoto',
    type: 'PORTOES_ECLUSAS',
    title: 'Controle Remoto de Portões, Cancelas & Eclusas',
    colSpan: 6,
    height: 'standard'
  },
  {
    id: 'w-cam-muro-norte',
    type: 'CAMERA_SINGLE',
    title: 'Câmera Perímetro Muro Norte',
    camId: 'CAM-05',
    colSpan: 4,
    height: 'standard'
  },
  {
    id: 'w-perimetro-alarme',
    type: 'PERIMETER_STATUS',
    title: 'Status da Cerca 10.000V & Alarme',
    colSpan: 4,
    height: 'standard'
  },
  {
    id: 'w-fornos-termometria',
    type: 'FORNOS_INDUCAO',
    title: 'Termopares & Fornos de Indução',
    colSpan: 4,
    height: 'standard'
  }
];

export const CustomModularDashboard: React.FC<CustomModularDashboardProps> = ({
  cameras,
  incidentes,
  portoes,
  acessos,
  funcionarios,
  maquinas,
  veiculos,
  onToggleCameraLight,
  onTogglePortao,
  onResolverIncidente,
  onSimulateIncident,
  voiceEnabled
}) => {
  const [widgets, setWidgets] = useState<ModularWidget[]>(() => {
    try {
      const saved = localStorage.getItem('copperguard_modular_widgets_v2');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return DEFAULT_MODULAR_WIDGETS;
  });

  const [showAddModal, setShowAddModal] = useState(false);
  const [activeCamPTZZoom, setActiveCamPTZZoom] = useState<Record<string, number>>({});

  const activeIncidente = incidentes.find(i => i.status === 'EM_ABERTO');

  // Persistência automática no localStorage
  useEffect(() => {
    try {
      localStorage.setItem('copperguard_modular_widgets_v2', JSON.stringify(widgets));
    } catch {
      // ignore
    }
  }, [widgets]);

  const getCameraImage = (camId: string) => {
    if (camId === 'CAM-01' || camId === 'CAM-02') return '/cameras/cam-balanca.png';
    if (camId === 'CAM-04') return '/cameras/cam-forno.png';
    return '/cameras/cam-perimetro.png';
  };

  const handleRemoveWidget = (id: string) => {
    soundAndVoice.playAlertSound('beep');
    setWidgets(prev => prev.filter(w => w.id !== id));
  };

  const handleMoveWidget = (index: number, direction: 'left' | 'right') => {
    soundAndVoice.playAlertSound('beep');
    setWidgets(prev => {
      const target = direction === 'left' ? index - 1 : index + 1;
      if (target < 0 || target >= prev.length) return prev;
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[target];
      copy[target] = temp;
      return copy;
    });
  };

  const handleCycleColSpan = (id: string) => {
    soundAndVoice.playAlertSound('beep');
    setWidgets(prev =>
      prev.map(w => {
        if (w.id !== id) return w;
        const spans: ModularWidget['colSpan'][] = [3, 4, 6, 8, 12];
        const nextIdx = (spans.indexOf(w.colSpan) + 1) % spans.length;
        return { ...w, colSpan: spans[nextIdx] };
      })
    );
  };

  const handleToggleHeight = (id: string) => {
    soundAndVoice.playAlertSound('beep');
    setWidgets(prev =>
      prev.map(w => (w.id === id ? { ...w, height: w.height === 'tall' ? 'standard' : 'tall' } : w))
    );
  };

  const handleChangeWidgetCam = (id: string, newCamId: string) => {
    soundAndVoice.playAlertSound('beep');
    const camObj = cameras.find(c => c.id === newCamId);
    setWidgets(prev =>
      prev.map(w => (w.id === id ? { ...w, camId: newCamId, title: `Câmera ${newCamId} (${camObj?.nome || ''})` } : w))
    );
  };

  const handleAddWidget = (type: WidgetType, initialCam?: string) => {
    soundAndVoice.playAlertSound('beep');
    const newId = `w-${Date.now()}`;
    let title = 'Novo Painel';
    let colSpan: ModularWidget['colSpan'] = 6;
    let height: ModularWidget['height'] = 'standard';

    switch (type) {
      case 'CAMERA_SINGLE':
        title = `Câmera ${initialCam || 'CAM-01'}`;
        colSpan = 6;
        break;
      case 'PORTOES_ECLUSAS':
        title = 'Portões, Cancelas & Eclusas';
        colSpan = 6;
        break;
      case 'PORTARIA_ACESSO':
        title = 'Portaria & Catracas Faciais';
        colSpan = 6;
        break;
      case 'PERIMETER_STATUS':
        title = 'Perímetro 10.000V & Alarme';
        colSpan = 4;
        break;
      case 'FORNOS_INDUCAO':
        title = 'Termometria dos Fornos 1180°C';
        colSpan = 4;
        break;
      case 'MAQUETE_3D_MINI':
        title = 'Maquete 3D WebGL (Mini Digital Twin)';
        colSpan = 6;
        height = 'tall';
        break;
      case 'PLANTA_2D_MINI':
        title = 'Planta 2D CAD Interativa';
        colSpan = 6;
        height = 'tall';
        break;
      case 'FROTAS_TELEMETRIA':
        title = 'Telemetria de Frotas & Empilhadeiras';
        colSpan = 4;
        break;
      case 'MAQUINAS_OEE':
        title = 'OEE Geral & Máquinas da Planta';
        colSpan = 4;
        break;
      case 'CFTV_MOSAICO':
        title = 'Mosaico Geral CFTV';
        colSpan = 12;
        break;
    }

    setWidgets(prev => [
      ...prev,
      {
        id: newId,
        type,
        title,
        camId: initialCam || (type === 'CAMERA_SINGLE' ? 'CAM-01' : undefined),
        colSpan,
        height
      }
    ]);
    setShowAddModal(false);
  };

  const handleApplyPreset = (presetName: 'SEGURANCA' | 'ACESSOS' | 'COMPLETO') => {
    soundAndVoice.playAlertSound('beep');
    if (presetName === 'SEGURANCA') {
      setWidgets([
        { id: 'p-cam-5', type: 'CAMERA_SINGLE', title: 'Câmera Muro Norte', camId: 'CAM-05', colSpan: 6, height: 'standard' },
        { id: 'p-cam-6', type: 'CAMERA_SINGLE', title: 'Câmera Cofre Lingotes', camId: 'CAM-06', colSpan: 6, height: 'standard' },
        { id: 'p-perim', type: 'PERIMETER_STATUS', title: 'Status Cerca 10.000V', colSpan: 6, height: 'standard' },
        { id: 'p-radar', type: 'PLANTA_2D_MINI', title: 'Radar CAD 2D', colSpan: 6, height: 'tall' }
      ]);
    } else if (presetName === 'ACESSOS') {
      setWidgets([
        { id: 'p-cam-1', type: 'CAMERA_SINGLE', title: 'Câmera Portão Nº 250', camId: 'CAM-01', colSpan: 6, height: 'standard' },
        { id: 'p-cam-2', type: 'CAMERA_SINGLE', title: 'Câmera Portaria Sede', camId: 'CAM-02', colSpan: 6, height: 'standard' },
        { id: 'p-gates', type: 'PORTOES_ECLUSAS', title: 'Controle de Portões & Eclusas', colSpan: 8, height: 'standard' },
        { id: 'p-port', type: 'PORTARIA_ACESSO', title: 'Acessos & Catracas', colSpan: 4, height: 'standard' }
      ]);
    } else {
      setWidgets(DEFAULT_MODULAR_WIDGETS);
    }
  };

  return (
    <div className="w-full h-full bg-[#040A07] p-3.5 flex flex-col justify-between overflow-hidden select-none">
      {/* =====================================================================
          BARRA SUPERIOR DE PERSONALIZAÇÃO & TEMPLATES
         ===================================================================== */}
      <div className="flex items-center justify-between flex-wrap gap-2.5 bg-night-950/90 border border-night-800 rounded-2xl px-4 py-2.5 shadow-xl shrink-0">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <LayoutGrid className="w-4 h-4 text-brand-400" />
            <span className="font-mono font-bold text-xs text-white uppercase tracking-wider">
              Cockpit Modular Customizável
            </span>
          </div>
          <span className="text-[11px] font-mono text-gray-500">
            • {widgets.length} blocos ativos
          </span>
        </div>

        {/* Ações de Layout & Adicionar Módulo */}
        <div className="flex items-center space-x-2 text-xs font-mono">
          <div className="flex items-center bg-night-900 px-2 py-1 rounded-xl border border-night-800 text-[11px] text-gray-400 space-x-1.5">
            <span className="text-gray-500">Modelos:</span>
            <button
              onClick={() => handleApplyPreset('ACESSOS')}
              className="px-2 py-0.5 rounded hover:bg-night-800 hover:text-white text-gray-300 transition-colors"
            >
              Portões & Acessos
            </button>
            <button
              onClick={() => handleApplyPreset('SEGURANCA')}
              className="px-2 py-0.5 rounded hover:bg-night-800 hover:text-white text-gray-300 transition-colors"
            >
              Segurança
            </button>
            <button
              onClick={() => handleApplyPreset('COMPLETO')}
              className="px-2 py-0.5 rounded hover:bg-night-800 hover:text-white text-gray-300 transition-colors"
            >
              Padrão
            </button>
          </div>

          <button
            onClick={() => {
              soundAndVoice.playAlertSound('beep');
              setWidgets(DEFAULT_MODULAR_WIDGETS);
            }}
            className="px-2.5 py-1.5 rounded-xl bg-night-900 hover:bg-night-800 text-gray-400 hover:text-white border border-night-800 flex items-center space-x-1.5 transition-all"
            title="Resetar layout para o padrão"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Resetar</span>
          </button>

          <button
            onClick={() => {
              soundAndVoice.playAlertSound('beep');
              setShowAddModal(true);
            }}
            className="px-3.5 py-1.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-night-950 font-bold flex items-center space-x-1.5 transition-all shadow-glow-brand"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Adicionar Módulo</span>
          </button>
        </div>
      </div>

      {/* =====================================================================
          CANVAS MODULAR DE BLOCOS (GRID 12 COLUNAS)
         ===================================================================== */}
      <div className="flex-1 min-h-0 my-3 overflow-y-auto pr-1">
        {widgets.length === 0 ? (
          <div className="w-full h-full min-h-[360px] rounded-2xl border-2 border-dashed border-night-800 flex flex-col items-center justify-center text-center p-6 space-y-3 font-mono">
            <LayoutGrid className="w-10 h-10 text-gray-600" />
            <div>
              <p className="text-sm font-bold text-gray-300">Nenhum bloco no seu cockpit modular</p>
              <p className="text-xs text-gray-500 mt-1">
                Clique no botão abaixo para adicionar câmeras, portões eclusas, fornos ou sensores à sua tela.
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-400 text-night-950 font-bold text-xs uppercase"
            >
              + Adicionar Primeiro Módulo
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-12 gap-3.5">
            {widgets.map((widget, index) => {
              const colClass =
                widget.colSpan === 3
                  ? 'col-span-12 md:col-span-3'
                  : widget.colSpan === 4
                  ? 'col-span-12 md:col-span-4'
                  : widget.colSpan === 6
                  ? 'col-span-12 md:col-span-6'
                  : widget.colSpan === 8
                  ? 'col-span-12 md:col-span-8'
                  : 'col-span-12';

              const heightClass = widget.height === 'tall' ? 'min-h-[380px] h-[380px]' : 'min-h-[260px] h-[260px]';

              return (
                <div
                  key={widget.id}
                  className={`${colClass} ${heightClass} bg-night-950/90 border border-night-800 rounded-2xl flex flex-col overflow-hidden shadow-xl transition-all duration-150`}
                >
                  {/* Cabeçalho do Widget com Controles */}
                  <div className="h-9 px-3 border-b border-night-800 flex items-center justify-between shrink-0 bg-night-900/60 font-mono text-[11px]">
                    <div className="flex items-center space-x-2 truncate">
                      <span className="w-2 h-2 rounded-full bg-brand-400 shrink-0" />
                      <span className="font-semibold text-gray-200 truncate">{widget.title}</span>
                    </div>

                    <div className="flex items-center space-x-1 shrink-0 text-gray-400">
                      {/* Seletor de Câmera se for widget de câmera */}
                      {widget.type === 'CAMERA_SINGLE' && (
                        <select
                          value={widget.camId || 'CAM-01'}
                          onChange={e => handleChangeWidgetCam(widget.id, e.target.value)}
                          className="bg-night-950 border border-night-700 text-brand-300 rounded px-1.5 py-0.5 text-[10px] outline-none"
                        >
                          {cameras.map(c => (
                            <option key={c.id} value={c.id}>
                              {c.id} - {c.nome}
                            </option>
                          ))}
                        </select>
                      )}

                      {/* Botão de Redimensionar Largura */}
                      <button
                        onClick={() => handleCycleColSpan(widget.id)}
                        className="px-1.5 py-0.5 rounded hover:bg-night-800 text-gray-400 hover:text-white text-[10px]"
                        title={`Largura atual: ${widget.colSpan}/12 colunas. Clique para alterar.`}
                      >
                        {widget.colSpan}/12
                      </button>

                      {/* Botão de Alternar Altura */}
                      <button
                        onClick={() => handleToggleHeight(widget.id)}
                        className="p-1 rounded hover:bg-night-800 text-gray-400 hover:text-white"
                        title={widget.height === 'tall' ? 'Altura Padrão' : 'Altura Expandida'}
                      >
                        {widget.height === 'tall' ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
                      </button>

                      {/* Mover para a esquerda */}
                      <button
                        disabled={index === 0}
                        onClick={() => handleMoveWidget(index, 'left')}
                        className={`p-1 rounded hover:bg-night-800 ${index === 0 ? 'opacity-30' : 'text-gray-400 hover:text-white'}`}
                        title="Mover para esquerda"
                      >
                        <MoveLeft className="w-3 h-3" />
                      </button>

                      {/* Mover para a direita */}
                      <button
                        disabled={index === widgets.length - 1}
                        onClick={() => handleMoveWidget(index, 'right')}
                        className={`p-1 rounded hover:bg-night-800 ${index === widgets.length - 1 ? 'opacity-30' : 'text-gray-400 hover:text-white'}`}
                        title="Mover para direita"
                      >
                        <MoveRight className="w-3 h-3" />
                      </button>

                      {/* Remover Widget */}
                      <button
                        onClick={() => handleRemoveWidget(widget.id)}
                        className="p-1 rounded hover:bg-rose-950 hover:text-rose-400 text-gray-500 transition-colors"
                        title="Remover este bloco"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Conteúdo Interno do Widget Conforme seu Tipo */}
                  <div className="flex-1 min-h-0 relative overflow-hidden bg-black/60">
                    {/* WIDGET 1: CÂMERA CFTV INDIVIDUAL */}
                    {widget.type === 'CAMERA_SINGLE' && (() => {
                      const cam = cameras.find(c => c.id === (widget.camId || 'CAM-01')) || cameras[0];
                      const camZoom = activeCamPTZZoom[cam.id] || 1.0;
                      return (
                        <div className="w-full h-full relative overflow-hidden bg-black group">
                          <img
                            src={getCameraImage(cam.id)}
                            alt={cam.nome}
                            className="w-full h-full object-cover transition-transform duration-100"
                            style={{ transform: `scale(${camZoom})`, transformOrigin: 'center center' }}
                          />

                          {/* Overlay com Controles Rápidos da Câmera */}
                          <div className="absolute top-2 inset-x-2 flex items-center justify-between text-[10px] font-mono pointer-events-none">
                            <span className="bg-night-950/85 px-2 py-0.5 rounded border border-night-700 text-brand-300 font-bold">
                              {cam.id} • {cam.resolucao}
                            </span>
                            <div className="flex items-center space-x-1 pointer-events-auto">
                              <button
                                onClick={() => {
                                  onToggleCameraLight(cam.id);
                                  soundAndVoice.playAlertSound('beep');
                                }}
                                className={`p-1 rounded border ${cam.holofoteLigado ? 'bg-amber-500/20 border-amber-400 text-amber-300' : 'bg-night-950/80 border-night-700 text-gray-400'}`}
                                title="Holofote LED"
                              >
                                <Lightbulb className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => {
                                  setActiveCamPTZZoom(prev => ({
                                    ...prev,
                                    [cam.id]: prev[cam.id] && prev[cam.id] > 1.0 ? 1.0 : 1.75
                                  }));
                                }}
                                className="p-1 rounded bg-night-950/80 border border-night-700 text-gray-300 hover:text-white"
                                title="Zoom PTZ"
                              >
                                <Maximize2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          <div className="absolute bottom-2 left-2 bg-night-950/85 px-2 py-0.5 rounded text-[10px] font-mono text-gray-300 border border-night-700">
                            {cam.setor} • {cam.fps} FPS
                          </div>
                        </div>
                      );
                    })()}

                    {/* WIDGET 2: PORTÕES, CANCELAS & ECLUSAS */}
                    {widget.type === 'PORTOES_ECLUSAS' && (
                      <div className="w-full h-full p-3 font-mono text-xs flex flex-col justify-between overflow-y-auto space-y-1.5">
                        {portoes.map(p => {
                          const isOpen = p.status === 'ABERTO';
                          return (
                            <div
                              key={p.id}
                              className="p-2 rounded-lg bg-night-900/75 border border-night-800 flex items-center justify-between text-[11px]"
                            >
                              <div className="truncate pr-2">
                                <span className="text-white font-bold block truncate">{p.nome}</span>
                                <span className="text-[10px] text-gray-400">
                                  {p.quadra} • {p.ultimoAcionamento}
                                </span>
                              </div>
                              <button
                                onClick={() => onTogglePortao(p.id)}
                                className={`px-2.5 py-1 rounded-md border font-bold text-[10px] flex items-center space-x-1 shrink-0 transition-all ${
                                  isOpen
                                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 hover:bg-amber-500/30'
                                    : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25'
                                }`}
                              >
                                {isOpen ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                                <span>{isOpen ? 'ABERTO (TRAVAR)' : 'TRANCADO (ABRIR)'}</span>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* WIDGET 3: PORTARIA & CATRACAS FACIAIS */}
                    {widget.type === 'PORTARIA_ACESSO' && (
                      <div className="w-full h-full p-3 font-mono text-xs flex flex-col justify-between overflow-y-auto">
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-gray-400">CATRACAS FACIAIS 3D:</span>
                          <span className="text-emerald-400 font-bold">ONLINE (0.2s)</span>
                        </div>

                        <div className="space-y-1.5 my-2">
                          {acessos.slice(0, 3).map(a => (
                            <div key={a.id} className="p-2 rounded-lg bg-night-900/60 border border-night-800 flex justify-between items-center text-[11px]">
                              <div>
                                <span className="text-brand-300 font-bold block">{a.placaOuDoc}</span>
                                <span className="text-gray-400 text-[10px]">{a.nomePessoa}</span>
                              </div>
                              <span className="px-1.5 py-0.5 rounded bg-night-800 text-gray-300 text-[10px]">
                                {a.tipoFluxo} • {a.horarioEntrada}
                              </span>
                            </div>
                          ))}
                        </div>

                        <div className="text-[10px] text-gray-500 text-right">
                          Total na planta: {funcionarios.length} colaboradores ({funcionarios.filter(f => f.status === 'PRODUZINDO').length} em operação)
                        </div>
                      </div>
                    )}

                    {/* WIDGET 4: STATUS PERIMETRAL & ALARME */}
                    {widget.type === 'PERIMETER_STATUS' && (
                      <div className="w-full h-full p-3 font-mono text-xs flex flex-col justify-between overflow-y-auto">
                        <div className="p-2.5 rounded-xl bg-night-900/80 border border-night-800">
                          <span className="text-[10px] text-gray-400 block uppercase">CERCA ELÉTRICA INDUSTRIAL:</span>
                          <span className={`text-sm font-bold ${activeIncidente ? 'text-rose-400' : 'text-emerald-400'}`}>
                            {activeIncidente ? 'DISPARADA: QUEDA DE TENSÃO (P2-P3)' : '10.000 VOLTS • NORMAL'}
                          </span>
                        </div>

                        <div className="space-y-1 my-2 text-[11px]">
                          <div className="flex justify-between text-gray-400">
                            <span>SENSORES IVA:</span>
                            <span className="text-white">6 Zonas Armadas</span>
                          </div>
                          <div className="flex justify-between text-gray-400">
                            <span>RADAR 3D NORTE:</span>
                            <span className={activeIncidente ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                              {activeIncidente ? 'ALVO LOCALIZADO' : 'VARREDURA ATIVA'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={onSimulateIncident}
                            className="flex-1 py-1.5 rounded-lg bg-night-900 hover:bg-rose-950/60 border border-night-700 text-rose-300 text-[10px] transition-colors"
                          >
                            Simular Invasão
                          </button>
                          {activeIncidente && (
                            <button
                              onClick={() => onResolverIncidente(activeIncidente.id)}
                              className="flex-1 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] transition-colors"
                            >
                              Silenciar
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* WIDGET 5: FORNOS DE INDUÇÃO */}
                    {widget.type === 'FORNOS_INDUCAO' && (
                      <div className="w-full h-full p-3 font-mono text-xs flex flex-col justify-between overflow-y-auto">
                        <div className="p-2.5 rounded-xl bg-night-900/80 border border-night-800">
                          <span className="text-[10px] text-gray-400 block uppercase">FORNO DE INDUÇÃO #01:</span>
                          <span className="text-base font-bold text-amber-400">
                            1.180 °C • FUSÃO ATIVA
                          </span>
                        </div>

                        <div className="space-y-1 my-2 text-[11px]">
                          <div className="flex justify-between text-gray-400">
                            <span>FORNO DE INDUÇÃO #02:</span>
                            <span className="text-white">1.145 °C • OPERANDO</span>
                          </div>
                          <div className="flex justify-between text-gray-400">
                            <span>SUBESTAÇÃO 13.8kV:</span>
                            <span className="text-brand-300">920 kW • CLP MODBUS</span>
                          </div>
                        </div>

                        <div className="text-[10px] text-gray-500 text-right">
                          Termopares Tipo K calibrados
                        </div>
                      </div>
                    )}

                    {/* WIDGET 6: MINI MAQUETE 3D */}
                    {widget.type === 'MAQUETE_3D_MINI' && (
                      <div className="w-full h-full relative">
                        <ThreePlantScene
                          cameras={cameras}
                          funcionarios={funcionarios}
                          maquinas={maquinas}
                          veiculos={veiculos}
                          portoes={portoes}
                          incidentes={incidentes}
                          focusedCamId="CAM-01"
                          onSelectCamera={() => {}}
                          onSelectSector={() => {}}
                          onAddCameraAt={() => {}}
                          onTogglePortao={onTogglePortao}
                          onSimulateIncident={onSimulateIncident}
                          voiceEnabled={voiceEnabled}
                          onSwitchTo2D={() => {}}
                        />
                      </div>
                    )}

                    {/* WIDGET 7: MINI PLANTA 2D CAD */}
                    {widget.type === 'PLANTA_2D_MINI' && (
                      <div className="w-full h-full relative">
                        <ArchitecturalPlantCanvas
                          cameras={cameras}
                          funcionarios={funcionarios}
                          maquinas={maquinas}
                          veiculos={veiculos}
                          portoes={portoes}
                          incidentes={incidentes}
                          focusedCamId="CAM-01"
                          onSelectCamera={() => {}}
                          onSelectSector={() => {}}
                          onAddCameraAt={() => {}}
                          onTogglePortao={onTogglePortao}
                          onSimulateIncident={onSimulateIncident}
                          voiceEnabled={voiceEnabled}
                        />
                      </div>
                    )}

                    {/* WIDGET 8: FROTAS & EMPILHADEIRAS */}
                    {widget.type === 'FROTAS_TELEMETRIA' && (
                      <div className="w-full h-full p-3 font-mono text-xs flex flex-col justify-between overflow-y-auto">
                        <div className="space-y-2">
                          {veiculos.map(v => (
                            <div key={v.id} className="p-2 rounded-lg bg-night-900/60 border border-night-800 flex justify-between items-center text-[11px]">
                              <div>
                                <span className="text-amber-300 font-bold block">{v.prefixo} • {v.modelo}</span>
                                <span className="text-gray-400 text-[10px]">Op: {v.operadorAtual}</span>
                              </div>
                              <span className="text-white font-bold">{v.velocidadeAtualKmH} km/h</span>
                            </div>
                          ))}
                        </div>
                        <div className="text-[10px] text-gray-500 text-right">
                          Horímetros ativos em tempo real
                        </div>
                      </div>
                    )}

                    {/* WIDGET 9: OEE & MÁQUINAS */}
                    {widget.type === 'MAQUINAS_OEE' && (
                      <div className="w-full h-full p-3 font-mono text-xs flex flex-col justify-between overflow-y-auto">
                        <div className="space-y-2">
                          {maquinas.map(m => (
                            <div key={m.id} className="p-2 rounded-lg bg-night-900/60 border border-night-800 flex justify-between items-center text-[11px]">
                              <div>
                                <span className="text-white font-bold block">{m.nome}</span>
                                <span className="text-gray-400 text-[10px]">Turno: {m.horasTrabalhadasTurno}h</span>
                              </div>
                              <span className="text-brand-400 font-bold text-xs">{m.oee.oeeGeral}% OEE</span>
                            </div>
                          ))}
                        </div>
                        <div className="text-[10px] text-gray-500 text-right">
                          Média da fábrica: 86% OEE
                        </div>
                      </div>
                    )}

                    {/* WIDGET 10: MOSAICO CFTV COMPLETO */}
                    {widget.type === 'CFTV_MOSAICO' && (
                      <div className="w-full h-full grid grid-cols-3 grid-rows-2 gap-1 p-1 bg-black">
                        {cameras.map(c => (
                          <div key={c.id} className="relative w-full h-full overflow-hidden bg-black">
                            <img src={getCameraImage(c.id)} alt={c.nome} className="w-full h-full object-cover" />
                            <div className="absolute bottom-1 left-1 bg-black/80 px-1.5 py-0.5 rounded text-[9px] font-mono text-white">
                              {c.id}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* =====================================================================
          MODAL: ADICIONAR NOVO BLOCO AO COCKPIT
         ===================================================================== */}
      {showAddModal && (
        <div
          onClick={() => setShowAddModal(false)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="w-full max-w-2xl bg-[#070F0B]/95 border border-white/10 rounded-2xl p-6 shadow-2xl font-mono text-slate-100 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-night-800 pb-3">
              <div className="flex items-center space-x-2 text-brand-400">
                <Plus className="w-5 h-5" />
                <h3 className="font-bold text-sm tracking-wider text-white uppercase">
                  Adicionar Bloco ao Cockpit Modular
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-night-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-1">
              {/* Opção 1: Câmera CFTV */}
              <div
                onClick={() => handleAddWidget('CAMERA_SINGLE', 'CAM-01')}
                className="p-3 rounded-xl bg-night-900/60 border border-night-800 hover:border-brand-500/50 cursor-pointer transition-all space-y-1.5 group"
              >
                <div className="flex items-center space-x-2 text-brand-400">
                  <Camera className="w-4 h-4" />
                  <span className="font-bold text-xs text-white group-hover:text-brand-300">Câmera CFTV Individual</span>
                </div>
                <p className="text-[11px] text-gray-400 leading-snug">
                  Transmissão ao vivo de uma câmera específica com controles PTZ e holofote.
                </p>
              </div>

              {/* Opção 2: Portões, Cancelas & Eclusas */}
              <div
                onClick={() => handleAddWidget('PORTOES_ECLUSAS')}
                className="p-3 rounded-xl bg-night-900/60 border border-night-800 hover:border-brand-500/50 cursor-pointer transition-all space-y-1.5 group"
              >
                <div className="flex items-center space-x-2 text-brand-400">
                  <Lock className="w-4 h-4" />
                  <span className="font-bold text-xs text-white group-hover:text-brand-300">Portões, Cancelas & Eclusas</span>
                </div>
                <p className="text-[11px] text-gray-400 leading-snug">
                  Abertura e travamento remoto do Portão Nº 250, Grade Azul da Sede e Eclusa do Cofre.
                </p>
              </div>

              {/* Opção 3: Portaria & Acesso */}
              <div
                onClick={() => handleAddWidget('PORTARIA_ACESSO')}
                className="p-3 rounded-xl bg-night-900/60 border border-night-800 hover:border-brand-500/50 cursor-pointer transition-all space-y-1.5 group"
              >
                <div className="flex items-center space-x-2 text-brand-400">
                  <ScanFace className="w-4 h-4" />
                  <span className="font-bold text-xs text-white group-hover:text-brand-300">Portaria & Catracas Faciais</span>
                </div>
                <p className="text-[11px] text-gray-400 leading-snug">
                  Histórico de catracas faciais 3D e contagem de pessoas na planta.
                </p>
              </div>

              {/* Opção 4: Cerca & Alarme */}
              <div
                onClick={() => handleAddWidget('PERIMETER_STATUS')}
                className="p-3 rounded-xl bg-night-900/60 border border-night-800 hover:border-brand-500/50 cursor-pointer transition-all space-y-1.5 group"
              >
                <div className="flex items-center space-x-2 text-brand-400">
                  <ShieldAlert className="w-4 h-4" />
                  <span className="font-bold text-xs text-white group-hover:text-brand-300">Cerca 10.000V & Alarme</span>
                </div>
                <p className="text-[11px] text-gray-400 leading-snug">
                  Monitoramento contínuo da alta tensão perimétrica e silenciador de alarme.
                </p>
              </div>

              {/* Opção 5: Fornos */}
              <div
                onClick={() => handleAddWidget('FORNOS_INDUCAO')}
                className="p-3 rounded-xl bg-night-900/60 border border-night-800 hover:border-brand-500/50 cursor-pointer transition-all space-y-1.5 group"
              >
                <div className="flex items-center space-x-2 text-brand-400">
                  <Flame className="w-4 h-4" />
                  <span className="font-bold text-xs text-white group-hover:text-brand-300">Fornos de Indução (1180°C)</span>
                </div>
                <p className="text-[11px] text-gray-400 leading-snug">
                  Termometria em tempo real dos fornos de fusão de cobre e subestação.
                </p>
              </div>

              {/* Opção 6: Frotas */}
              <div
                onClick={() => handleAddWidget('FROTAS_TELEMETRIA')}
                className="p-3 rounded-xl bg-night-900/60 border border-night-800 hover:border-brand-500/50 cursor-pointer transition-all space-y-1.5 group"
              >
                <div className="flex items-center space-x-2 text-brand-400">
                  <Truck className="w-4 h-4" />
                  <span className="font-bold text-xs text-white group-hover:text-brand-300">Telemetria de Frotas</span>
                </div>
                <p className="text-[11px] text-gray-400 leading-snug">
                  Velocidade, horímetros e operadores das empilhadeiras no pátio.
                </p>
              </div>

              {/* Opção 7: OEE */}
              <div
                onClick={() => handleAddWidget('MAQUINAS_OEE')}
                className="p-3 rounded-xl bg-night-900/60 border border-night-800 hover:border-brand-500/50 cursor-pointer transition-all space-y-1.5 group"
              >
                <div className="flex items-center space-x-2 text-brand-400">
                  <Cpu className="w-4 h-4" />
                  <span className="font-bold text-xs text-white group-hover:text-brand-300">OEE & Máquinas</span>
                </div>
                <p className="text-[11px] text-gray-400 leading-snug">
                  Eficiência geral dos equipamentos e disponibilidade por turno.
                </p>
              </div>

              {/* Opção 8: Mosaico CFTV */}
              <div
                onClick={() => handleAddWidget('CFTV_MOSAICO')}
                className="p-3 rounded-xl bg-night-900/60 border border-night-800 hover:border-brand-500/50 cursor-pointer transition-all space-y-1.5 group"
              >
                <div className="flex items-center space-x-2 text-brand-400">
                  <LayoutGrid className="w-4 h-4" />
                  <span className="font-bold text-xs text-white group-hover:text-brand-300">Mosaico 6 Câmeras</span>
                </div>
                <p className="text-[11px] text-gray-400 leading-snug">
                  Visualização compacta com os 6 canais de CFTV simultâneos.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
