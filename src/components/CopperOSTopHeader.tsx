import React from 'react';
import { 
  Bell, 
  ChevronDown, 
  ShieldCheck, 
  ShieldAlert,
  Sun,
  Menu,
  X
} from 'lucide-react';
import { soundAndVoice } from '../utils/soundAndVoice';

interface CopperOSTopHeaderProps {
  hasActiveIncident?: boolean;
  onToggleMobileMenu?: () => void;
  isMobileMenuOpen?: boolean;
}

export const CopperOSTopHeader: React.FC<CopperOSTopHeaderProps> = ({ 
  hasActiveIncident,
  onToggleMobileMenu,
  isMobileMenuOpen = false
}) => {
  return (
    <header 
      aria-label="Cabeçalho corporativo CopperOS CopperGuard"
      className="sticky top-0 z-40 h-14 sm:h-16 bg-[#070F0B]/95 backdrop-blur-md border-b border-[#16291E] flex items-center justify-between px-3 sm:px-6 w-full select-none"
    >
      {/* Lado Esquerdo: Botão Menu Mobile + Logo CopperOS + CopperGuard */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0 min-w-0">
        {/* Botão Hamburger / Gaveta Mobile (exclusivo para telas pequenas) */}
        {onToggleMobileMenu && (
          <button
            type="button"
            onClick={() => {
              soundAndVoice.playAlertSound('beep');
              onToggleMobileMenu();
            }}
            aria-label={isMobileMenuOpen ? "Fechar menu de navegação" : "Abrir menu e funções"}
            className="md:hidden w-10 h-10 rounded-xl border border-[#16291E] bg-[#0A140F] active:scale-95 flex items-center justify-center text-emerald-400 hover:text-white hover:bg-[#0E1A14] transition-all cursor-pointer"
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5 text-emerald-300" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        )}

        {/* Logotipo Canônico CopperOS */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 select-none cursor-default">
          <div className="w-7 h-7 sm:w-8 sm:h-8 flex-shrink-0 flex items-center justify-center">
            <svg 
              viewBox="0 0 54 54" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg" 
              className="w-6 h-6 sm:w-8 sm:h-8"
              role="img"
              aria-label="Logotipo CopperOS"
            >
              <rect 
                x="8" 
                y="12" 
                width="32" 
                height="32" 
                rx="7" 
                stroke="#10B981" 
                strokeWidth="3.5" 
              />
              <circle 
                cx="44" 
                cy="10" 
                r="3.5" 
                fill="#10B981" 
              />
            </svg>
          </div>

          <div className="flex items-baseline gap-1">
            <span className="font-bold text-sm sm:text-xl tracking-tight text-white">
              Copper<span className="text-emerald-400">Guard</span>
            </span>
            <span className="text-[10px] font-mono text-gray-500 hidden sm:inline">
              no CopperOS
            </span>
          </div>

          <span 
            className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#00FF88] shadow-[0_0_8px_#00FF88] inline-block ml-0.5" 
            title="Sistema de Segurança Operacional Online"
          />
        </div>

        {/* Separador vertical sutil */}
        <span className="w-px h-5 bg-[#16291E] hidden sm:inline" />

        {/* Identificação da Planta / CCO */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-[#0A140F] border border-[#16291E] text-xs">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-gray-300 font-mono text-[11px]">
            Planta Industrial Matriz • Centro de Controle Operacional (CCO)
          </span>
        </div>
      </div>

      {/* Lado Direito: Status Perimetral + Notificações + Operador */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {/* Status Perimetral */}
        <div className="flex items-center">
          {hasActiveIncident ? (
            <span className="px-2 sm:px-3 py-1 rounded-full bg-rose-950/80 border border-rose-500/80 text-rose-300 font-mono text-[10px] sm:text-xs font-bold flex items-center gap-1 sm:gap-1.5 animate-pulse">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span className="hidden xs:inline">INTRUSÃO</span>
              <span className="xs:hidden">ALERTA</span>
            </span>
          ) : (
            <span className="px-2 sm:px-3 py-1 rounded-full bg-[#0A140F] border border-emerald-900/60 text-emerald-400 font-mono text-[10px] sm:text-xs font-bold flex items-center gap-1 sm:gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="hidden xs:inline">PERÍMETRO SEGURO</span>
              <span className="xs:hidden">SEGURO</span>
            </span>
          )}
        </div>

        {/* Toggle Tema (Dark Mode padrão) */}
        <button
          type="button"
          onClick={() => soundAndVoice.playAlertSound('beep')}
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-[#16291E] bg-[#0A140F] flex items-center justify-center text-amber-400 hover:bg-[#0E1A14] transition-colors cursor-pointer"
          title="Modo Escuro Ativo"
        >
          <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>

        {/* Sino de Notificações */}
        <button
          type="button"
          onClick={() => soundAndVoice.playAlertSound('beep')}
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-[#16291E] bg-[#0A140F] flex items-center justify-center text-gray-300 hover:text-white hover:bg-[#0E1A14] transition-colors relative cursor-pointer"
          title="Notificações do Perímetro"
        >
          <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          {hasActiveIncident && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-[#070F0B] animate-pulse" />
          )}
        </button>

        {/* Perfil do Operador de Segurança */}
        <div className="flex items-center gap-1.5 sm:gap-2 p-0.5 sm:p-1 rounded-xl hover:bg-[#0A140F] transition-colors cursor-pointer">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emerald-950 border border-emerald-700/60 text-emerald-400 font-bold text-[11px] sm:text-xs flex items-center justify-center shrink-0">
            OP
          </div>
          <div className="hidden md:flex flex-col text-left leading-tight">
            <span className="text-xs font-bold text-white">
              Operador CCO #01
            </span>
            <span className="text-[10px] text-gray-400 font-normal">
              Segurança Patrimonial
            </span>
          </div>
          <ChevronDown className="w-3 h-3 text-gray-500 hidden sm:inline" />
        </div>
      </div>
    </header>
  );
};
