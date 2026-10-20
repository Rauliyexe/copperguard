import React, { useState } from 'react';
import {
  PortaoSeguranca,
  LogAcionamentoPortao,
  CameraStream
} from '../types';
import {
  Lock,
  Unlock,
  ShieldAlert,
  ShieldCheck,
  Camera,
  Lightbulb,
  BellRing,
  Clock,
  CheckCircle2,
  KeyRound,
  Radio
} from 'lucide-react';
import { soundAndVoice } from '../utils/soundAndVoice';

interface GatesControlScreenProps {
  portoes: PortaoSeguranca[];
  logsPortoes: LogAcionamentoPortao[];
  cameras: CameraStream[];
  onTogglePortao: (portaoId: string) => void;
  onLockAllPortoes: () => void;
  onToggleCameraLight: (camId: string) => void;
  onToggleCameraSiren: (camId: string) => void;
  voiceEnabled: boolean;
}

export const GatesControlScreen: React.FC<GatesControlScreenProps> = ({
  portoes,
  logsPortoes,
  cameras,
  onTogglePortao,
  onLockAllPortoes,
  onToggleCameraLight,
  onToggleCameraSiren,
  voiceEnabled
}) => {
  const [selectedGateId, setSelectedGateId] = useState<string>(portoes[0]?.id || 'GATE-01');
  const [filterQuadra, setFilterQuadra] = useState<'TODAS' | 'LESTE' | 'OESTE'>('TODAS');

  const selectedGate = portoes.find(p => p.id === selectedGateId) || portoes[0];
  const linkedCamera = cameras.find(c => c.id === selectedGate?.cameraId) || cameras[0];

  const getCameraImage = (camId: string) => {
    if (camId === 'CAM-01' || camId === 'CAM-02') return '/cameras/cam-balanca.png';
    if (camId === 'CAM-04') return '/cameras/cam-forno.png';
    return '/cameras/cam-perimetro.png';
  };

  const filteredGates = portoes.filter(p => {
    if (filterQuadra === 'LESTE') return p.quadra.includes('Quadra Leste');
    if (filterQuadra === 'OESTE') return p.quadra.includes('Quadra Oeste');
    return true;
  });

  const totalAbertos = portoes.filter(p => p.status === 'ABERTO').length;
  const totalTravados = portoes.filter(p => p.status !== 'ABERTO').length;

  return (
    <div className="w-full h-full bg-[#040A07] p-4 flex flex-col justify-between overflow-hidden select-none">
      {/* =====================================================================
          BARRA SUPERIOR: CONTROLE CENTRAL DE PORTÕES, CANCELAS & ECLUSAS
         ===================================================================== */}
      <div className="flex items-center justify-between flex-wrap gap-3 bg-night-950/90 border border-night-800 rounded-2xl px-4 py-2.5 shadow-xl shrink-0">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <KeyRound className="w-4 h-4 text-sky-400" />
            <span className="font-mono font-bold text-xs text-white uppercase tracking-wider">
              Controle Remoto de Portões, Cancelas &amp; Eclusas
            </span>
          </div>

          <div className="flex items-center bg-night-900 p-1 rounded-xl border border-night-800 text-xs font-mono">
            {(['TODAS', 'LESTE', 'OESTE'] as const).map(f => (
              <button
                key={f}
                onClick={() => {
                  setFilterQuadra(f);
                  soundAndVoice.playAlertSound('beep');
                }}
                className={`px-3 py-1 rounded-lg transition-all ${
                  filterQuadra === f
                    ? 'bg-brand-500 text-night-950 font-bold'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {f === 'TODAS' && `Todas as Quadras (${portoes.length})`}
                {f === 'LESTE' && 'Quadra Leste (Galpões)'}
                {f === 'OESTE' && 'Quadra Oeste (Sede Admin)'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-3 text-xs font-mono">
          <div className="px-3 py-1.5 rounded-xl bg-night-900 border border-night-800 flex items-center space-x-2">
            <Unlock className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-gray-400">Abertos:</span>
            <span className="text-amber-300 font-bold">{totalAbertos}</span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-night-900 border border-night-800 flex items-center space-x-2">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-gray-400">Travados / Eclusa:</span>
            <span className="text-emerald-400 font-bold">{totalTravados}</span>
          </div>

          <button
            onClick={() => {
              onLockAllPortoes();
              soundAndVoice.playAlertSound('warning');
              if (voiceEnabled) {
                soundAndVoice.speakAlert(
                  'Protocolo de bloqueio total acionado. Todos os portões e eclusas das duas quadras foram fechados e travados.'
                );
              }
            }}
            className="px-3.5 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/35 border border-rose-500/60 text-rose-200 font-bold flex items-center space-x-1.5 transition-all"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            <span>Travar Todos (Lockdown)</span>
          </button>
        </div>
      </div>

      {/* =====================================================================
          CORPO CENTRAL: LISTA DE PORTÕES (ESQUERDA) + MONITOR E AUDITORIA (DIREITA)
         ===================================================================== */}
      <div className="flex-1 min-h-0 mt-3 grid grid-cols-12 gap-4">
        {/* COLUNA ESQUERDA (7 cols): Cartões de Acionamento Remoto dos 5 Portões/Eclusas Reais */}
        <div className="col-span-7 bg-night-950/90 border border-night-800 rounded-2xl p-4 flex flex-col justify-between overflow-y-auto">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-night-800 pb-2.5">
              <div>
                <h3 className="text-xs font-mono font-bold text-white uppercase flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-brand-400" />
                  <span>Dispositivos Físicos de Bloqueio e Acesso</span>
                </h3>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Acionamento via CLP Ethernet com trava eletromagnética e sensor de barreira infravermelha (IVA)
                </p>
              </div>
              <span className="text-[10px] font-mono text-brand-400 font-bold">
                CLP MODBUS ONLINE
              </span>
            </div>

            {filteredGates.map(gate => {
              const isSelected = gate.id === selectedGate?.id;
              const isOpen = gate.status === 'ABERTO';
              const isInterlocked = gate.status === 'INTERTRAVADO_SEGURANCA';

              return (
                <div
                  key={gate.id}
                  onClick={() => setSelectedGateId(gate.id)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between gap-4 ${
                    isSelected
                      ? 'bg-brand-500/10 border-brand-400 shadow-glow-brand'
                      : 'bg-night-900/75 border-night-800 hover:border-night-700'
                  }`}
                >
                  <div className="flex items-start space-x-3.5 min-w-0">
                    <div
                      className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 ${
                        isOpen
                          ? 'bg-amber-500/15 border-amber-400/50 text-amber-300'
                          : isInterlocked
                          ? 'bg-purple-500/15 border-purple-400/50 text-purple-300'
                          : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                      }`}
                    >
                      {isOpen ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-night-950 border border-night-700 text-sky-300">
                          {gate.codigo}
                        </span>
                        <span className="text-sm font-bold text-white truncate">{gate.nome}</span>
                      </div>

                      <p className="text-xs text-gray-400 mt-1">
                        <strong className="text-gray-200">{gate.quadra}</strong> • {gate.localizacao}
                      </p>

                      <div className="flex items-center space-x-3 mt-1.5 text-[11px] font-mono text-gray-400 flex-wrap gap-y-1">
                        <span>
                          Barreira IVA:{' '}
                          <strong
                            className={
                              gate.sensorBarreiraIVA === 'LIVRE'
                                ? 'text-emerald-400'
                                : gate.sensorBarreiraIVA === 'VEICULO_DETECTADO'
                                ? 'text-amber-300'
                                : 'text-purple-300'
                            }
                          >
                            {gate.sensorBarreiraIVA}
                          </strong>
                        </span>
                        <span>•</span>
                        <span>
                          Último registro: <strong className="text-brand-300">{gate.placaOuCrachaUltimo}</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Controles de Abertura / Fechamento */}
                  <div className="flex flex-col items-end space-y-2 shrink-0 font-mono">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        isOpen
                          ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                          : isInterlocked
                          ? 'bg-purple-500/20 border-purple-400 text-purple-200'
                          : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                      }`}
                    >
                      {isOpen ? 'PORTÃO ABERTO' : isInterlocked ? 'ECLUSA INTERTRAVADA' : 'FECHADO & TRAVADO'}
                    </span>

                    <button
                      onClick={e => {
                        e.stopPropagation();
                        onTogglePortao(gate.id);
                      }}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all ${
                        isOpen
                          ? 'bg-emerald-500 hover:bg-emerald-400 text-night-950 shadow-glow-brand'
                          : 'bg-night-950 hover:bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      }`}
                    >
                      {isOpen ? (
                        <>
                          <Lock className="w-3.5 h-3.5" />
                          <span>Fechar &amp; Travar</span>
                        </>
                      ) : (
                        <>
                          <Unlock className="w-3.5 h-3.5" />
                          <span>Abrir Remotamente</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-3 pt-3 border-t border-night-800 flex items-center justify-between text-[11px] font-mono text-gray-400">
            <span>Sincronizado em tempo real com a Planta 2D e Maquete 3D</span>
            <span className="text-emerald-400 font-bold">INTERTRAVAMENTO ATIVO</span>
          </div>
        </div>

        {/* COLUNA DIREITA (5 cols): Câmera Vinculada ao Portão + Log de Auditoria de Acionamentos */}
        <div className="col-span-5 flex flex-col gap-4 min-h-0">
          {/* Monitor de Vídeo da Câmera do Portão Selecionado */}
          <div className="bg-night-950/90 border border-night-800 rounded-2xl p-3.5 flex flex-col space-y-2.5">
            <div className="flex items-center justify-between font-mono text-xs">
              <div className="flex items-center space-x-2">
                <Camera className="w-4 h-4 text-brand-400" />
                <span className="font-bold text-white">
                  Visualização ao Vivo: {linkedCamera?.id}
                </span>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 text-[10px] font-bold flex items-center space-x-1">
                <Radio className="w-3 h-3 animate-pulse" />
                <span>RTSP LIVE</span>
              </span>
            </div>

            <div className="relative w-full h-48 rounded-xl overflow-hidden bg-black border border-night-700">
              <img
                src={getCameraImage(linkedCamera?.id || 'CAM-01')}
                alt={linkedCamera?.nome}
                className="w-full h-full object-cover"
              />
              {linkedCamera?.holofoteLigado && (
                <div className="absolute inset-0 bg-amber-100/20 pointer-events-none animate-pulse" />
              )}
              <div className="absolute top-2 left-2 bg-night-950/85 px-2.5 py-1 rounded-lg border border-night-700 text-[10px] font-mono text-gray-200">
                {selectedGate?.codigo} • {linkedCamera?.ip}
              </div>
              <div className="absolute bottom-2 inset-x-2 bg-night-950/90 px-2.5 py-1.5 rounded-lg border border-night-700 flex items-center justify-between text-[10px] font-mono">
                <span className="text-brand-300 truncate">{selectedGate?.nome}</span>
                <div className="flex items-center space-x-1.5 shrink-0">
                  <button
                    onClick={() => {
                      if (linkedCamera) onToggleCameraLight(linkedCamera.id);
                      soundAndVoice.playAlertSound('beep');
                    }}
                    className={`px-2 py-0.5 rounded border flex items-center space-x-1 ${
                      linkedCamera?.holofoteLigado
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                        : 'bg-night-900 border-night-700 text-gray-400 hover:text-white'
                    }`}
                  >
                    <Lightbulb className="w-3 h-3" />
                    <span>Holofote</span>
                  </button>
                  <button
                    onClick={() => {
                      if (linkedCamera) onToggleCameraSiren(linkedCamera.id);
                      soundAndVoice.playAlertSound('critical');
                    }}
                    className={`px-2 py-0.5 rounded border flex items-center space-x-1 ${
                      linkedCamera?.sireneLigada
                        ? 'bg-rose-600 border-rose-400 text-white animate-pulse'
                        : 'bg-night-900 border-night-700 text-gray-400 hover:text-white'
                    }`}
                  >
                    <BellRing className="w-3 h-3" />
                    <span>Sirene</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Log de Auditoria de Acionamentos de Portões e Eclusas */}
          <div className="flex-1 min-h-0 bg-night-950/90 border border-night-800 rounded-2xl p-3.5 flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex items-center justify-between border-b border-night-800 pb-2 mb-2.5 font-mono text-xs">
                <span className="font-bold text-brand-400 uppercase flex items-center space-x-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Log de Auditoria de Portões &amp; Eclusas</span>
                </span>
                <span className="text-[10px] text-gray-500">{logsPortoes.length} eventos</span>
              </div>

              <div className="space-y-2">
                {logsPortoes.map(log => (
                  <div
                    key={log.id}
                    className="p-2.5 rounded-xl bg-night-900/80 border border-night-800 text-xs font-mono space-y-1"
                  >
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-brand-300 font-bold">{log.horario} • {log.portaoNome}</span>
                      <span
                        className={`px-1.5 py-0.5 rounded font-bold ${
                          log.acao === 'ABERTURA_REMOTA'
                            ? 'bg-amber-500/20 text-amber-300'
                            : log.acao === 'BLOQUEIO_EMERGENCIA'
                            ? 'bg-rose-500/20 text-rose-300'
                            : 'bg-emerald-500/20 text-emerald-300'
                        }`}
                      >
                        {log.acao}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-300 font-sans leading-snug">{log.detalhe}</p>
                    <div className="text-[10px] text-gray-500 flex items-center space-x-1">
                      <CheckCircle2 className="w-3 h-3 text-brand-400" />
                      <span>Operador: {log.operador}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
