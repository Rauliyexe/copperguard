import React, { useState, useEffect, useMemo } from 'react';
import {
  CameraStream,
  IncidenteSeguranca
} from '../types';
import {
  Camera,
  ShieldAlert,
  Lightbulb,
  BellRing,
  Volume2,
  VolumeX,
  Radio,
  CheckCircle2,
  Download,
  Maximize2,
  Clock,
  KeyRound,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Monitor,
  Search,
  Plus,
  Server,
  X,
  Film,
  Building2,
  Truck,
  Package,
  Flame,
  LayoutGrid,
  ScanFace,
  Eye,
  Sliders,
  Crosshair,
  Activity,
  AlertTriangle
} from 'lucide-react';
import { soundAndVoice } from '../utils/soundAndVoice';
import { CleanCCTVWallboard } from './CleanCCTVWallboard';
import { copperGuardApi, ApiConfig } from '../services/copperGuardApi';

interface CameraAnalyticsScreenProps {
  cameras: CameraStream[];
  incidentes: IncidenteSeguranca[];
  selectedCamId: string;
  onSelectCamera: (camId: string) => void;
  onToggleCameraLight: (camId: string) => void;
  onToggleCameraSiren: (camId: string) => void;
  onResolverIncidente: (id: string) => void;
  onSimulateIncident: () => void;
  onAddCamera?: (newCam: CameraStream) => void;
  voiceEnabled: boolean;
  activeFunctionId?: string;
  onSelectFunction?: (functionId: string) => void;
}

// Normalização inteligente de setores para cada câmera do complexo industrial
export const getCameraSectorCategory = (cam: CameraStream): string => {
  const s = (cam.setor + ' ' + cam.nome).toLowerCase();
  if (s.includes('portaria') || s.includes('guarita') || s.includes('250')) return 'Portaria';
  if (s.includes('sede') || s.includes('admin') || s.includes('diretoria')) return 'Administração';
  if (s.includes('pátio') || s.includes('patio') || s.includes('carreta') || s.includes('carga') || s.includes('baia')) return 'Carga e Logística';
  if (s.includes('arco') || s.includes('forno') || s.includes('fundição') || s.includes('produção')) return 'Produção & Fundição';
  if (s.includes('alambrado') || s.includes('perímetro') || s.includes('perimetro') || s.includes('cerca') || s.includes('rodovia')) return 'Perímetro & Cerca';
  if (s.includes('cofre') || s.includes('estoque') || s.includes('geminado')) return 'Estoque & Cofre';
  return 'Outros';
};

export const CameraAnalyticsScreen: React.FC<CameraAnalyticsScreenProps> = ({
  cameras,
  incidentes,
  selectedCamId,
  onSelectCamera,
  onToggleCameraLight,
  onToggleCameraSiren,
  onResolverIncidente,
  onSimulateIncident,
  onAddCamera,
  voiceEnabled,
  activeFunctionId = 'camera-zoom',
  onSelectFunction
}) => {
  // Modo atual do módulo de câmeras sincronizado com a sidebar
  const currentMode = activeFunctionId || 'camera-zoom';

  // Filtros e busca
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSectorFilter, setSelectedSectorFilter] = useState<string>('TODOS');
  const [selectedUnidade, setSelectedUnidade] = useState('Matriz - CCO');

  // Relógio em tempo real
  const [currentTime, setCurrentTime] = useState<string>('');
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }) +
        ' ' +
        now.toLocaleTimeString('pt-BR')
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Controles PTZ virtuais com feedback visual em tempo real
  const [ptzZoom, setPtzZoom] = useState<number>(1.0);
  const [ptzPan, setPtzPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [ptzFocus, setPtzFocus] = useState<number>(50); // 50% = 100% nítido (0px blur)
  const [ptzIris, setPtzIris] = useState<number>(50);   // 50% = exposição 1.0
  const [isMuted, setIsMuted] = useState(true);
  const [invertControls, setInvertControls] = useState<boolean>(false); // Inversão opcional de eixos
  const [isDraggingFeed, setIsDraggingFeed] = useState<boolean>(false);
  const [ptzActionFeedback, setPtzActionFeedback] = useState<string | null>(null);

  // Sub-aba no celular para alternar entre Controles PTZ, Câmeras/Setores e Gravações
  const [mobileZoomTab, setMobileZoomTab] = useState<'PTZ' | 'SETORES' | 'GRAVACOES'>('PTZ');

  // Suporte a Touch Gestures (arrastar feed com toque no celular)
  const touchStartRef = React.useRef<{ x: number; y: number } | null>(null);

  // Período de gravação selecionado e exportação
  const [recordingPeriod, setRecordingPeriod] = useState('24h');
  const [isDownloadingClip, setIsDownloadingClip] = useState(false);

  // Controles analíticos de IA (Linhas Virtuais & Filtros)
  const [iaTripwireEnabled, setIaTripwireEnabled] = useState(true);
  const [iaHumanDetectEnabled, setIaHumanDetectEnabled] = useState(true);
  const [iaVehicleDetectEnabled, setIaVehicleDetectEnabled] = useState(true);
  const [iaLprEnabled, setIaLprEnabled] = useState(true);
  const [iaSensitivity, setIaSensitivity] = useState(95);

  // Modais
  const [showAddModal, setShowAddModal] = useState(false);
  const [showApiModal, setShowApiModal] = useState(false);

  // Reage se o usuário acionar a função de alocar câmera pela sidebar
  useEffect(() => {
    if (activeFunctionId === 'alocar-camera') {
      setShowAddModal(true);
    }
  }, [activeFunctionId]);

  // Formulário de Nova Câmera
  const [newCamForm, setNewCamForm] = useState({
    nome: '',
    setor: 'Portaria & Acessos',
    ip: '192.168.10.130',
    rtspUrl: 'rtsp://192.168.10.130:554/live/ch0',
    resolucao: '4K DarkFighter',
    fps: 30,
    linhaVirtual: true,
    deteccaoHumanos: true,
    deteccaoVeiculos: true,
    lpr: false
  });

  // Configuração da API
  const [apiConfig, setApiConfig] = useState<ApiConfig>(() => copperGuardApi.getConfig());
  const [apiTestResult, setApiTestResult] = useState<string | null>(null);

  const selectedCam = cameras.find(c => c.id === selectedCamId) || cameras[0] || {
    id: 'CAM-01',
    nome: 'Câmera Principal',
    setor: 'Portaria & Acessos',
    ip: '192.168.10.101',
    resolucao: '4K (3840x2160)',
    fps: 30,
    status: 'ONLINE' as const,
    analiticoIA: { linhaVirtualAtiva: true, deteccaoHumanos: true, deteccaoVeiculos: true, leituraPlacaLPR: true },
    eventosUltimaHora: 0,
    coords: { x: 50, y: 50 }
  };

  const activeIncidente = incidentes.find(i => i.status === 'EM_ABERTO');

  // Mapeamento de imagem da câmera
  const getCameraImage = (camId: string) => {
    if (camId === 'CAM-01' || camId === 'CAM-02') return '/cameras/cam-balanca.png';
    if (camId === 'CAM-04') return '/cameras/cam-forno.png';
    return '/cameras/cam-perimetro.png';
  };

  // Setores padronizados com contagens reais
  const sectorsList = useMemo(() => [
    { id: 'TODOS', label: 'Todos os Setores', icon: LayoutGrid, count: cameras.length },
    { id: 'Portaria', label: 'Portaria & Acessos', icon: KeyRound, count: cameras.filter(c => getCameraSectorCategory(c) === 'Portaria').length },
    { id: 'Administração', label: 'Sede Administrativa', icon: Building2, count: cameras.filter(c => getCameraSectorCategory(c) === 'Administração').length },
    { id: 'Carga e Logística', label: 'Carga & Logística', icon: Truck, count: cameras.filter(c => getCameraSectorCategory(c) === 'Carga e Logística').length },
    { id: 'Produção & Fundição', label: 'Produção & Fundição', icon: Flame, count: cameras.filter(c => getCameraSectorCategory(c) === 'Produção & Fundição').length },
    { id: 'Perímetro & Cerca', label: 'Perímetro & Cerca', icon: Radio, count: cameras.filter(c => getCameraSectorCategory(c) === 'Perímetro & Cerca').length },
    { id: 'Estoque & Cofre', label: 'Estoque & Cofre', icon: Package, count: cameras.filter(c => getCameraSectorCategory(c) === 'Estoque & Cofre').length },
  ], [cameras]);

  // Câmeras filtradas por setor e busca
  const filteredCameras = useMemo(() => {
    return cameras.filter(cam => {
      const matchesSearch = searchQuery.trim() === '' ||
        cam.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cam.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cam.setor.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cam.ip.toLowerCase().includes(searchQuery.toLowerCase());
      const category = getCameraSectorCategory(cam);
      const matchesSector = selectedSectorFilter === 'TODOS' || category === selectedSectorFilter;
      return matchesSearch && matchesSector;
    });
  }, [cameras, searchQuery, selectedSectorFilter]);

  const showPtzFeedback = (msg: string) => {
    setPtzActionFeedback(msg);
    setTimeout(() => setPtzActionFeedback(null), 1200);
  };

  // Ações PTZ (Controle de Navegação Direta de Câmeras CFTV)
  const handlePtzMove = (direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'OK') => {
    soundAndVoice.playAlertSound('beep');
    const step = 25;
    const inv = invertControls ? -1 : 1;

    if (direction === 'UP') {
      // Mover para CIMA (em CSS, deslocar para cima é -Y)
      setPtzPan(prev => ({ ...prev, y: Math.max(-120, Math.min(120, prev.y - (step * inv))) }));
      setPtzZoom(z => (z === 1.0 ? 1.15 : z));
      showPtzFeedback(inv === 1 ? 'TILT CIMA ↑' : 'TILT BAIXO ↓');
    }
    if (direction === 'DOWN') {
      // Mover para BAIXO (em CSS, deslocar para baixo é +Y)
      setPtzPan(prev => ({ ...prev, y: Math.max(-120, Math.min(120, prev.y + (step * inv))) }));
      setPtzZoom(z => (z === 1.0 ? 1.15 : z));
      showPtzFeedback(inv === 1 ? 'TILT BAIXO ↓' : 'TILT CIMA ↑');
    }
    if (direction === 'LEFT') {
      // Mover para a ESQUERDA (em CSS, deslocar para a esquerda é -X)
      setPtzPan(prev => ({ ...prev, x: Math.max(-120, Math.min(120, prev.x - (step * inv))) }));
      setPtzZoom(z => (z === 1.0 ? 1.15 : z));
      showPtzFeedback(inv === 1 ? 'PAN ESQUERDA ←' : 'PAN DIREITA →');
    }
    if (direction === 'RIGHT') {
      // Mover para a DIREITA (em CSS, deslocar para a direita é +X)
      setPtzPan(prev => ({ ...prev, x: Math.max(-120, Math.min(120, prev.x + (step * inv))) }));
      setPtzZoom(z => (z === 1.0 ? 1.15 : z));
      showPtzFeedback(inv === 1 ? 'PAN DIREITA →' : 'PAN ESQUERDA ←');
    }
    if (direction === 'OK') {
      setPtzPan({ x: 0, y: 0 });
      setPtzZoom(1.0);
      setPtzFocus(50);
      setPtzIris(50);
      showPtzFeedback('HOME (CENTRO 1.0x)');
    }
    const apiAction = direction === 'UP' ? 'TILT_UP' : direction === 'DOWN' ? 'TILT_DOWN' : direction === 'LEFT' ? 'PAN_LEFT' : direction === 'RIGHT' ? 'PAN_RIGHT' : 'PRESET_HOME';
    copperGuardApi.sendPtzCommand(selectedCam.id, apiAction);
  };

  const handlePtzZoomChange = (delta: number) => {
    soundAndVoice.playAlertSound('beep');
    setPtzZoom(prev => {
      const next = Math.max(1.0, Math.min(4.0, Number((prev + delta).toFixed(1))));
      copperGuardApi.sendPtzCommand(selectedCam.id, delta > 0 ? 'ZOOM_IN' : 'ZOOM_OUT');
      showPtzFeedback(`ZOOM: ${next}x`);
      return next;
    });
  };

  // Controle de arrasto com mouse diretamente sobre o vídeo
  const handleFeedMouseDown = (_e: React.MouseEvent) => {
    setIsDraggingFeed(true);
  };

  const handleFeedMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingFeed) return;
    const inv = invertControls ? -1 : 1;
    setPtzPan(prev => ({
      x: Math.max(-120, Math.min(120, prev.x + (e.movementX * inv))),
      y: Math.max(-120, Math.min(120, prev.y + (e.movementY * inv)))
    }));
    setPtzZoom(z => (z === 1.0 ? 1.15 : z));
  };

  const handleFeedMouseUp = () => {
    setIsDraggingFeed(false);
  };

  // Suporte a Touch Dragging no feed de vídeo em celulares (Touch Events)
  const handleFeedTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      };
      setIsDraggingFeed(true);
    }
  };

  const handleFeedTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingFeed || !touchStartRef.current || e.touches.length !== 1) return;
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const deltaX = currentX - touchStartRef.current.x;
    const deltaY = currentY - touchStartRef.current.y;
    touchStartRef.current = { x: currentX, y: currentY };

    const inv = invertControls ? -1 : 1;
    setPtzPan(prev => ({
      x: Math.max(-120, Math.min(120, prev.x + (deltaX * inv))),
      y: Math.max(-120, Math.min(120, prev.y + (deltaY * inv)))
    }));
    setPtzZoom(z => (z === 1.0 ? 1.15 : z));
  };

  const handleFeedTouchEnd = () => {
    setIsDraggingFeed(false);
    touchStartRef.current = null;
  };

  const handleFeedWheel = (e: React.WheelEvent) => {
    const delta = e.deltaY < 0 ? 0.2 : -0.2;
    handlePtzZoomChange(delta);
  };

  // Navegação PTZ por teclado (Setas, +, -, Espaço/R)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') {
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        handlePtzMove('UP');
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        handlePtzMove('DOWN');
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePtzMove('LEFT');
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handlePtzMove('RIGHT');
      } else if (e.key === ' ' || e.key === 'Home' || e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        handlePtzMove('OK');
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        handlePtzZoomChange(0.2);
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        handlePtzZoomChange(-0.2);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [invertControls, selectedCam.id]);

  // Exportar clipe de segurança
  const handleExportClip = async () => {
    setIsDownloadingClip(true);
    soundAndVoice.playAlertSound('beep');
    const duration = recordingPeriod === '24h' ? 1440 : recordingPeriod === '6h' ? 360 : recordingPeriod === '1h' ? 60 : 15;
    const clip = await copperGuardApi.exportClip(selectedCam.id, duration);
    setTimeout(() => {
      setIsDownloadingClip(false);
      soundAndVoice.speakAlert(`Clipe de segurança da câmera ${selectedCam.id} exportado com sucesso via API.`, voiceEnabled);
      const link = document.createElement('a');
      link.href = clip.downloadUrl;
      link.download = clip.filename;
      link.click();
    }, 1200);
  };

  // Submissão de Nova Câmera
  const handleCreateCameraSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCamForm.nome) return;

    soundAndVoice.playAlertSound('beep');
    const created = await copperGuardApi.createCamera({
      nome: newCamForm.nome,
      setor: newCamForm.setor,
      ip: newCamForm.ip,
      resolucao: newCamForm.resolucao,
      fps: Number(newCamForm.fps),
      status: 'ONLINE',
      eventosUltimaHora: 0,
      analiticoIA: {
        linhaVirtualAtiva: newCamForm.linhaVirtual,
        deteccaoHumanos: newCamForm.deteccaoHumanos,
        deteccaoVeiculos: newCamForm.deteccaoVeiculos,
        leituraPlacaLPR: newCamForm.lpr
      },
      coords: { x: 50 + Math.random() * 20, y: 50 + Math.random() * 20 }
    });

    if (onAddCamera) {
      onAddCamera(created);
    }
    onSelectCamera(created.id);
    setShowAddModal(false);
    if (onSelectFunction) onSelectFunction('camera-zoom');
    soundAndVoice.speakAlert(`Nova câmera ${created.id} alocada no setor ${created.setor} e sincronizada na API.`, voiceEnabled);
  };

  // Teste de conexão REST API
  const handleTestApi = async () => {
    setApiTestResult('Testando comunicação...');
    const result = await copperGuardApi.testConnection();
    setApiTestResult(result.message);
    setApiConfig(copperGuardApi.getConfig());
  };

  // =========================================================================
  // PAINÉIS MODULARES PARA USO RESPONSIVO DESKTOP E MOBILE
  // =========================================================================

  // Painel de Setores, Busca e Status
  const renderSectorsPanel = () => (
    <div className="rounded-2xl bg-[#0A140F] border border-[#16291E] p-3 flex flex-col justify-between overflow-hidden shadow-sm h-full w-full">
      <div className="space-y-2.5 flex-1 min-h-0 flex flex-col">
        {/* Campo de Busca com Botão de Limpar */}
        <div className="relative shrink-0">
          <Search className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar câmera..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-7 py-1.5 bg-[#070F0B] border border-[#16291E] rounded-xl text-xs font-mono text-gray-200 placeholder-gray-600 outline-none focus:border-emerald-500/60"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Lista Interativa de Setores */}
        <div className="flex-1 min-h-0 overflow-y-auto space-y-1 pr-1 font-mono text-xs max-h-56 md:max-h-none">
          {sectorsList.map(sec => {
            const SecIcon = sec.icon;
            const isSelected = selectedSectorFilter === sec.id;

            return (
              <button
                key={sec.id}
                onClick={() => {
                  soundAndVoice.playAlertSound('beep');
                  setSelectedSectorFilter(isSelected ? 'TODOS' : sec.id);
                  const inSector = cameras.find(c => sec.id === 'TODOS' || getCameraSectorCategory(c) === sec.id);
                  if (inSector) onSelectCamera(inSector.id);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-950/60 text-emerald-300 font-bold border border-emerald-700/60 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                    : 'text-gray-300 hover:text-white hover:bg-[#0E1A14] border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <SecIcon className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="truncate">{sec.label}</span>
                </div>
                <span className="text-[10px] bg-[#070F0B] border border-[#16291E] px-1.5 py-0.2 rounded font-mono text-gray-400 shrink-0">
                  {sec.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Status da Planta */}
      <div className="pt-2.5 border-t border-[#16291E] space-y-1.5 shrink-0 font-mono text-[11px] mt-2">
        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block px-1">
          Status da Infraestrutura
        </span>
        <div className="flex items-center justify-between px-1 text-gray-300">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Câmeras Online</span>
          </span>
          <span className="font-bold text-emerald-400">
            {cameras.filter(c => c.status === 'ONLINE').length}
          </span>
        </div>
        <div className="flex items-center justify-between px-1 text-gray-300">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>Alertas / Invasão</span>
          </span>
          <span className="font-bold text-rose-400">
            {cameras.filter(c => c.status === 'ALERTA').length}
          </span>
        </div>
        <div className="flex items-center justify-between px-1 text-gray-300">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-gray-500" />
            <span>API REST</span>
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-emerald-400 font-bold">
              {apiConfig.status}
            </span>
            <button
              onClick={() => setShowApiModal(true)}
              className="p-1 rounded hover:bg-[#16291E] text-gray-400 hover:text-emerald-400 transition-colors cursor-pointer"
              title="Configurações da API REST & NVR"
            >
              <Server className="w-3 h-3" />
            </button>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="w-full mt-1 py-1.5 rounded-xl bg-[#0E1A14] hover:bg-[#16291E] border border-emerald-800/40 text-emerald-300 text-[10px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <Plus className="w-3 h-3" />
          <span>Alocar Câmera</span>
        </button>
      </div>
    </div>
  );

  // Painel de Controle PTZ
  const renderPtzConsolePanel = () => (
    <div className="rounded-2xl bg-[#0A140F] border border-[#16291E] p-3.5 sm:p-4 flex flex-col items-center justify-between space-y-4 shadow-sm w-full">
      <div className="w-full flex items-center justify-between border-b border-[#16291E] pb-2 font-mono text-xs">
        <span className="font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5 text-emerald-400" />
          <span>Controle PTZ</span>
        </span>
        
        <div className="flex items-center gap-1.5">
          {/* Seletor Segmentado de Modo de Eixos PTZ */}
          <div className="flex items-center gap-1 bg-[#070F0B] p-0.5 rounded-lg border border-[#16291E] text-[10px]">
            <button
              onClick={() => {
                setInvertControls(false);
                soundAndVoice.playAlertSound('beep');
                showPtzFeedback('EIXOS: MODO DIRETO');
              }}
              className={`px-2 py-0.5 rounded font-bold transition-all cursor-pointer ${
                !invertControls
                  ? 'bg-emerald-500 text-black shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
              title="Movimento Direto: clicar na seta move a imagem diretamente para aquele lado"
            >
              Direto
            </button>
            <button
              onClick={() => {
                setInvertControls(true);
                soundAndVoice.playAlertSound('beep');
                showPtzFeedback('EIXOS: MODO INVERTIDO');
              }}
              className={`px-2 py-0.5 rounded font-bold transition-all cursor-pointer ${
                invertControls
                  ? 'bg-amber-500 text-black shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
              title="Movimento Invertido: simulação de rotação física da lente PTZ / drone"
            >
              Invertido
            </button>
          </div>

          <span className="text-[10px] text-emerald-400 font-bold">
            {selectedCam.id}
          </span>
        </div>
      </div>

      {/* D-Pad Circular Industrial com Coordenadas */}
      <div className="flex flex-col items-center gap-1.5">
        <div className="relative w-36 h-36 rounded-full border-2 border-[#16291E] bg-[#070F0B] flex items-center justify-center shadow-inner">
          {/* Cima */}
          <button
            onClick={() => handlePtzMove('UP')}
            className="absolute top-1 p-2 rounded-full hover:bg-emerald-500/20 text-gray-400 hover:text-emerald-300 transition-colors cursor-pointer active:scale-95"
            title="Inclinar para Cima (Tilt Up • Seta ↑)"
          >
            <ChevronUp className="w-5 h-5" />
          </button>

          {/* Esquerda */}
          <button
            onClick={() => handlePtzMove('LEFT')}
            className="absolute left-1 p-2 rounded-full hover:bg-emerald-500/20 text-gray-400 hover:text-emerald-300 transition-colors cursor-pointer active:scale-95"
            title="Panorâmica para Esquerda (Pan Left • Seta ←)"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Botão Central OK (Home Preset) */}
          <button
            onClick={() => handlePtzMove('OK')}
            className="w-12 h-12 rounded-full bg-[#0E1A14] border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/20 font-mono font-bold text-xs flex items-center justify-center shadow-md transition-all cursor-pointer active:scale-95"
            title="Redefinir Posição Home / Zoom 1.0x (Tecla R / Espaço)"
          >
            OK
          </button>

          {/* Direita */}
          <button
            onClick={() => handlePtzMove('RIGHT')}
            className="absolute right-1 p-2 rounded-full hover:bg-emerald-500/20 text-gray-400 hover:text-emerald-300 transition-colors cursor-pointer active:scale-95"
            title="Panorâmica para Direita (Pan Right • Seta →)"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Baixo */}
          <button
            onClick={() => handlePtzMove('DOWN')}
            className="absolute bottom-1 p-2 rounded-full hover:bg-emerald-500/20 text-gray-400 hover:text-emerald-300 transition-colors cursor-pointer active:scale-95"
            title="Inclinar para Baixo (Tilt Down • Seta ↓)"
          >
            <ChevronDown className="w-5 h-5" />
          </button>
        </div>

        <div className="font-mono text-[10px] text-gray-400 flex items-center gap-3">
          <span>PAN: <strong className="text-emerald-400">{(ptzPan.x / 3).toFixed(0)}° {ptzPan.x > 0 ? '(D)' : ptzPan.x < 0 ? '(E)' : ''}</strong></span>
          <span>•</span>
          <span>TILT: <strong className="text-emerald-400">{(-ptzPan.y / 3).toFixed(0)}° {ptzPan.y < 0 ? '(↑)' : ptzPan.y > 0 ? '(↓)' : ''}</strong></span>
        </div>
        <div className="text-[9px] text-gray-500 font-mono text-center">
          Toque e arraste o vídeo com o dedo • Toque nas setas • Botão OK para Home
        </div>
      </div>

      {/* Sliders Reais de Zoom, Foco e Íris */}
      <div className="w-full space-y-2.5 font-mono text-xs">
        {/* Zoom */}
        <div className="p-2 rounded-xl bg-[#070F0B] border border-[#16291E] space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-gray-400">Zoom Digital:</span>
            <strong className="text-emerald-400">{ptzZoom}x</strong>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePtzZoomChange(-0.5)}
              className="px-2.5 py-1 rounded-lg bg-[#0E1A14] hover:bg-[#16291E] text-gray-300 font-bold active:scale-95"
            >
              -
            </button>
            <input
              type="range"
              min="1.0"
              max="4.0"
              step="0.1"
              value={ptzZoom}
              onChange={e => {
                setPtzZoom(Number(e.target.value));
                copperGuardApi.sendPtzCommand(selectedCam.id, 'ZOOM_IN');
              }}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <button
              onClick={() => handlePtzZoomChange(0.5)}
              className="px-2.5 py-1 rounded-lg bg-[#0E1A14] hover:bg-[#16291E] text-gray-300 font-bold active:scale-95"
            >
              +
            </button>
          </div>
        </div>

        {/* Foco (Ajusta nitidez/blur em tempo real) */}
        <div className="p-2 rounded-xl bg-[#070F0B] border border-[#16291E] space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-gray-400">Foco / Lente:</span>
            <strong className="text-emerald-400">{ptzFocus}% {ptzFocus === 50 ? '(Nítido)' : ''}</strong>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPtzFocus(f => Math.max(0, f - 10))}
              className="px-2.5 py-1 rounded-lg bg-[#0E1A14] hover:bg-[#16291E] text-gray-300 font-bold active:scale-95"
            >
              -
            </button>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={ptzFocus}
              onChange={e => setPtzFocus(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <button
              onClick={() => setPtzFocus(f => Math.min(100, f + 10))}
              className="px-2.5 py-1 rounded-lg bg-[#0E1A14] hover:bg-[#16291E] text-gray-300 font-bold active:scale-95"
            >
              +
            </button>
          </div>
        </div>

        {/* Íris (Ajusta brilho/abertura em tempo real) */}
        <div className="p-2 rounded-xl bg-[#070F0B] border border-[#16291E] space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-gray-400">Íris / Abertura:</span>
            <strong className="text-emerald-400">{ptzIris}%</strong>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPtzIris(i => Math.max(0, i - 10))}
              className="px-2.5 py-1 rounded-lg bg-[#0E1A14] hover:bg-[#16291E] text-gray-300 font-bold active:scale-95"
            >
              -
            </button>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={ptzIris}
              onChange={e => setPtzIris(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <button
              onClick={() => setPtzIris(i => Math.min(100, i + 10))}
              className="px-2.5 py-1 rounded-lg bg-[#0E1A14] hover:bg-[#16291E] text-gray-300 font-bold active:scale-95"
            >
              +
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Painel de Gravações & DVR
  const renderRecordingsPanel = () => (
    <div className="rounded-2xl bg-[#0A140F] border border-[#16291E] p-4 space-y-3 shadow-sm font-mono text-xs w-full">
      <div className="flex items-center justify-between border-b border-[#16291E] pb-2">
        <span className="font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
          <Film className="w-3.5 h-3.5 text-gray-400" />
          <span>Gravação de Segurança</span>
        </span>
        <span className="text-[10px] text-emerald-400 font-bold">NVR ON</span>
      </div>

      <select
        value={recordingPeriod}
        onChange={e => setRecordingPeriod(e.target.value)}
        className="w-full bg-[#070F0B] border border-[#16291E] rounded-xl px-3 py-2 text-gray-300 outline-none text-xs focus:border-emerald-500/60"
      >
        <option value="24h">Últimas 24 horas</option>
        <option value="6h">Últimas 6 horas</option>
        <option value="1h">Última 1 hora</option>
        <option value="15m">Últimos 15 minutos</option>
      </select>

      <button
        onClick={handleExportClip}
        disabled={isDownloadingClip}
        className="w-full py-2.5 rounded-xl bg-[#0E1A14] hover:bg-[#16291E] border border-emerald-700/60 hover:border-emerald-500 text-emerald-300 font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
      >
        <Download className="w-4 h-4" />
        <span>{isDownloadingClip ? 'Exportando Evidência...' : 'Exportar Vídeo MP4'}</span>
      </button>

      <button
        onClick={() => onSelectFunction?.('telao-integrado')}
        className="w-full py-2 rounded-xl bg-[#070F0B] hover:bg-[#0E1A14] border border-[#16291E] text-gray-400 hover:text-white flex items-center justify-center gap-2 transition-colors cursor-pointer text-[11px]"
      >
        <Monitor className="w-3.5 h-3.5 text-emerald-400" />
        <span>Entrar no Telão Sem HUD</span>
      </button>
    </div>
  );

  // =========================================================================
  // MODO TELÃO SEM HUD (Acoplado diretamente com retorno limpo)
  // =========================================================================
  if (currentMode === 'telao-integrado') {
    return (
      <CleanCCTVWallboard
        cameras={cameras}
        incidentes={incidentes}
        selectedCamId={selectedCamId}
        onSelectCamera={onSelectCamera}
        onToggleCameraLight={onToggleCameraLight}
        onToggleCameraSiren={onToggleCameraSiren}
        onExitWallboard={() => {
          if (onSelectFunction) onSelectFunction('camera-zoom');
        }}
        voiceEnabled={voiceEnabled}
      />
    );
  }

  return (
    <div className="w-full h-full bg-[#070F0B] text-slate-100 flex flex-col font-sans select-none overflow-hidden p-2.5 sm:p-3">
      {/* =====================================================================
          RENDERIZAÇÃO DIRETA DA FUNÇÃO SELECIONADA NA SIDEBAR (SEM CABEÇALHOS DUPLICADOS)
         ===================================================================== */}

      {/* -------------------------------------------------------------------
          MODO A: MURAL DE 6 CANAIS (GRADE MULTICÂMERAS 4K)
         ------------------------------------------------------------------- */}
      {currentMode === 'mural-geral' ? (
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          {/* Grade 3x2 / 2x3 de Câmeras em Altura Total */}
          <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 overflow-y-auto pr-1">
            {cameras.map(cam => {
              const isSelected = cam.id === selectedCam.id;
              const isAlert = cam.status === 'ALERTA';

              return (
                <div
                  key={cam.id}
                  onClick={() => onSelectCamera(cam.id)}
                  className={`relative rounded-2xl bg-[#0A140F] border overflow-hidden flex flex-col cursor-pointer transition-all duration-200 group shadow-md ${
                    isAlert
                      ? 'border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.3)] ring-2 ring-rose-500/40'
                      : isSelected
                      ? 'border-emerald-500 shadow-[0_0_16px_rgba(16,185,129,0.25)]'
                      : 'border-[#16291E] hover:border-emerald-500/50'
                  }`}
                >
                  {/* Cabeçalho do Canal */}
                  <div className="h-8 px-3 bg-[#070F0B]/90 border-b border-[#16291E] flex items-center justify-between shrink-0 font-mono text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-bold text-white text-[11px] truncate">
                        {cam.id} • {cam.setor}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${
                        isAlert
                          ? 'bg-rose-950 text-rose-300 border-rose-600 animate-pulse'
                          : 'bg-emerald-950 text-emerald-400 border-emerald-800'
                      }`}>
                        {cam.status}
                      </span>

                      {/* Botão Atalho para Foco PTZ */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectCamera(cam.id);
                          if (onSelectFunction) onSelectFunction('camera-zoom');
                        }}
                        className="p-1 rounded bg-[#0E1A14] hover:bg-emerald-500/20 text-gray-300 hover:text-emerald-300 transition-colors"
                        title="Abrir em Foco PTZ"
                      >
                        <Maximize2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Tela de Vídeo */}
                  <div className="flex-1 min-h-[160px] relative bg-black overflow-hidden">
                    <img
                      src={getCameraImage(cam.id)}
                      alt={cam.nome}
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-200"
                    />

                    {/* Efeito Iluminação do Holofote */}
                    {cam.holofoteLigado && (
                      <div className="absolute inset-0 bg-amber-400/15 pointer-events-none shadow-[inset_0_0_60px_rgba(251,191,36,0.3)]" />
                    )}

                    {/* Banner de Sirene Ativa */}
                    {cam.sireneLigada && (
                      <div className="absolute top-2 inset-x-2 py-0.5 bg-rose-600/90 text-white font-mono text-[9px] font-extrabold text-center uppercase tracking-widest rounded animate-pulse pointer-events-none">
                        SIRENE PERIMÉTRICA 110DB ATIVA
                      </div>
                    )}

                    {/* Bounding box de Alarme */}
                    {isAlert && (
                      <div className="absolute inset-x-8 inset-y-6 border-2 border-rose-500 bg-rose-500/15 rounded flex flex-col justify-between p-1 font-mono animate-pulse pointer-events-none">
                        <span className="text-[8px] bg-rose-600 text-white font-bold px-1 rounded w-fit">
                          INTRUSÃO PERIMETRAL (99.4%)
                        </span>
                        <span className="text-[8px] text-rose-300">
                          LINHA VIRTUAL VIOLADA
                        </span>
                      </div>
                    )}

                    {/* OSD Inferior */}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/70 to-transparent p-2 flex items-end justify-between font-mono text-[10px]">
                      <div>
                        <span className="text-white font-bold block truncate max-w-[180px]">{cam.nome}</span>
                        <span className="text-gray-400 text-[9px]">{cam.resolucao} • {cam.fps} FPS</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            soundAndVoice.playAlertSound('beep');
                            onToggleCameraLight(cam.id);
                          }}
                          className={`p-1.5 rounded-lg border transition-colors ${
                            cam.holofoteLigado ? 'bg-amber-500/20 border-amber-400 text-amber-300' : 'bg-black/60 border-white/10 text-gray-400 hover:text-white'
                          }`}
                          title="Ligar Holofote LED"
                        >
                          <Lightbulb className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            soundAndVoice.playAlertSound('critical');
                            onToggleCameraSiren(cam.id);
                          }}
                          className={`p-1.5 rounded-lg border transition-colors ${
                            cam.sireneLigada ? 'bg-rose-500/30 border-rose-400 text-rose-300 animate-pulse' : 'bg-black/60 border-white/10 text-gray-400 hover:text-white'
                          }`}
                          title="Acionar Sirene"
                        >
                          <BellRing className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : currentMode === 'analitico-ia' ? (
        /* -------------------------------------------------------------------
            MODO B: ANALÍTICO DE IA & LINHAS VIRTUAIS (INSPETOR DE VISÃO)
           ------------------------------------------------------------------- */
        <div className="flex-1 min-h-0 grid grid-cols-12 gap-3.5 overflow-hidden">
          {/* Player com Overlays Visuais de IA */}
          <div className="col-span-12 lg:col-span-8 rounded-2xl bg-[#0A140F] border border-[#16291E] flex flex-col overflow-hidden shadow-xl">
            <div className="h-10 px-3.5 bg-[#070F0B]/80 border-b border-[#16291E] flex items-center justify-between shrink-0 font-mono text-xs">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <span className="font-bold text-white">
                  Inspetor de Visão Computacional • {selectedCam.id} ({selectedCam.setor})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-400 text-[10px] font-bold">
                  MOTOR DE IA ATIVO (TENSORRT)
                </span>
              </div>
            </div>

            {/* Tela de Vídeo Analítica com Linha Virtual Renderizada */}
            <div className="flex-1 min-h-0 relative bg-black overflow-hidden">
              <img
                src={getCameraImage(selectedCam.id)}
                alt={selectedCam.nome}
                className="w-full h-full object-cover"
              />

              {/* Linha Virtual Perimétrica (Tripwire) */}
              {iaTripwireEnabled && (
                <div className="absolute inset-0 pointer-events-none">
                  {/* Linha Laser Vetorial */}
                  <svg className="w-full h-full absolute inset-0">
                    <line
                      x1="10%"
                      y1="75%"
                      x2="90%"
                      y2="60%"
                      stroke={selectedCam.status === 'ALERTA' ? '#F43F5E' : '#00FF88'}
                      strokeWidth="2.5"
                      strokeDasharray="6 4"
                      className="animate-pulse"
                    />
                  </svg>

                  {/* Marcadores dos Sensores da Linha */}
                  <div className="absolute left-[10%] top-[75%] -translate-x-1/2 -translate-y-1/2 px-2 py-0.5 rounded bg-black/80 border border-emerald-500 font-mono text-[9px] text-emerald-300 font-bold">
                    NÓ A1 • IVA
                  </div>
                  <div className="absolute left-[90%] top-[60%] -translate-x-1/2 -translate-y-1/2 px-2 py-0.5 rounded bg-black/80 border border-emerald-500 font-mono text-[9px] text-emerald-300 font-bold">
                    NÓ A2 • IVA
                  </div>
                  <div className="absolute left-[50%] top-[67%] -translate-x-1/2 -translate-y-1/2 px-2 py-0.5 rounded bg-black/85 border border-emerald-400 font-mono text-[9px] text-emerald-400 font-bold">
                    ⚡ BARREIRA VIRTUAL ATIVA (10.000V)
                  </div>
                </div>
              )}

              {/* Bounding Box de Detecção Humana */}
              {iaHumanDetectEnabled && (
                <div className="absolute top-[28%] left-[34%] w-36 h-48 border-2 border-emerald-400 bg-emerald-500/10 rounded-lg flex flex-col justify-between p-1.5 font-mono pointer-events-none">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] bg-emerald-600 text-black font-bold px-1 rounded">
                      PEDESTRE (98.4%)
                    </span>
                    <span className="text-[8px] text-emerald-300 font-bold">ID: #892</span>
                  </div>
                  <span className="text-[8px] bg-black/70 px-1 py-0.5 rounded text-gray-300">
                    RFID: NÃO ASSOCIADO
                  </span>
                </div>
              )}

              {/* Bounding Box de Detecção de Veículo / Carreta */}
              {iaVehicleDetectEnabled && selectedCam.id === 'CAM-01' && (
                <div className="absolute top-[38%] right-[18%] w-48 h-36 border-2 border-amber-400 bg-amber-500/10 rounded-lg flex flex-col justify-between p-1.5 font-mono pointer-events-none">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] bg-amber-500 text-black font-bold px-1 rounded">
                      CARRETA PESADA (99.1%)
                    </span>
                  </div>
                  {iaLprEnabled && (
                    <span className="text-[9px] bg-emerald-950 border border-emerald-500 text-emerald-300 font-bold px-1.5 py-0.5 rounded">
                      PLACA LPR: ABC-8E90 (AUTORIZADO)
                    </span>
                  )}
                </div>
              )}

              {/* Alerta de Rompimento se status for ALERTA */}
              {selectedCam.status === 'ALERTA' && (
                <div className="absolute top-4 inset-x-4 bg-rose-950/90 border border-rose-500 p-2.5 rounded-xl font-mono flex items-center justify-between text-rose-200">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-rose-400 animate-pulse" />
                    <div>
                      <div className="font-bold text-xs">DISPARO DE LINHA VIRTUAL PERIMÉTRICA</div>
                      <div className="text-[10px] text-rose-300">Indivíduo detectado sem crachá RFID no perímetro norte.</div>
                    </div>
                  </div>
                  <button
                    onClick={() => onResolverIncidente(activeIncidente?.id || 'INC-01')}
                    className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
                  >
                    Silenciar Alarme
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Painel Lateral de Controle de Regras de IA */}
          <div className="col-span-12 lg:col-span-4 rounded-2xl bg-[#0A140F] border border-[#16291E] p-4 flex flex-col justify-between overflow-y-auto space-y-4 font-mono text-xs">
            <div className="space-y-4">
              <div className="border-b border-[#16291E] pb-2">
                <h3 className="font-bold text-white text-sm uppercase">Regras Analíticas de IA</h3>
                <p className="text-[11px] text-gray-400">Ative ou ajuste a sensibilidade dos modelos de visão computacional.</p>
              </div>

              {/* Switches de IA */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#070F0B] border border-[#16291E]">
                  <div>
                    <span className="font-bold text-white block">Linhas Virtuais Perimétricas</span>
                    <span className="text-[10px] text-gray-500">Laser IVA cruzando alambrado</span>
                  </div>
                  <button
                    onClick={() => setIaTripwireEnabled(!iaTripwireEnabled)}
                    className={`w-10 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                      iaTripwireEnabled ? 'bg-emerald-500' : 'bg-gray-700'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${iaTripwireEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#070F0B] border border-[#16291E]">
                  <div>
                    <span className="font-bold text-white block">Detecção de Pedestres</span>
                    <span className="text-[10px] text-gray-500">Silhuetas humanas e crachás RFID</span>
                  </div>
                  <button
                    onClick={() => setIaHumanDetectEnabled(!iaHumanDetectEnabled)}
                    className={`w-10 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                      iaHumanDetectEnabled ? 'bg-emerald-500' : 'bg-gray-700'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${iaHumanDetectEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#070F0B] border border-[#16291E]">
                  <div>
                    <span className="font-bold text-white block">Detecção de Veículos</span>
                    <span className="text-[10px] text-gray-500">Carretas, caminhões e empilhadeiras</span>
                  </div>
                  <button
                    onClick={() => setIaVehicleDetectEnabled(!iaVehicleDetectEnabled)}
                    className={`w-10 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                      iaVehicleDetectEnabled ? 'bg-emerald-500' : 'bg-gray-700'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${iaVehicleDetectEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#070F0B] border border-[#16291E]">
                  <div>
                    <span className="font-bold text-white block">Reconhecimento de Placas (LPR)</span>
                    <span className="text-[10px] text-gray-500">OCR automático Mercosul</span>
                  </div>
                  <button
                    onClick={() => setIaLprEnabled(!iaLprEnabled)}
                    className={`w-10 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                      iaLprEnabled ? 'bg-emerald-500' : 'bg-gray-700'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${iaLprEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>
              </div>

              {/* Slider de Sensibilidade */}
              <div className="p-3 rounded-xl bg-[#070F0B] border border-[#16291E] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">Sensibilidade da IA</span>
                  <span className="text-emerald-400 font-bold">{iaSensitivity}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="99"
                  value={iaSensitivity}
                  onChange={e => setIaSensitivity(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <span className="text-[9px] text-gray-500 block">Sensibilidade mínima de confiança para disparo automático de sirene.</span>
              </div>
            </div>

            {/* Ações de Teste */}
            <div className="pt-2 border-t border-[#16291E] space-y-2">
              <button
                onClick={onSimulateIncident}
                className="w-full py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/50 text-rose-300 font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Simular Disparo Olho de Deus</span>
              </button>
              <button
                onClick={() => onSelectFunction?.('camera-zoom')}
                className="w-full py-2 rounded-xl bg-[#070F0B] border border-[#16291E] text-gray-300 hover:text-white flex items-center justify-center gap-1.5 text-xs transition-colors"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Voltar para Foco PTZ</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* -------------------------------------------------------------------
            MODO C: FOCO PTZ & ZOOM (LAYOUT DE 3 COLUNAS - REFERÊNCIA DO USUÁRIO)
           ------------------------------------------------------------------- */
        <div className="flex-1 min-h-0 grid grid-cols-12 gap-3 sm:gap-3.5 overflow-y-auto md:overflow-hidden">
          {/* COLUNA ESQUERDA (DESKTOP): DIRETÓRIO DE SETORES & STATUS */}
          <div className="hidden md:flex md:col-span-3 lg:col-span-3 xl:col-span-2 overflow-hidden h-full">
            {renderSectorsPanel()}
          </div>

          {/* COLUNA CENTRAL: PLAYER PRINCIPAL + CARROSSEL DE MINIATURAS + CONTROLES MOBILE */}
          <div className="col-span-12 md:col-span-9 lg:col-span-6 xl:col-span-7 flex flex-col gap-2.5 sm:gap-3 min-h-0 overflow-y-auto md:overflow-hidden">
            {/* Player de Vídeo Principal com Controles Físicos */}
            <div className="min-h-[220px] xs:min-h-[260px] sm:min-h-[320px] md:min-h-0 flex-1 rounded-2xl bg-[#0A140F] border border-[#16291E] flex flex-col overflow-hidden shadow-xl shrink-0">
              {/* Barra do Player */}
              <div className="h-10 px-3.5 bg-[#070F0B]/80 border-b border-[#16291E] flex items-center justify-between shrink-0 font-mono text-xs">
                <div className="flex items-center gap-2 truncate">
                  <div className="w-5 h-5 rounded-lg bg-emerald-950/80 border border-emerald-800/60 text-emerald-400 flex items-center justify-center">
                    <Camera className="w-3 h-3" />
                  </div>
                  <span className="font-bold text-white truncate">
                    {selectedCam.setor} — {selectedCam.id}
                  </span>
                  <span className="hidden sm:inline text-[10px] text-gray-500">
                    ({selectedCam.nome})
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold flex items-center gap-1 border ${
                    selectedCam.status === 'ALERTA'
                      ? 'bg-rose-950/80 text-rose-300 border-rose-600'
                      : 'bg-emerald-950/80 text-emerald-400 border-emerald-800/60'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${selectedCam.status === 'ALERTA' ? 'bg-rose-500 animate-pulse' : 'bg-[#00FF88]'}`} />
                    <span>{selectedCam.status}</span>
                  </span>

                  {/* Ações Rápidas com Feedback Sonoro */}
                  <button
                    onClick={() => {
                      soundAndVoice.playAlertSound('beep');
                      onToggleCameraLight(selectedCam.id);
                    }}
                    className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                      selectedCam.holofoteLigado
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                        : 'bg-[#070F0B] border-[#16291E] text-gray-400 hover:text-white'
                    }`}
                    title="Holofote LED de Segurança"
                  >
                    <Lightbulb className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => {
                      soundAndVoice.playAlertSound('critical');
                      onToggleCameraSiren(selectedCam.id);
                    }}
                    className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                      selectedCam.sireneLigada
                        ? 'bg-rose-500/20 border-rose-400 text-rose-300 animate-pulse'
                        : 'bg-[#070F0B] border-[#16291E] text-gray-400 hover:text-white'
                    }`}
                    title="Sirene Perimétrica"
                  >
                    <BellRing className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onSelectFunction?.('telao-integrado')}
                    className="p-1.5 rounded-lg bg-[#070F0B] border border-[#16291E] hover:border-emerald-500/50 text-gray-300 hover:text-white transition-colors cursor-pointer"
                    title="Modo Tela Inteira / Telão"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Feed com Transformação PTZ e Filtros Reais de Foco e Íris */}
              <div
                className="flex-1 min-h-0 relative bg-black overflow-hidden group cursor-grab active:cursor-grabbing select-none"
                onMouseDown={handleFeedMouseDown}
                onMouseMove={handleFeedMouseMove}
                onMouseUp={handleFeedMouseUp}
                onMouseLeave={handleFeedMouseUp}
                onWheel={handleFeedWheel}
                onTouchStart={handleFeedTouchStart}
                onTouchMove={handleFeedTouchMove}
                onTouchEnd={handleFeedTouchEnd}
                onTouchCancel={handleFeedTouchEnd}
                title="Clique e arraste para movimentar a câmera • Roda do mouse para Zoom"
              >
                <img
                  src={getCameraImage(selectedCam.id)}
                  alt={selectedCam.nome}
                  className="w-full h-full object-cover transition-transform duration-100 pointer-events-none"
                  style={{
                    transform: `scale(${ptzZoom}) translate(${ptzPan.x}px, ${ptzPan.y}px)`,
                    transformOrigin: 'center center',
                    filter: `blur(${Math.abs(50 - ptzFocus) / 12}px) brightness(${0.4 + (ptzIris / 100) * 0.9})`
                  }}
                />

                {/* Badge OSD de Ação PTZ em Tempo Real */}
                {ptzActionFeedback && (
                  <div className="absolute top-12 left-1/2 -translate-x-1/2 z-20 bg-black/85 border border-emerald-500/60 text-emerald-300 font-mono text-[11px] font-bold px-3 py-1 rounded-full shadow-lg pointer-events-none flex items-center gap-1.5 animate-fadeIn">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00FF88] animate-pulse" />
                    <span>{ptzActionFeedback}</span>
                  </div>
                )}

                {/* Efeito Iluminação do Holofote LED */}
                {selectedCam.holofoteLigado && (
                  <div className="absolute inset-0 bg-amber-400/15 pointer-events-none shadow-[inset_0_0_80px_rgba(251,191,36,0.35)]" />
                )}

                {/* Borda Pulsante de Sirene Ativa */}
                {selectedCam.sireneLigada && (
                  <div className="absolute inset-0 border-4 border-rose-500 animate-pulse pointer-events-none flex items-center justify-center">
                    <span className="px-3 py-1 rounded-lg bg-rose-600/90 text-white font-mono text-xs font-bold tracking-widest shadow-xl">
                      SIRENE EMITINDO ALARME SONORO
                    </span>
                  </div>
                )}

                {/* Retículo / Crosshair Central de Mira PTZ - Fixo no centro óptico da câmera */}
                <div
                  className="absolute pointer-events-none transition-opacity duration-150"
                  style={{
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  <Crosshair className="w-8 h-8 text-emerald-400/50 opacity-80" />
                </div>

                {/* Relógio Digital no Canto Superior Direito */}
                <div className="absolute top-3 right-3 bg-black/85 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-white/10 font-mono text-[11px] text-gray-200 pointer-events-none">
                  {currentTime.split(' ').slice(-1)[0] || '14:32:17'}
                </div>

                {/* Informações de OSD no Canto Superior Esquerdo */}
                <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-white/10 font-mono text-[10px] text-gray-300 flex items-center gap-2 pointer-events-none">
                  <span className="text-emerald-400 font-bold">{selectedCam.resolucao}</span>
                  <span>•</span>
                  <span>{selectedCam.fps} FPS</span>
                  <span>•</span>
                  <span>IP: {selectedCam.ip}</span>
                </div>

                {/* Bounding box se status for ALERTA */}
                {selectedCam.status === 'ALERTA' && (
                  <div className="absolute top-1/4 left-1/3 w-40 h-48 border-2 border-rose-500 bg-rose-500/10 rounded-lg animate-pulse flex flex-col justify-between p-1.5 pointer-events-none font-mono">
                    <span className="text-[9px] bg-rose-600 text-white font-bold px-1 rounded w-fit">
                      INTRUSO DETECTADO (98%)
                    </span>
                    <span className="text-[8px] text-rose-300">
                      LINHA VIRTUAL VIOLADA
                    </span>
                  </div>
                )}

                {/* Controles Flutuantes no Canto Inferior Direito do Vídeo */}
                <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-black/80 backdrop-blur-xs p-1.5 rounded-xl border border-white/10 opacity-80 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-gray-300 hover:text-white cursor-pointer"
                    title={isMuted ? 'Ativar Áudio da Câmera' : 'Silenciar Áudio'}
                  >
                    {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
                  </button>
                  <button
                    onClick={() => handlePtzZoomChange(0.5)}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-gray-300 hover:text-white text-xs font-mono font-bold cursor-pointer"
                    title="Zoom Digital"
                  >
                    {ptzZoom}x
                  </button>
                </div>
              </div>
            </div>

            {/* Carrossel de Miniaturas */}
            <div className="h-28 rounded-2xl bg-[#0A140F] border border-[#16291E] p-2 flex items-center gap-2.5 overflow-x-auto shrink-0 shadow-sm scrollbar-thin">
              {filteredCameras.map(cam => {
                const isSelected = cam.id === selectedCam.id;

                return (
                  <div
                    key={cam.id}
                    onClick={() => {
                      soundAndVoice.playAlertSound('beep');
                      onSelectCamera(cam.id);
                    }}
                    className={`relative h-full w-36 shrink-0 rounded-xl overflow-hidden cursor-pointer border transition-all duration-150 group ${
                      isSelected
                        ? 'border-2 border-[#10B981] shadow-[0_0_15px_rgba(16,185,129,0.4)] scale-102'
                        : 'border-[#16291E] hover:border-emerald-500/50 opacity-75 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={getCameraImage(cam.id)}
                      alt={cam.nome}
                      className="w-full h-full object-cover"
                    />

                    {/* Overlay com Nome e Setor */}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/70 to-transparent p-1.5 font-mono text-left">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-white truncate">
                          {cam.id}
                        </span>
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cam.status === 'ALERTA' ? 'bg-rose-500 animate-pulse' : 'bg-[#00FF88]'}`} />
                      </div>
                      <span className="text-[8px] text-gray-400 block truncate">
                        {cam.setor}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Botão Adicionar Câmera no Carrossel */}
              <div
                onClick={() => {
                  soundAndVoice.playAlertSound('beep');
                  setShowAddModal(true);
                }}
                className="h-full w-28 shrink-0 rounded-xl border border-dashed border-[#16291E] hover:border-emerald-500/60 bg-[#070F0B] flex flex-col items-center justify-center p-2 text-center text-gray-500 hover:text-emerald-400 cursor-pointer transition-colors"
              >
                <Plus className="w-5 h-5 mb-1" />
                <span className="text-[10px] font-mono font-bold leading-tight">
                  Nova Câmera
                </span>
              </div>
            </div>
            {/* CONTROLES EXCLUSIVOS MOBILE (TABS & PAINEL ATIVO) */}
            <div className="flex md:hidden flex-col gap-2.5 shrink-0 pt-1 pb-4">
              {/* Barra Segmentada de Seleção de Painel */}
              <div className="flex items-center justify-between bg-[#070F0B] p-1 rounded-xl border border-[#16291E] shrink-0 text-xs font-mono">
                <button
                  type="button"
                  onClick={() => {
                    soundAndVoice.playAlertSound('beep');
                    setMobileZoomTab('PTZ');
                  }}
                  className={`flex-1 py-1.5 px-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    mobileZoomTab === 'PTZ'
                      ? 'bg-emerald-500 text-black shadow-sm'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>PTZ D-Pad</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    soundAndVoice.playAlertSound('beep');
                    setMobileZoomTab('SETORES');
                  }}
                  className={`flex-1 py-1.5 px-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    mobileZoomTab === 'SETORES'
                      ? 'bg-emerald-500 text-black shadow-sm'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Câmeras</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    soundAndVoice.playAlertSound('beep');
                    setMobileZoomTab('GRAVACOES');
                  }}
                  className={`flex-1 py-1.5 px-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    mobileZoomTab === 'GRAVACOES'
                      ? 'bg-emerald-500 text-black shadow-sm'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Film className="w-3.5 h-3.5" />
                  <span>DVR Clipe</span>
                </button>
              </div>

              {/* Conteúdo do Painel Ativo no Celular */}
              <div className="w-full">
                {mobileZoomTab === 'PTZ' && renderPtzConsolePanel()}
                {mobileZoomTab === 'SETORES' && renderSectorsPanel()}
                {mobileZoomTab === 'GRAVACOES' && renderRecordingsPanel()}
              </div>
            </div>
          </div>

          {/* COLUNA DIREITA (DESKTOP): CONSOLE PTZ COMPLETO + GRAVAÇÕES */}
          <div className="hidden md:flex md:col-span-12 lg:col-span-3 xl:col-span-3 flex-col gap-3.5 min-h-0 overflow-y-auto">
            {renderPtzConsolePanel()}
            {renderRecordingsPanel()}
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: ALOCAR NOVA CÂMERA (SUPORTE API RTSP/IP)
         ===================================================================== */}
      {showAddModal && (
        <div
          onClick={() => setShowAddModal(false)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="w-full max-w-lg bg-[#070F0B] border border-[#16291E] rounded-2xl p-5 shadow-2xl font-mono text-slate-100 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[#16291E] pb-3">
              <div className="flex items-center gap-2 text-emerald-400">
                <Plus className="w-5 h-5" />
                <h3 className="font-bold text-sm tracking-wider text-white uppercase">
                  Alocar Nova Câmera no Sistema
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-[#0E1A14]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCameraSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-400 mb-1 text-[11px]">NOME DA CÂMERA:</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Câmera Doca 04 - Logística"
                  value={newCamForm.nome}
                  onChange={e => setNewCamForm({ ...newCamForm, nome: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#0A140F] border border-[#16291E] text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 mb-1 text-[11px]">SETOR DE INSTALAÇÃO:</label>
                  <select
                    value={newCamForm.setor}
                    onChange={e => setNewCamForm({ ...newCamForm, setor: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#0A140F] border border-[#16291E] text-white outline-none focus:border-emerald-500"
                  >
                    <option value="Portaria & Acessos">Portaria & Acessos</option>
                    <option value="Sede Administrativa">Sede Administrativa</option>
                    <option value="Carga e Logística">Carga e Logística</option>
                    <option value="Produção & Fundição">Produção & Fundição</option>
                    <option value="Perímetro & Cerca">Perímetro & Cerca</option>
                    <option value="Estoque & Cofre">Estoque & Cofre</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-400 mb-1 text-[11px]">ENDEREÇO IP:</label>
                  <input
                    type="text"
                    required
                    value={newCamForm.ip}
                    onChange={e => setNewCamForm({ ...newCamForm, ip: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#0A140F] border border-[#16291E] text-white outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-400 mb-1 text-[11px]">STREAM RTSP / ONVIF:</label>
                <input
                  type="text"
                  required
                  value={newCamForm.rtspUrl}
                  onChange={e => setNewCamForm({ ...newCamForm, rtspUrl: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#0A140F] border border-[#16291E] text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 mb-1 text-[11px]">RESOLUÇÃO:</label>
                  <select
                    value={newCamForm.resolucao}
                    onChange={e => setNewCamForm({ ...newCamForm, resolucao: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#0A140F] border border-[#16291E] text-white outline-none focus:border-emerald-500"
                  >
                    <option value="4K DarkFighter">4K DarkFighter (3840x2160)</option>
                    <option value="1080p Starlight">1080p Starlight (1920x1080)</option>
                    <option value="4K Termográfica">4K Termográfica FLIR</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-400 mb-1 text-[11px]">TAXA DE QUADROS (FPS):</label>
                  <select
                    value={newCamForm.fps}
                    onChange={e => setNewCamForm({ ...newCamForm, fps: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-[#0A140F] border border-[#16291E] text-white outline-none focus:border-emerald-500"
                  >
                    <option value={30}>30 FPS</option>
                    <option value={60}>60 FPS</option>
                  </select>
                </div>
              </div>

              {/* Módulos de IA */}
              <div className="p-3 rounded-xl bg-[#0A140F] border border-[#16291E] space-y-2">
                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">
                  Analíticos de IA Ativos
                </span>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <label className="flex items-center gap-2 text-gray-300">
                    <input
                      type="checkbox"
                      checked={newCamForm.linhaVirtual}
                      onChange={e => setNewCamForm({ ...newCamForm, linhaVirtual: e.target.checked })}
                      className="accent-emerald-500 rounded"
                    />
                    <span>Linha Virtual</span>
                  </label>
                  <label className="flex items-center gap-2 text-gray-300">
                    <input
                      type="checkbox"
                      checked={newCamForm.deteccaoHumanos}
                      onChange={e => setNewCamForm({ ...newCamForm, deteccaoHumanos: e.target.checked })}
                      className="accent-emerald-500 rounded"
                    />
                    <span>Detecção Humana</span>
                  </label>
                  <label className="flex items-center gap-2 text-gray-300">
                    <input
                      type="checkbox"
                      checked={newCamForm.deteccaoVeiculos}
                      onChange={e => setNewCamForm({ ...newCamForm, deteccaoVeiculos: e.target.checked })}
                      className="accent-emerald-500 rounded"
                    />
                    <span>Detecção Veicular</span>
                  </label>
                  <label className="flex items-center gap-2 text-gray-300">
                    <input
                      type="checkbox"
                      checked={newCamForm.lpr}
                      onChange={e => setNewCamForm({ ...newCamForm, lpr: e.target.checked })}
                      className="accent-emerald-500 rounded"
                    />
                    <span>Leitura de Placa LPR</span>
                  </label>
                </div>
              </div>

              <div className="pt-3 border-t border-[#16291E] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#0A140F] border border-[#16291E] text-gray-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#070F0B] font-bold shadow-[0_0_12px_rgba(16,185,129,0.3)] flex items-center gap-2"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Cadastrar e Alocar Câmera</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: CONFIGURAÇÕES DA API REST & NVR
         ===================================================================== */}
      {showApiModal && (
        <div
          onClick={() => setShowApiModal(false)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="w-full max-w-lg bg-[#070F0B] border border-[#16291E] rounded-2xl p-5 shadow-2xl font-mono text-slate-100 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[#16291E] pb-3">
              <div className="flex items-center gap-2 text-emerald-400">
                <Server className="w-5 h-5" />
                <h3 className="font-bold text-sm tracking-wider text-white uppercase">
                  Parâmetros de Integração API & NVR
                </h3>
              </div>
              <button
                onClick={() => setShowApiModal(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-[#0E1A14]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-400 mb-1 text-[11px]">URL BASE REST API:</label>
                <input
                  type="text"
                  value={apiConfig.baseUrl}
                  onChange={e => setApiConfig({ ...apiConfig, baseUrl: e.target.value })}
                  placeholder="http://192.168.10.100:8000/api/v1"
                  className="w-full px-3 py-2 rounded-xl bg-[#0A140F] border border-[#16291E] text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 mb-1 text-[11px]">NVR HOST / IP:</label>
                  <input
                    type="text"
                    value={apiConfig.nvrHost || ''}
                    onChange={e => setApiConfig({ ...apiConfig, nvrHost: e.target.value })}
                    placeholder="192.168.10.200"
                    className="w-full px-3 py-2 rounded-xl bg-[#0A140F] border border-[#16291E] text-white outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1 text-[11px]">PORTA RTSP / ONVIF:</label>
                  <input
                    type="number"
                    value={apiConfig.nvrPort || 554}
                    onChange={e => setApiConfig({ ...apiConfig, nvrPort: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-[#0A140F] border border-[#16291E] text-white outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-400 mb-1 text-[11px]">TOKEN BEARER / CHAVE DE ACESSO:</label>
                <input
                  type="password"
                  value={apiConfig.authToken || ''}
                  onChange={e => setApiConfig({ ...apiConfig, authToken: e.target.value })}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full px-3 py-2 rounded-xl bg-[#0A140F] border border-[#16291E] text-white outline-none focus:border-emerald-500"
                />
              </div>

              {apiTestResult && (
                <div className="p-3 rounded-xl bg-[#0A140F] border border-emerald-900/60 text-emerald-400 text-[11px]">
                  {apiTestResult}
                </div>
              )}

              <div className="pt-3 border-t border-[#16291E] flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleTestApi}
                  className="px-3.5 py-2 rounded-xl bg-[#0E1A14] hover:bg-[#16291E] border border-emerald-800/40 text-emerald-300 font-bold"
                >
                  Testar Ping / Latência
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowApiModal(false)}
                    className="px-4 py-2 rounded-xl bg-[#0A140F] border border-[#16291E] text-gray-400 hover:text-white"
                  >
                    Fechar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      copperGuardApi.saveConfig(apiConfig);
                      setShowApiModal(false);
                      soundAndVoice.playAlertSound('beep');
                      soundAndVoice.speakAlert('Configurações da API salvas com sucesso.', voiceEnabled);
                    }}
                    className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#070F0B] font-bold shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                  >
                    Salvar Parâmetros
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
