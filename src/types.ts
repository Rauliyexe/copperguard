export type TabType = 
  | 'olho-de-deus'
  | 'dashboard-geral' 
  | 'cameras-videowall' 
  | 'pontos-risco' 
  | 'entradas-saidas' 
  | 'produtividade-pessoas' 
  | 'maquinas-oee' 
  | 'veiculos-frotas';

export type StatusNivel = 'normal' | 'alerta' | 'critico';

export type LightingCycleMode = 'DIA' | 'ENTARDECER' | 'NOITE';
export type MapRenderStyle = 'CAD_TATICO' | 'SATELITE_REAL';

export type PlantSectorId = 
  | 'COMPLEXO_COMPLETO'
  | 'SEDE_ADMIN'
  | 'PORTAO_250'
  | 'GALPOES_GEMINADOS'
  | 'GALPAO_ARCO'
  | 'PATIO_CARRETAS'
  | 'ALAMBRADO_NORTE';

export interface PlantSpatialFocus {
  sectorId: PlantSectorId;
  label: string;
  threeTarget: { x: number; z: number; radius: number; theta: number; phi: number };
  twoTarget: { panX: number; panY: number; zoom: number };
  lastUpdatedBy: '2D' | '3D' | 'CAMERA' | 'SECTOR_BTN';
  timestamp: number;
}

export const SECTOR_FOCUS_PRESETS: Record<PlantSectorId, {
  label: string;
  threeTarget: { x: number; z: number; radius: number; theta: number; phi: number };
  twoTarget: { panX: number; panY: number; zoom: number };
}> = {
  COMPLEXO_COMPLETO: {
    label: 'Complexo Completo (2 Quadras)',
    threeTarget: { x: 0, z: 0, radius: 122, theta: 0.20, phi: 0.78 },
    twoTarget: { panX: 0, panY: 0, zoom: 1.0 }
  },
  SEDE_ADMIN: {
    label: 'Sede Administrativa Azul (Leste)',
    threeTarget: { x: -55, z: -15, radius: 65, theta: 0.45, phi: 0.65 },
    twoTarget: { panX: 520, panY: 210, zoom: 2.25 }
  },
  PORTAO_250: {
    label: 'Portão Azul Nº 250 & LPR (Oeste)',
    threeTarget: { x: 38, z: 8, radius: 76, theta: 0.35, phi: 0.64 },
    twoTarget: { panX: -220, panY: 280, zoom: 2.25 }
  },
  GALPOES_GEMINADOS: {
    label: 'Galpões Geminados 01 e 02',
    threeTarget: { x: -9, z: 0, radius: 62, theta: -0.25, phi: 0.64 },
    twoTarget: { panX: 120, panY: -20, zoom: 1.85 }
  },
  GALPAO_ARCO: {
    label: 'Galpão de Arco & Doca Toldo Azul',
    threeTarget: { x: 52, z: -25, radius: 48, theta: 0.30, phi: 0.60 },
    twoTarget: { panX: -460, panY: 270, zoom: 2.2 }
  },
  PATIO_CARRETAS: {
    label: 'Pátio Carretas & Big-Bags',
    threeTarget: { x: 48, z: 16, radius: 54, theta: 0.25, phi: 0.62 },
    twoTarget: { panX: -410, panY: -140, zoom: 1.95 }
  },
  ALAMBRADO_NORTE: {
    label: 'Alambrado Norte (Radar de Intrusão)',
    threeTarget: { x: 5, z: -36, radius: 38, theta: 0.05, phi: 0.52 },
    twoTarget: { panX: 40, panY: 350, zoom: 2.4 }
  }
};

export interface AccessibilityConfig {
  voiceAlertsEnabled: boolean;
  soundSirenEnabled: boolean;
  highContrastMode: boolean;
  colorblindMode: boolean;
  largeFontMode: boolean;
  autoCycleTvMode: boolean;
  liveTelemetryRunning: boolean;
}

export interface PontoRisco {
  id: string;
  nome: string;
  localizacao: string;
  tipoSensor: 'Cerca Elétrica Alta Tensão' | 'Linha Virtual IA (Tripwire)' | 'Barreira Infravermelho (IVA)' | 'Câmera Térmica Termográfica' | 'Sensor de Vibração/Impacto';
  cameraId: string;
  cameraNome: string;
  status: 'ARMADO' | 'VIOLADO' | 'MANUTENCAO' | 'DESARMADO';
  nivelRisco: 'BAIXO' | 'MEDIO' | 'ALTO' | 'CRITICO';
  ultimoDisparo?: string;
  historicoAlertasHoje: number;
  coords: { x: number; y: number }; // Posição na planta 2D (0-100%)
  holofoteAtivo?: boolean;
  sireneAtiva?: boolean;
}

export interface IncidenteSeguranca {
  id: string;
  timestamp: string;
  pontoRiscoId: string;
  pontoRiscoNome: string;
  tipo: string;
  nivel: 'ALTO' | 'CRITICO' | 'MEDIO';
  status: 'EM_ABERTO' | 'EM_VERIFICACAO' | 'RESOLVIDO' | 'FALSO_POSITIVO';
  snapshotUrl: string;
  descricao: string;
  correlacaoIA?: string;
  hashForense?: string;
  acaoTomada?: string;
}

export interface AnomaliaCruzada {
  id: string;
  horario: string;
  titulo: string;
  fontesCruzadas: string[];
  confiancaIA: number; // %
  severidade: 'CRITICA' | 'ALTA' | 'MEDIA';
  detalhe: string;
  cameraRelacionadaId: string;
  status: 'ATIVA' | 'INVESTIGANDO' | 'CONTIDA';
}

export interface RegistroAcesso {
  id: string;
  tipo: 'CAMINHAO' | 'VEICULO_LEVE' | 'COLABORADOR' | 'PRESTADOR';
  placaOuDoc: string;
  nomePessoa: string;
  empresa: string;
  tipoFluxo: 'ENTRADA' | 'SAIDA';
  horarioEntrada: string;
  horarioSaida?: string;
  status: 'NO_PATIO' | 'EM_INSPECAO_LPR' | 'LIBERADO' | 'RETIDO_SEGURANCA';
  nfeNumero?: string;
  fotoUrl?: string;
  observacaoSeguranca?: string;
  portaoUtilizado?: string;
}

export interface FuncionarioProdutividade {
  id: string;
  nome: string;
  cargo: string;
  setor: 'Fundição' | 'Portaria & Segurança' | 'Pátio de Sucatas' | 'Logística' | 'Manutenção';
  turno: 'Turno A (06h-14h)' | 'Turno B (14h-22h)' | 'Turno C (22h-06h)';
  horasTrabalhadasHoje: number;
  horasMeta: number;
  status: 'PRODUZINDO' | 'PAUSA_NR' | 'ALMOCO' | 'TREINAMENTO' | 'OCIOSO';
  eficienciaPercentual: number;
  atrasosMinutos: number;
  rfidTag: string;
  zonaAtual: string;
  coords: { x: number; y: number };
}

export interface MaquinaOEE {
  id: string;
  codigo: string;
  nome: string;
  setor: string;
  status: 'OPERANDO' | 'OCIOSA' | 'MANUTENCAO' | 'SETUP' | 'FALHA';
  horasTrabalhadasTurno: number;
  horasDisponiveis: number;
  oee: {
    disponibilidade: number;
    performance: number;
    qualidade: number;
    oeeGeral: number;
  };
  temperaturaAtualC?: number;
  consumoKwhTon?: number;
  operadorLogado?: string;
}

export interface VeiculoTelemetria {
  id: string;
  prefixo: string;
  modelo: string;
  tipo: 'EMPILHADEIRA' | 'PA_CARREGADEIRA' | 'CAMINHAO_PATIO';
  operadorAtual: string;
  status: 'EM_MOVIMENTO' | 'OCIOSO_MOTOR_LIGADO' | 'DESLIGADO' | 'CARREGANDO';
  horimetroTotal: number;
  horasOperandoTurno: number;
  horasOciosasTurno: number;
  velocidadeAtualKmH: number;
  nivelEnergiaCombustivel: number;
  ciclosCargaRealizados: number;
  alertaExcessoVelocidade?: boolean;
  zonaAtual: string;
  coords: { x: number; y: number };
}

export interface CameraStream {
  id: string;
  nome: string;
  setor: string;
  ip: string;
  resolucao: string;
  fps: number;
  status: 'ONLINE' | 'OFFLINE' | 'ALERTA';
  analiticoIA: {
    linhaVirtualAtiva: boolean;
    deteccaoHumanos: boolean;
    deteccaoVeiculos: boolean;
    leituraPlacaLPR: boolean;
    termometria?: boolean;
    reconhecimentoFacial?: boolean;
  };
  eventosUltimaHora: number;
  holofoteLigado?: boolean;
  sireneLigada?: boolean;
  modoTermico?: boolean;
  zoomLevel?: number;
  coords: { x: number; y: number };
}

export interface PortaoSeguranca {
  id: string;
  codigo: string;
  nome: string;
  quadra: 'Quadra Leste (Galpões)' | 'Quadra Oeste (Sede Admin)';
  localizacao: string;
  tipo: 'PORTAO_DESLIZANTE' | 'PORTAO_GRADE_SEDE' | 'CATRACA_FACIAL' | 'PORTAO_ENROLAR_TOLDO' | 'ECLUSA_COFRE';
  cameraId: string;
  status: 'FECHADO_TRAVADO' | 'ABERTO' | 'INTERTRAVADO_SEGURANCA';
  travaEletromagnetica: boolean;
  sensorBarreiraIVA: 'LIVRE' | 'VEICULO_DETECTADO' | 'BLOQUEADO';
  ultimoAcionamento: string;
  operadorResponsavel: string;
  placaOuCrachaUltimo?: string;
}

export interface LogAcionamentoPortao {
  id: string;
  horario: string;
  portaoId: string;
  portaoNome: string;
  acao: 'ABERTURA_REMOTA' | 'FECHAMENTO_TRAVA' | 'BLOQUEIO_EMERGENCIA' | 'LIBERACAO_LPR_FACIAL';
  operador: string;
  detalhe: string;
}
