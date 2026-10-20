import React from 'react';
import { 
  KeyRound, 
  Camera, 
  Layers, 
  Box, 
  ScanFace, 
  Volume2, 
  VolumeX, 
  ShieldCheck, 
  ShieldAlert, 
  LayoutGrid, 
  Monitor, 
  ArrowLeftRight,
  Maximize2,
  Lightbulb,
  Building2,
  Lock,
  Clock,
  Compass,
  Sun,
  Users,
  Plus,
  QrCode
} from 'lucide-react';
import { soundAndVoice } from '../utils/soundAndVoice';
import { CopperOSTopHeader } from './CopperOSTopHeader';

export interface ModuleFunctionItem {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: string;
  badgeVariant?: 'emerald' | 'amber' | 'rose';
}

export interface SecurityModuleDefinition {
  id: string;
  name: string;
  category: string;
  icon: React.ElementType;
  functions: ModuleFunctionItem[];
}

export const SECURITY_MODULES_CATALOG: Record<string, SecurityModuleDefinition> = {
  'maquete-3d': {
    id: 'maquete-3d',
    name: 'Maquete 3D',
    category: 'Digital Twin & Ambientes',
    icon: Box,
    functions: [
      { id: 'gemeo-3d', label: 'Gêmeo Digital 3D', icon: Box, badge: 'WEBGL', badgeVariant: 'emerald' },
      { id: 'satelite-real', label: 'Modo Satélite Realista', icon: Compass },
      { id: 'ciclo-dia-noite', label: 'Ciclo Dia, Tarde e Noite', icon: Sun },
      { id: 'postes-led', label: 'Iluminação LED & FOV', icon: Lightbulb },
      { id: 'hover-pip', label: 'Hover PiP nas Câmeras', icon: Camera, badge: 'PIP', badgeVariant: 'emerald' },
    ]
  },
  'planta-2d': {
    id: 'planta-2d',
    name: 'Planta 2D CAD',
    category: 'CAD Tático & Perímetro',
    icon: Layers,
    functions: [
      { id: 'cad-tatico', label: 'Planta Vetorial CAD', icon: Layers, badge: 'VETOR', badgeVariant: 'emerald' },
      { id: 'satelite-asfalto', label: 'Satélite Real & Asfalto', icon: Compass },
      { id: 'cerca-eletrica', label: 'Cerca 10.000V & IVA', icon: ShieldCheck, badge: '10kV', badgeVariant: 'emerald' },
      { id: 'iluminacao-led', label: 'Postes LED Noturnos', icon: Lightbulb },
      { id: 'portoes-mapa', label: 'Portões & Eclusas no Mapa', icon: KeyRound },
    ]
  },
  'cftv-dvr': {
    id: 'cftv-dvr',
    name: 'Câmeras CFTV',
    category: 'Vigilância 4K & IA',
    icon: Camera,
    functions: [
      { id: 'mural-geral', label: 'Mural de Câmeras', icon: LayoutGrid, badge: 'VIGILÂNCIA', badgeVariant: 'emerald' },
      { id: 'camera-zoom', label: 'Controles PTZ & Zoom', icon: Maximize2 },
      { id: 'analitico-ia', label: 'Linhas Virtuais & IA', icon: ShieldAlert, badge: 'IA', badgeVariant: 'amber' },
      { id: 'alocar-camera', label: 'Alocar Nova Câmera', icon: Plus, badge: '+NOVA', badgeVariant: 'emerald' },
      { id: 'telao-integrado', label: 'Modo Telão Sem HUD', icon: Monitor, badge: 'WALLBOARD', badgeVariant: 'emerald' },
    ]
  },
  'portoes-eclusas': {
    id: 'portoes-eclusas',
    name: 'Portões & Eclusas',
    category: 'Controle de Acesso Remoto',
    icon: KeyRound,
    functions: [
      { id: 'todos-portoes', label: 'Todos os 5 Portões', icon: KeyRound, badge: '5 PORTÕES', badgeVariant: 'emerald' },
      { id: 'galpoes-oeste', label: 'Galpões (Quadra Oeste)', icon: Building2 },
      { id: 'sede-leste', label: 'Sede (Quadra Leste)', icon: Building2 },
      { id: 'eclusa-cofre', label: 'Eclusa Dupla do Cofre', icon: Lock, badge: 'BLINDADO', badgeVariant: 'amber' },
      { id: 'logs-auditoria', label: 'Log de Auditoria CCO', icon: Clock },
    ]
  },
  'portaria-facial': {
    id: 'portaria-facial',
    name: 'Biometria Facial',
    category: 'Portaria & Catracas 3D',
    icon: ScanFace,
    functions: [
      { id: 'catracas-ao-vivo', label: 'Catracas & Portaria (Ao Vivo)', icon: ScanFace, badge: '0.2s', badgeVariant: 'emerald' },
      { id: 'colaboradores-facial', label: 'Colaboradores & Scanner 3D', icon: Users, badge: 'FACIAL', badgeVariant: 'emerald' },
      { id: 'visitantes-convites', label: 'Fila de Visitantes & Convites', icon: QrCode, badge: 'QR CODE', badgeVariant: 'amber' },
      { id: 'registros-acessos', label: 'Entradas & Saídas (Auditoria)', icon: Clock },
      { id: 'autorizados-cofre', label: 'Acessos ao Cofre Blindado', icon: ShieldCheck, badge: 'BLINDADO', badgeVariant: 'amber' },
    ]
  },
  'cockpit-modular': {
    id: 'cockpit-modular',
    name: 'Cockpit Modular',
    category: 'Painéis Customizáveis',
    icon: LayoutGrid,
    functions: [
      { id: 'painel-ativo', label: 'Painel de Widgets Ativo', icon: LayoutGrid },
      { id: 'adicionar-bloco', label: 'Adicionar Novo Bloco', icon: Plus, badge: 'NOVO', badgeVariant: 'emerald' },
      { id: 'preset-seguranca', label: 'Modelo Segurança Total', icon: ShieldCheck },
      { id: 'preset-acessos', label: 'Modelo Portões & Acesso', icon: KeyRound },
    ]
  }
};

interface CopperGuardERPLayoutProps {
  currentModuleId: string;
  activeFunctionId?: string;
  onSelectFunction?: (functionId: string) => void;
  onBackToHub: () => void;
  voiceEnabled: boolean;
  onToggleVoice: () => void;
  hasActiveIncident?: boolean;
  onResolveIncident?: () => void;
  children: React.ReactNode;
}

export const CopperGuardERPLayout: React.FC<CopperGuardERPLayoutProps> = ({
  currentModuleId,
  activeFunctionId,
  onSelectFunction,
  onBackToHub,
  voiceEnabled,
  onToggleVoice,
  hasActiveIncident,
  onResolveIncident,
  children
}) => {
  // Obtém metadados estritos do módulo selecionado
  const currentModule = SECURITY_MODULES_CATALOG[currentModuleId] || SECURITY_MODULES_CATALOG['maquete-3d'];
  const ModuleIcon = currentModule.icon;

  const activeFnId = activeFunctionId || currentModule.functions[0]?.id;
  const currentFn = currentModule.functions.find(f => f.id === activeFnId) || currentModule.functions[0];

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#070F0B] text-slate-100 flex flex-col font-sans select-none">
      {/* 1. TOP HEADER CANÔNICO COPPEROS */}
      <CopperOSTopHeader hasActiveIncident={hasActiveIncident} />

      {/* 2. ÁREA DE TRABALHO: SIDEBAR COM AS FUNÇÕES DO MÓDULO + CONTEÚDO PRINCIPAL */}
      <div className="flex-1 flex min-h-0 relative w-full overflow-hidden">
        {/* SIDEBAR CONTEXTUAL EXIBINDO APENAS AS FUNÇÕES DESTE MÓDULO */}
        <aside className="w-64 h-full bg-[#070F0B] border-r border-[#16291E] flex flex-col justify-between p-3 shrink-0 z-30">
          <div className="space-y-3">
            {/* CARTÃO SUPERIOR DO MÓDULO ATUAL COM AÇÃO 'TROCAR' (VOLTA AO HUB) */}
            <button
              type="button"
              onClick={() => {
                soundAndVoice.playAlertSound('beep');
                onBackToHub();
              }}
              aria-label={`Trocar de módulo — atual: ${currentModule.name}`}
              title="Voltar para a seleção de módulos"
              className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border border-[#16291E] bg-[#0A140F] hover:border-emerald-500/60 hover:bg-[#0E1A14] transition-colors shadow-sm cursor-pointer group"
            >
              <span className="flex items-center gap-2.5 min-w-0">
                <ModuleIcon className="w-4 h-4 shrink-0 text-emerald-400" aria-hidden="true" />
                <span className="text-sm font-bold text-white tracking-wide truncate">
                  {currentModule.name}
                </span>
              </span>
              <span className="flex items-center gap-1 text-xs font-medium text-gray-400 group-hover:text-emerald-400 shrink-0">
                <ArrowLeftRight className="w-3.5 h-3.5" aria-hidden="true" />
                Trocar
              </span>
            </button>

            {/* SEÇÃO: APENAS AS FUNÇÕES DESTE MÓDULO */}
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-2.5 mb-2 flex items-center justify-between">
                <span>Funções do Módulo</span>
                <span className="text-[9px] bg-[#0E1A14] border border-[#16291E] px-1.5 py-0.5 rounded text-gray-400 font-mono">
                  {currentModule.functions.length}
                </span>
              </div>

              {/* LISTA DAS FUNÇÕES INTERNAS DESTE MÓDULO ESPECÍFICO */}
              <ul role="list" className="space-y-1">
                {currentModule.functions.map((fn) => {
                  const FnIcon = fn.icon;
                  const isActive = activeFnId === fn.id;

                  return (
                    <li key={fn.id}>
                      <button
                        type="button"
                        onClick={() => {
                          soundAndVoice.playAlertSound('beep');
                          if (onSelectFunction) {
                            onSelectFunction(fn.id);
                          }
                        }}
                        className={`
                          w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition-all group text-left cursor-pointer
                          ${isActive 
                            ? 'bg-emerald-950/45 text-emerald-300 font-semibold border border-emerald-700/50 shadow-[0_0_12px_rgba(16,185,129,0.15)]' 
                            : 'text-gray-300 hover:text-white hover:bg-[#0A140F] border border-transparent'
                          }
                        `}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {/* Caixa do ícone padronizada estilo CopperOS */}
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border transition-transform group-hover:scale-105 ${
                            isActive 
                              ? 'bg-[#040A07] text-[#00FF88] border-[#00FF88]/70 shadow-[0_0_8px_rgba(0,255,136,0.3)]' 
                              : 'bg-[#0A140F] text-emerald-400 border-[#16291E]'
                          }`}>
                            <FnIcon className="w-3.5 h-3.5" aria-hidden="true" />
                          </div>
                          <span className="truncate">{fn.label}</span>
                        </div>

                        {fn.badge && (
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider shrink-0 ${
                            fn.badgeVariant === 'rose'
                              ? 'bg-rose-950/80 text-rose-400 border border-rose-800/60'
                              : fn.badgeVariant === 'amber'
                              ? 'bg-amber-950/80 text-amber-400 border border-amber-800/60'
                              : 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60'
                          }`}>
                            {fn.badge}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          {/* RODAPÉ DA SIDEBAR: STATUS PERIMETRAL & CONTROLE DE VOZ */}
          <div className="space-y-2 pt-3 border-t border-[#16291E]">
            {/* Alerta Perimetral */}
            {hasActiveIncident ? (
              <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-500 text-rose-200 font-mono text-[11px] font-bold flex flex-col space-y-1.5 animate-pulse">
                <div className="flex items-center space-x-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span className="truncate">MURO NORTE VIOLADO</span>
                </div>
                {onResolveIncident && (
                  <button
                    onClick={onResolveIncident}
                    className="w-full py-1 rounded bg-rose-600 hover:bg-rose-500 text-white text-[10px] uppercase font-bold transition-colors"
                  >
                    Silenciar Alarme
                  </button>
                )}
              </div>
            ) : (
              <div className="p-2 rounded-xl bg-[#0A140F] border border-[#16291E] text-emerald-400 font-mono text-[11px] flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-bold truncate text-[10px] tracking-wider uppercase">Perímetro Seguro</span>
              </div>
            )}

            {/* Alternador de Voz */}
            <button
              onClick={onToggleVoice}
              className={`w-full flex items-center justify-between rounded-xl px-2.5 py-1.5 text-[11px] font-mono border transition-all ${
                voiceEnabled
                  ? 'bg-brand-500/10 border-brand-500/30 text-brand-300'
                  : 'bg-transparent border-transparent text-gray-500 hover:text-gray-300'
              }`}
              title="Avisos Sonoros / Voz em Português"
            >
              <div className="flex items-center space-x-2">
                {voiceEnabled ? (
                  <Volume2 className="w-3.5 h-3.5 text-brand-400 shrink-0" />
                ) : (
                  <VolumeX className="w-3.5 h-3.5 shrink-0" />
                )}
                <span>{voiceEnabled ? 'Voz CCO Ativa' : 'Voz Desativada'}</span>
              </div>
            </button>
          </div>
        </aside>

        {/* 3. ÁREA PRINCIPAL: CONTEÚDO INTEGRAL DA FUNÇÃO (SEM CABEÇALHOS REDUNDANTES) */}
        <main className="flex-1 min-w-0 h-full flex flex-col bg-[#070F0B] overflow-hidden p-2.5 sm:p-3 relative">
          <div className="flex-1 min-h-0 w-full rounded-2xl border border-[#16291E] bg-[#0A140F] overflow-hidden shadow-xl relative">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
