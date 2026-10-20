import React from 'react';
import { 
  Box, 
  Layers, 
  Camera, 
  KeyRound, 
  ScanFace, 
  LayoutGrid, 
  ArrowRight
} from 'lucide-react';
import { soundAndVoice } from '../utils/soundAndVoice';
import { CopperOSTopHeader } from './CopperOSTopHeader';

export interface SecurityModuleItem {
  id: string;
  title: string;
  category: string;
  description: string;
  icon: React.ElementType;
  color: string;
}

export const COPPERGUARD_SECURITY_MODULES: SecurityModuleItem[] = [
  {
    id: 'maquete-3d',
    title: 'Maquete 3D',
    category: 'DIGITAL TWIN & AMBIENTES',
    description: 'Gêmeo digital 3D interativo das duas quadras, com iluminação solar e campos de visão das câmeras.',
    icon: Box,
    color: '#00F0FF'
  },
  {
    id: 'planta-2d',
    title: 'Planta 2D',
    category: 'CAD TÁTICO & PERÍMETRO',
    description: 'Planta arquitetônica vetorial com satélite real, postes LED e sensores perimétricos de alta tensão.',
    icon: Layers,
    color: '#818CF8'
  },
  {
    id: 'cftv-dvr',
    title: 'Câmeras CFTV',
    category: 'VIGILÂNCIA 4K & IA',
    description: 'Mural com canais DarkFighter com zoom PTZ, holofotes, modo Wallboard integrado e alocação de câmeras.',
    icon: Camera,
    color: '#FFB800'
  },
  {
    id: 'portoes-eclusas',
    title: 'Portões & Eclusas',
    category: 'CONTROLE DE ACESSO REMOTO',
    description: 'Acionamento remoto dos portões dos galpões, sede administrativa e eclusa biométrica do cofre.',
    icon: KeyRound,
    color: '#10B981'
  },
  {
    id: 'portaria-facial',
    title: 'Biometria Facial',
    category: 'PORTARIA & CATRACAS 3D',
    description: 'Reconhecimento facial 3D ultrarrápido (0.2s), controle de colaboradores, visitantes e auditoria.',
    icon: ScanFace,
    color: '#34D399'
  },
  {
    id: 'cockpit-modular',
    title: 'Cockpit Modular',
    category: 'PAINÉIS CUSTOMIZÁVEIS',
    description: 'Grade livre e modular para organizar câmeras ao vivo, controles de portões e telemetria.',
    icon: LayoutGrid,
    color: '#C084FC'
  }
];

interface CopperGuardHubScreenProps {
  onEnterModule: (moduleId: string) => void;
}

export const CopperGuardHubScreen: React.FC<CopperGuardHubScreenProps> = ({ onEnterModule }) => {
  return (
    <div className="min-h-screen w-full bg-[#070F0B] text-slate-100 flex flex-col font-sans select-none overflow-x-hidden">
      {/* Top Header Canônico CopperOS */}
      <CopperOSTopHeader />

      {/* Área Central com Apenas Módulos de Segurança */}
      <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 sm:px-8 py-6 sm:py-8 space-y-6">
        {/* Cabeçalho de Boas-vindas */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            {/* Pill de Status */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0E1A14] border border-emerald-900/60 text-emerald-400 font-mono text-[10px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00FF88] animate-pulse" />
              <span>SISTEMA DE SEGURANÇA OPERACIONAL ATIVO</span>
            </div>

            {/* Título Principal */}
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-2.5">
              Painel de Segurança, <span className="text-[#00FF88] underline decoration-emerald-500/40 decoration-2 underline-offset-4">CopperGuard.</span>
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              Selecione o módulo de segurança operacional para acessar:
            </p>
          </div>

          {/* Pill de Data Atual */}
          <div className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-[#0A140F] border border-[#16291E] font-mono text-xs text-gray-400 shrink-0">
            Terça-feira, 20 de outubro de 2026
          </div>
        </div>

        {/* Grade de Módulos de Segurança Exclusivos (Padrão de Cartões CopperOS) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {COPPERGUARD_SECURITY_MODULES.map((mod) => {
            const Icon = mod.icon;

            return (
              <div
                key={mod.id}
                onClick={() => {
                  soundAndVoice.playAlertSound('beep');
                  onEnterModule(mod.id);
                }}
                className="group relative flex flex-col justify-between p-5 rounded-2xl bg-[#0A140F] border border-[#16291E] hover:border-emerald-500/60 hover:bg-[#0E1A14] transition-all duration-200 cursor-pointer shadow-sm hover:shadow-[0_0_24px_rgba(16,185,129,0.15)] hover:-translate-y-0.5"
              >
                {/* Linha Superior: Caixa do Ícone (Esquerda) + Pílula de Categoria (Direita) */}
                <div className="flex items-center justify-between">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center border transition-transform group-hover:scale-105 shrink-0"
                    style={{
                      backgroundColor: `${mod.color}15`,
                      borderColor: `${mod.color}40`,
                      color: mod.color
                    }}
                  >
                    <Icon className="w-5 h-5 stroke-[2.2]" />
                  </div>

                  <span 
                    className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider border truncate max-w-[180px]"
                    style={{
                      backgroundColor: `${mod.color}10`,
                      borderColor: `${mod.color}30`,
                      color: mod.color
                    }}
                  >
                    {mod.category}
                  </span>
                </div>

                {/* Linha Central: Título + Descrição em 2 linhas */}
                <div className="mt-4 mb-4">
                  <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors">
                    {mod.title}
                  </h3>
                  <p className="text-xs text-gray-400 mt-1.5 leading-relaxed line-clamp-2">
                    {mod.description}
                  </p>
                </div>

                {/* Linha Inferior: [● ACESSAR] + [→] */}
                <div className="pt-3 border-t border-[#16291E] flex items-center justify-between">
                  <div 
                    className="flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase tracking-wider" 
                    style={{ color: mod.color }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: mod.color }} />
                    <span>Acessar</span>
                  </div>

                  <div className="w-7 h-7 rounded-full flex items-center justify-center border border-[#16291E] bg-[#070F0B] group-hover:border-emerald-500/60 group-hover:bg-emerald-950/40 text-gray-400 group-hover:text-emerald-300 transition-all">
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
};
