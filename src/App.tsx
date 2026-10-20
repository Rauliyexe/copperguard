import React, { useState, useEffect, useCallback } from 'react';
import { MinimalCockpit } from './components/MinimalCockpit';
import { CopperGuardHubScreen } from './components/CopperGuardHubScreen';
import { CopperGuardERPLayout } from './components/CopperGuardERPLayout';
import { AccessControlScreen } from './components/AccessControlScreen';
import { CameraAnalyticsScreen } from './components/CameraAnalyticsScreen';
import { CustomModularDashboard } from './components/CustomModularDashboard';
import { GatesControlScreen } from './components/GatesControlScreen';

import { 
  PontoRisco, 
  IncidenteSeguranca, 
  RegistroAcesso, 
  FuncionarioProdutividade, 
  MaquinaOEE, 
  VeiculoTelemetria, 
  CameraStream,
  AccessibilityConfig,
  PortaoSeguranca,
  LogAcionamentoPortao,
  PlantSpatialFocus,
  SECTOR_FOCUS_PRESETS
} from './types';

import { 
  mockCameras, 
  mockPontosRisco, 
  mockIncidentes, 
  mockAcessos, 
  mockFuncionarios, 
  mockMaquinas, 
  mockVeiculos,
  mockPortoes,
  mockLogsPortoes
} from './mockData';

import { soundAndVoice } from './utils/soundAndVoice';

export function App() {
  const [cameras, setCameras] = useState<CameraStream[]>(mockCameras);
  const [pontos, setPontos] = useState<PontoRisco[]>(mockPontosRisco);
  const [incidentes, setIncidentes] = useState<IncidenteSeguranca[]>(mockIncidentes);
  const [acessos] = useState<RegistroAcesso[]>(mockAcessos);
  const [funcionarios] = useState<FuncionarioProdutividade[]>(mockFuncionarios);
  const [maquinas, setMaquinas] = useState<MaquinaOEE[]>(mockMaquinas);
  const [veiculos, setVeiculos] = useState<VeiculoTelemetria[]>(mockVeiculos);
  const [portoes, setPortoes] = useState<PortaoSeguranca[]>(mockPortoes);
  const [logsPortoes, setLogsPortoes] = useState<LogAcionamentoPortao[]>(mockLogsPortoes);

  // Navegação Principal da Plataforma: Tela de Módulos (Hub) vs. ERP Layout com Módulo Ativo
  const [currentAppScreen, setCurrentAppScreen] = useState<'HUB_MODULES' | 'ERP_WORKSPACE'>('HUB_MODULES');
  const [activeModuleId, setActiveModuleId] = useState<string>('maquete-3d');
  const [activeFunctionId, setActiveFunctionId] = useState<string>('gemeo-3d');

  // Câmera CFTV selecionada / em foco (compartilhada e alternável em todos os módulos)
  const [selectedCamId, setSelectedCamId] = useState<string>('CAM-05');

  // Foco Espacial Sincronizado entre Maquete 3D e Planta 2D CAD (Item 5)
  const [spatialFocus, setSpatialFocus] = useState<PlantSpatialFocus>({
    sectorId: 'COMPLEXO_COMPLETO',
    label: SECTOR_FOCUS_PRESETS.COMPLEXO_COMPLETO.label,
    threeTarget: SECTOR_FOCUS_PRESETS.COMPLEXO_COMPLETO.threeTarget,
    twoTarget: SECTOR_FOCUS_PRESETS.COMPLEXO_COMPLETO.twoTarget,
    lastUpdatedBy: '3D',
    timestamp: Date.now()
  });

  // Atualiza foco ao selecionar uma câmera
  const handleSelectCamera = useCallback((camId: string) => {
    setSelectedCamId(camId);
    let sectorKey: keyof typeof SECTOR_FOCUS_PRESETS = 'COMPLEXO_COMPLETO';
    if (camId === 'CAM-01') sectorKey = 'PORTAO_250';
    else if (camId === 'CAM-02') sectorKey = 'SEDE_ADMIN';
    else if (camId === 'CAM-03') sectorKey = 'PATIO_CARRETAS';
    else if (camId === 'CAM-04') sectorKey = 'GALPOES_GEMINADOS';
    else if (camId === 'CAM-05') sectorKey = 'ALAMBRADO_NORTE';
    else if (camId === 'CAM-06') sectorKey = 'GALPAO_ARCO';

    const preset = SECTOR_FOCUS_PRESETS[sectorKey];
    if (preset) {
      setSpatialFocus({
        sectorId: sectorKey,
        label: preset.label,
        threeTarget: preset.threeTarget,
        twoTarget: preset.twoTarget,
        lastUpdatedBy: 'CAMERA',
        timestamp: Date.now()
      });
    }
  }, []);

  const [a11y, setA11y] = useState<AccessibilityConfig>({
    voiceAlertsEnabled: true,
    soundSirenEnabled: true,
    highContrastMode: false,
    colorblindMode: false,
    largeFontMode: false,
    autoCycleTvMode: false,
    liveTelemetryRunning: true,
  });

  // Simulação de Intrusão Perimetral ao Vivo ("Olho de Deus")
  const handleSimulateIncident = useCallback(() => {
    const timestamp = new Date().toLocaleTimeString('pt-BR');
    const novoIncidente: IncidenteSeguranca = {
      id: `INC-2026-${Math.floor(100 + Math.random() * 900)}`,
      timestamp,
      pontoRiscoId: 'RISK-01',
      pontoRiscoNome: 'Perímetro Muro Norte (Zona Rodovia)',
      tipo: 'Disparo de Cerca Elétrica + Linha Virtual IA',
      nivel: 'CRITICO',
      status: 'EM_ABERTO',
      snapshotUrl: '/cameras/cam-perimetro.png',
      descricao: `Alarme acionado às ${timestamp}: Invasão detectada no Muro Norte sem crachá RFID.`,
      acaoTomada: 'Sirene perimétrica e holofote acionados.',
    };

    setIncidentes(prev => [novoIncidente, ...prev]);

    setPontos(prev => prev.map(p => {
      if (p.id === 'RISK-01') {
        return {
          ...p,
          status: 'VIOLADO',
          ultimoDisparo: `Acabou de disparar (${timestamp})`,
          historicoAlertasHoje: p.historicoAlertasHoje + 1,
        };
      }
      return p;
    }));

    setCameras(prev => prev.map(c => {
      if (c.id === 'CAM-05') {
        return { 
          ...c, 
          status: 'ALERTA', 
          holofoteLigado: true,
          sireneLigada: true,
          eventosUltimaHora: c.eventosUltimaHora + 1 
        };
      }
      return c;
    }));

    if (a11y.soundSirenEnabled) {
      soundAndVoice.playAlertSound('critical');
    }
    soundAndVoice.speakAlert(
      'Alerta Olho de Deus! Violação detectada no Perímetro Muro Norte. Indivíduo sem crachá identificado. Sirene ativada.',
      a11y.voiceAlertsEnabled
    );
  }, [a11y.soundSirenEnabled, a11y.voiceAlertsEnabled]);

  // Resolver / Silenciar Incidente
  const handleResolverIncidente = useCallback((id: string) => {
    setIncidentes(prev => prev.map(i => i.id === id ? { ...i, status: 'RESOLVIDO' } : i));
    setPontos(prev => prev.map(p => p.id === 'RISK-01' ? { ...p, status: 'ARMADO' } : p));
    setCameras(prev => prev.map(c => c.id === 'CAM-05' ? { ...c, status: 'ONLINE', sireneLigada: false } : c));

    soundAndVoice.playAlertSound('beep');
    soundAndVoice.speakAlert('Alarme perimetral reconhecido e silenciado.', a11y.voiceAlertsEnabled);
  }, [a11y.voiceAlertsEnabled]);

  // Alternar Abertura / Travamento Remoto de Portão, Cancela ou Eclusa com Log de Auditoria
  const handleTogglePortao = useCallback((portaoId: string) => {
    const horario = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setPortoes(prev => prev.map(p => {
      if (p.id !== portaoId) return p;
      const abrindo = p.status !== 'ABERTO';
      const novoStatus: PortaoSeguranca['status'] = abrindo ? 'ABERTO' : 'FECHADO_TRAVADO';

      const novoLog: LogAcionamentoPortao = {
        id: `LOG-GATE-${Date.now()}`,
        horario,
        portaoId: p.id,
        portaoNome: p.nome,
        acao: abrindo ? 'ABERTURA_REMOTA' : 'FECHAMENTO_TRAVA',
        operador: 'Operador CCO (Terminal 01)',
        detalhe: abrindo ? 'Liberação remota via painel tático' : 'Travamento eletromagnético remoto'
      };
      setLogsPortoes(logs => [novoLog, ...logs]);

      soundAndVoice.playAlertSound('beep');
      soundAndVoice.speakAlert(
        `${p.nome} ${abrindo ? 'destravado e aberto remotamente' : 'fechado e trancado'}.`,
        a11y.voiceAlertsEnabled
      );

      return {
        ...p,
        status: novoStatus,
        travaEletromagnetica: !abrindo,
        ultimoAcionamento: `${horario} (${abrindo ? 'Abertura CCO' : 'Trava CCO'})`,
        operadorResponsavel: 'Operador CCO #01'
      };
    }));
  }, [a11y.voiceAlertsEnabled]);

  // Travamento Geral de Emergência (Lockdown de Todos os Portões e Eclusas)
  const handleLockAllPortoes = useCallback(() => {
    const horario = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setPortoes(prev => prev.map(p => ({
      ...p,
      status: 'FECHADO_TRAVADO',
      travaEletromagnetica: true,
      ultimoAcionamento: `${horario} (LOCKDOWN EMERGÊNCIA)`,
      operadorResponsavel: 'Protocolo Lockdown CCO'
    })));

    const novoLog: LogAcionamentoPortao = {
      id: `LOG-GATE-LOCKDOWN-${Date.now()}`,
      horario,
      portaoId: 'ALL',
      portaoNome: 'TODOS OS PORTÕES & ECLUSAS',
      acao: 'BLOQUEIO_EMERGENCIA',
      operador: 'Comando Central CCO',
      detalhe: 'Acionamento de Lockdown Geral Perimetral'
    };
    setLogsPortoes(logs => [novoLog, ...logs]);

    soundAndVoice.playAlertSound('warning');
    soundAndVoice.speakAlert(
      'Protocolo de Lockdown ativado. Todos os portões, cancelas e eclusas dos dois blocos foram trancados.',
      a11y.voiceAlertsEnabled
    );
  }, [a11y.voiceAlertsEnabled]);

  const handleToggleCameraLight = (camId: string) => {
    setCameras(prev => prev.map(c => c.id === camId ? { ...c, holofoteLigado: !c.holofoteLigado } : c));
  };

  const handleToggleCameraSiren = (camId: string) => {
    setCameras(prev => prev.map(c => c.id === camId ? { ...c, sireneLigada: !c.sireneLigada } : c));
  };

  const handleAddCameraAt = (x: number, y: number) => {
    const newId = `CAM-0${cameras.length + 1}`;
    const novaCam: CameraStream = {
      id: newId,
      nome: `Câmera Tática Perimetral (${x}%, ${y}%)`,
      setor: 'Perímetro Customizado',
      ip: `192.168.10.1${30 + cameras.length}`,
      resolucao: '4K DarkFighter',
      fps: 30,
      status: 'ONLINE',
      analiticoIA: {
        linhaVirtualAtiva: true,
        deteccaoHumanos: true,
        deteccaoVeiculos: true,
        leituraPlacaLPR: false,
      },
      eventosUltimaHora: 0,
      coords: { x, y }
    };
    setCameras(prev => [...prev, novaCam]);
  };

  const handleAddNewCamera = useCallback((newCam: CameraStream) => {
    setCameras(prev => {
      if (prev.some(c => c.id === newCam.id)) {
        return prev.map(c => c.id === newCam.id ? newCam : c);
      }
      return [...prev, newCam];
    });
    setSelectedCamId(newCam.id);
  }, []);

  // Motor de Telemetria Viva (Move empilhadeiras e atualiza temperatura dos fornos)
  useEffect(() => {
    if (!a11y.liveTelemetryRunning) return;
    const interval = setInterval(() => {
      setMaquinas(prev => prev.map(m => {
        if (!m.temperaturaAtualC) return m;
        const delta = Math.floor(Math.random() * 5) - 2;
        return { ...m, temperaturaAtualC: Math.max(1130, Math.min(1160, m.temperaturaAtualC + delta)) };
      }));

      setVeiculos(prev => prev.map(v => {
        if (v.status !== 'EM_MOVIMENTO') return v;
        const dx = (Math.random() - 0.5) * 1.8;
        const dy = (Math.random() - 0.5) * 1.8;
        return {
          ...v,
          coords: {
            x: Math.max(16, Math.min(48, v.coords.x + dx)),
            y: Math.max(24, Math.min(82, v.coords.y + dy))
          }
        };
      }));
    }, 2200);
    return () => clearInterval(interval);
  }, [a11y.liveTelemetryRunning]);

  // Atalhos rápidos de teclado globais
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key.toLowerCase() === 't') {
        setActiveModuleId('cftv-dvr');
        setActiveFunctionId('telao-integrado');
        setCurrentAppScreen('ERP_WORKSPACE');
        soundAndVoice.playAlertSound('beep');
      } else if (e.key.toLowerCase() === 'i') {
        handleSimulateIncident();
      } else if (e.key === ' ') {
        const openInc = incidentes.find(inc => inc.status === 'EM_ABERTO');
        if (openInc) {
          e.preventDefault();
          handleResolverIncidente(openInc.id);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSimulateIncident, handleResolverIncidente, incidentes]);

  const openIncident = incidentes.find(i => i.status === 'EM_ABERTO');

  if (currentAppScreen === 'HUB_MODULES') {
    return (
      <CopperGuardHubScreen
        onEnterModule={(modId) => {
          setActiveModuleId(modId);
          if (modId === 'cftv-dvr') {
            setActiveFunctionId('camera-zoom');
          } else if (modId === 'maquete-3d') {
            setActiveFunctionId('gemeo-3d');
          } else if (modId === 'planta-2d') {
            setActiveFunctionId('cad-tatico');
          } else if (modId === 'portoes-eclusas') {
            setActiveFunctionId('todos-portoes');
          } else if (modId === 'portaria-facial') {
            setActiveFunctionId('catracas-ao-vivo');
          } else if (modId === 'cockpit-modular') {
            setActiveFunctionId('painel-ativo');
          } else {
            setActiveFunctionId('');
          }
          setCurrentAppScreen('ERP_WORKSPACE');
        }}
      />
    );
  }

  const handleSelectFunction = (fnId: string) => {
    setActiveFunctionId(fnId);
  };

  return (
    <CopperGuardERPLayout
      currentModuleId={activeModuleId}
      activeFunctionId={activeFunctionId}
      onSelectFunction={handleSelectFunction}
      onBackToHub={() => setCurrentAppScreen('HUB_MODULES')}
      voiceEnabled={a11y.voiceAlertsEnabled}
      onToggleVoice={() => setA11y(prev => ({ ...prev, voiceAlertsEnabled: !prev.voiceAlertsEnabled }))}
      hasActiveIncident={!!openIncident}
      onResolveIncident={openIncident ? () => handleResolverIncidente(openIncident.id) : undefined}
    >
      {/* MÓDULO 1: PORTARIA & BIOMETRIA FACIAL */}
      {activeModuleId === 'portaria-facial' ? (
        <AccessControlScreen
          funcionarios={funcionarios}
          acessos={acessos}
          voiceEnabled={a11y.voiceAlertsEnabled}
          activeFunctionId={activeFunctionId}
          onSelectFunction={handleSelectFunction}
        />
      ) : activeModuleId === 'cftv-dvr' ? (
        /* MÓDULO 2: CENTRAL DE CÂMERAS & CFTV */
        <CameraAnalyticsScreen
          cameras={cameras}
          incidentes={incidentes}
          selectedCamId={selectedCamId}
          onSelectCamera={handleSelectCamera}
          onToggleCameraLight={handleToggleCameraLight}
          onToggleCameraSiren={handleToggleCameraSiren}
          onSimulateIncident={handleSimulateIncident}
          onResolverIncidente={handleResolverIncidente}
          onAddCamera={handleAddNewCamera}
          voiceEnabled={a11y.voiceAlertsEnabled}
          activeFunctionId={activeFunctionId}
          onSelectFunction={handleSelectFunction}
        />
      ) : activeModuleId === 'portoes-eclusas' ? (
        /* MÓDULO 3: CONTROLE REMOTO DE PORTÕES, CANCELAS & ECLUSAS */
        <GatesControlScreen
          portoes={portoes}
          logsPortoes={logsPortoes}
          cameras={cameras}
          onTogglePortao={handleTogglePortao}
          onLockAllPortoes={handleLockAllPortoes}
          onToggleCameraLight={handleToggleCameraLight}
          onToggleCameraSiren={handleToggleCameraSiren}
          voiceEnabled={a11y.voiceAlertsEnabled}
        />
      ) : activeModuleId === 'cockpit-modular' ? (
        /* MÓDULO PERSONALIZÁVEL: COCKPIT MODULAR */
        <CustomModularDashboard
          cameras={cameras}
          incidentes={incidentes}
          portoes={portoes}
          acessos={acessos}
          funcionarios={funcionarios}
          maquinas={maquinas}
          veiculos={veiculos}
          pontos={pontos}
          onToggleCameraLight={handleToggleCameraLight}
          onToggleCameraSiren={handleToggleCameraSiren}
          onTogglePortao={handleTogglePortao}
          onResolverIncidente={handleResolverIncidente}
          onSimulateIncident={handleSimulateIncident}
          voiceEnabled={a11y.voiceAlertsEnabled}
        />
      ) : activeModuleId === 'planta-2d' ? (
        /* MÓDULO 4: PLANTA 2D CAD VETORIAL */
        <MinimalCockpit
          key="planta-2d"
          pontos={pontos}
          incidentes={incidentes}
          cameras={cameras}
          funcionarios={funcionarios}
          maquinas={maquinas}
          veiculos={veiculos}
          acessos={acessos}
          portoes={portoes}
          a11y={a11y}
          setA11y={setA11y}
          onSimulateIncident={handleSimulateIncident}
          onResolverIncidente={handleResolverIncidente}
          onTogglePortao={handleTogglePortao}
          onToggleCameraLight={handleToggleCameraLight}
          onToggleCameraSiren={handleToggleCameraSiren}
          onAddCameraAt={handleAddCameraAt}
          initialViewMode="2D_CAD"
          hideFloatingHeader={true}
          focusedCamId={selectedCamId}
          onSelectCamera={handleSelectCamera}
          spatialFocus={spatialFocus}
          onUpdateSpatialFocus={setSpatialFocus}
        />
      ) : (
        /* MÓDULO 5 (PADRÃO): MAQUETE 3D INTERATIVA */
        <MinimalCockpit
          key="maquete-3d"
          pontos={pontos}
          incidentes={incidentes}
          cameras={cameras}
          funcionarios={funcionarios}
          maquinas={maquinas}
          veiculos={veiculos}
          acessos={acessos}
          portoes={portoes}
          a11y={a11y}
          setA11y={setA11y}
          onSimulateIncident={handleSimulateIncident}
          onResolverIncidente={handleResolverIncidente}
          onTogglePortao={handleTogglePortao}
          onToggleCameraLight={handleToggleCameraLight}
          onToggleCameraSiren={handleToggleCameraSiren}
          onAddCameraAt={handleAddCameraAt}
          initialViewMode="3D_WEBGL"
          hideFloatingHeader={true}
          focusedCamId={selectedCamId}
          onSelectCamera={handleSelectCamera}
          spatialFocus={spatialFocus}
          onUpdateSpatialFocus={setSpatialFocus}
        />
      )}
    </CopperGuardERPLayout>
  );
}

export default App;
