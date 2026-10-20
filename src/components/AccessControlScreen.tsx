import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  FuncionarioProdutividade,
  RegistroAcesso
} from '../types';
import {
  Users,
  UserPlus,
  QrCode,
  Link2,
  Copy,
  CheckCircle2,
  ShieldCheck,
  Smartphone,
  Camera,
  ScanFace,
  KeyRound,
  Truck,
  LogOut,
  LogIn,
  RefreshCw,
  BadgeCheck,
  XCircle,
  Search,
  X,
  Lock,
  Clock,
  ArrowRight,
  ShieldAlert,
  Sliders,
  Crosshair,
  Activity,
  AlertTriangle,
  Printer,
  Share2,
  FileText,
  Check,
  Sparkles,
  MessageSquare,
  Send,
  ExternalLink,
  Eye,
  CheckCheck,
  FileCheck,
  Layers,
  Download,
  Info
} from 'lucide-react';
import { soundAndVoice } from '../utils/soundAndVoice';

export interface FuncionarioBiometria {
  id: string;
  nome: string;
  cpf: string;
  matricula: string;
  cargo: string;
  setor: 'Fundição' | 'Portaria & Segurança' | 'Pátio de Sucatas' | 'Logística' | 'Manutenção';
  turno: 'Turno A (06h-14h)' | 'Turno B (14h-22h)' | 'Turno C (22h-06h)';
  rfidTag: string;
  facialCadastrada: boolean;
  facialHash?: string;
  facialScore?: number;
  dataCadastroFacial?: string;
  acessoCofreAutorizado: boolean;
  presenteNaPlanta: boolean;
  ultimaCatraca?: string;
  avatarIniciais: string;
}

export interface PreCadastroVisitante {
  id: string;
  tokenLink: string;
  nome: string;
  cpf: string;
  empresa: string;
  telefone: string;
  tipo: 'VISITANTE' | 'MOTORISTA_CARGA' | 'PRESTADOR_SERVICO';
  anfitriao: string;
  setorDestino: string;
  placaVeiculo?: string;
  placaCarreta?: string;
  cnh?: string;
  nfeNumero?: string;
  tipoCarga?: string;
  selfieCapturada: boolean;
  fotoUrl?: string;
  termoEpiAceito: boolean;
  horarioSubmissao: string;
  status: 'AGUARDANDO_PORTARIA' | 'DENTRO_DA_PLANTA' | 'SAIDA_REGISTRADA' | 'RECUSADO';
  horarioEntrada?: string;
  horarioSaida?: string;
  rfidProvisorio?: string;
}

export interface ConviteVisitante {
  id: string;
  token: string;
  nomeConvidado: string;
  telefone: string;
  empresa: string;
  tipo: 'VISITANTE' | 'MOTORISTA_CARGA' | 'PRESTADOR_SERVICO';
  anfitriao: string;
  setorDestino: string;
  validadeHoras: number;
  dataEnvio: string;
  placaPrevista?: string;
  status: 'PENDENTE' | 'PREENCHIDO' | 'APROVADO' | 'EXPIRADO';
}

// Componente de Código de Barras Code 128 Vetorial para Impressão Térmica
export const BarcodeSvg: React.FC<{ code: string; className?: string; isDark?: boolean }> = ({
  code,
  className = 'h-9 w-44',
  isDark = false
}) => {
  const bars = [
    2, 1, 3, 1, 1, 4, 1, 2, 2, 3, 1, 1, 3, 2, 1, 2, 1, 3, 2, 1, 4, 1, 1, 2,
    3, 1, 2, 2, 1, 3, 1, 2, 4, 1, 2, 1, 1, 3, 2, 2, 1, 4, 1, 1, 2, 3, 1, 2,
    2, 1, 3, 2, 1, 1, 4, 1, 2, 1, 3, 2
  ];
  const barColor = isDark ? '#10B981' : '#000000';

  let currentX = 4;
  return (
    <svg className={className} viewBox="0 0 160 46" fill="none">
      {bars.map((width, idx) => {
        const x = currentX;
        currentX += width + 1;
        if (idx % 2 === 0) {
          return <rect key={idx} x={x} y="2" width={width} height="30" fill={barColor} />;
        }
        return null;
      })}
      <text
        x="80"
        y="42"
        textAnchor="middle"
        fontSize="8.5"
        fontFamily="monospace"
        fontWeight="bold"
        fill={barColor}
        letterSpacing="2"
      >
        *{code}*
      </text>
    </svg>
  );
};

const INITIAL_CONVITES: ConviteVisitante[] = [
  {
    id: 'CNV-201',
    token: 'TK-8942-BR',
    nomeConvidado: 'José Aparecido Silva',
    telefone: '(11) 99812-4401',
    empresa: 'Metais Sul Brasil Ltda',
    tipo: 'MOTORISTA_CARGA',
    anfitriao: 'Juliana Costa (Portaria)',
    setorDestino: 'Portão Azul Nº 250 & Pátio Leste',
    validadeHoras: 24,
    dataEnvio: 'Hoje às 13:40',
    placaPrevista: 'ABC-1D23',
    status: 'APROVADO'
  },
  {
    id: 'CNV-202',
    token: 'TK-3310-SP',
    nomeConvidado: 'Eng. Ricardo Vasconcelos',
    telefone: '(47) 99104-2280',
    empresa: 'WEG Automação Industrial',
    tipo: 'PRESTADOR_SERVICO',
    anfitriao: 'Fernando Silva (Manutenção)',
    setorDestino: 'Subestação & Forno Indução',
    validadeHoras: 48,
    dataEnvio: 'Hoje às 14:02',
    status: 'PREENCHIDO'
  },
  {
    id: 'CNV-203',
    token: 'TK-7749-CG',
    nomeConvidado: 'Marcelo Antunes Ferraz',
    telefone: '(11) 98765-4321',
    empresa: 'CobreMinas Logística',
    tipo: 'MOTORISTA_CARGA',
    anfitriao: 'Marcos Rocha (Logística)',
    setorDestino: 'Doca de Carga & Balança',
    validadeHoras: 24,
    dataEnvio: 'Hoje às 14:15',
    placaPrevista: 'GHJ-8812',
    status: 'PENDENTE'
  },
  {
    id: 'CNV-204',
    token: 'TK-9014-MG',
    nomeConvidado: 'Dra. Vanessa Meireles',
    telefone: '(31) 97123-8899',
    empresa: 'Auditoria Externa Bureau Veritas',
    tipo: 'VISITANTE',
    anfitriao: 'Diretoria Industrial',
    setorDestino: 'Sede Administrativa (Quadra Oeste)',
    validadeHoras: 72,
    dataEnvio: 'Hoje às 14:20',
    status: 'PENDENTE'
  }
];

interface AccessControlScreenProps {
  funcionarios: FuncionarioProdutividade[];
  acessos: RegistroAcesso[];
  voiceEnabled: boolean;
  activeFunctionId?: string;
  onSelectFunction?: (functionId: string) => void;
}

const INITIAL_BIOMETRIA_FUNCIONARIOS: FuncionarioBiometria[] = [
  {
    id: 'FUNC-01',
    nome: 'Carlos Eduardo Mendes',
    cpf: '348.***.***-12',
    matricula: 'MAT-1042',
    cargo: 'Operador Mestre de Forno',
    setor: 'Fundição',
    turno: 'Turno A (06h-14h)',
    rfidTag: 'RFID-8841A',
    facialCadastrada: true,
    facialHash: 'FACE-994A-882F-C10E',
    facialScore: 99.8,
    dataCadastroFacial: '10/09/2026',
    acessoCofreAutorizado: true,
    presenteNaPlanta: true,
    ultimaCatraca: '05:54 • Catraca Facial #01',
    avatarIniciais: 'CE',
  },
  {
    id: 'FUNC-02',
    nome: 'Roberto Almeida',
    cpf: '219.***.***-45',
    matricula: 'MAT-1089',
    cargo: 'Operador de Prensa & Tesoura',
    setor: 'Pátio de Sucatas',
    turno: 'Turno A (06h-14h)',
    rfidTag: 'RFID-7712B',
    facialCadastrada: true,
    facialHash: 'FACE-441B-309D-A772',
    facialScore: 99.4,
    dataCadastroFacial: '14/09/2026',
    acessoCofreAutorizado: false,
    presenteNaPlanta: true,
    ultimaCatraca: '05:57 • Catraca Facial #02',
    avatarIniciais: 'RA',
  },
  {
    id: 'FUNC-03',
    nome: 'Marcos Vinícius Rocha',
    cpf: '412.***.***-88',
    matricula: 'MAT-1104',
    cargo: 'Operador de Empilhadeira',
    setor: 'Logística',
    turno: 'Turno A (06h-14h)',
    rfidTag: 'RFID-6590C',
    facialCadastrada: true,
    facialHash: 'FACE-782C-194E-B310',
    facialScore: 99.1,
    dataCadastroFacial: '18/09/2026',
    acessoCofreAutorizado: true,
    presenteNaPlanta: true,
    ultimaCatraca: '05:50 • Catraca Facial #01',
    avatarIniciais: 'MV',
  },
  {
    id: 'FUNC-04',
    nome: 'Juliana Costa',
    cpf: '529.***.***-04',
    matricula: 'MAT-1128',
    cargo: 'Inspetora de Portaria & Controle LPR',
    setor: 'Portaria & Segurança',
    turno: 'Turno A (06h-14h)',
    rfidTag: 'RFID-3319D',
    facialCadastrada: true,
    facialHash: 'FACE-553D-902A-F411',
    facialScore: 99.9,
    dataCadastroFacial: '20/09/2026',
    acessoCofreAutorizado: false,
    presenteNaPlanta: true,
    ultimaCatraca: '05:48 • Catraca Facial #01',
    avatarIniciais: 'JC',
  },
  {
    id: 'FUNC-05',
    nome: 'Fernando Silva',
    cpf: '187.***.***-63',
    matricula: 'MAT-1155',
    cargo: 'Técnico Eletromecânico',
    setor: 'Manutenção',
    turno: 'Turno A (06h-14h)',
    rfidTag: 'RFID-9012E',
    facialCadastrada: false,
    acessoCofreAutorizado: false,
    presenteNaPlanta: true,
    ultimaCatraca: '06:04 • Liberação Crachá RFID',
    avatarIniciais: 'FS',
  },
];

const INITIAL_VISITANTES: PreCadastroVisitante[] = [
  {
    id: 'VIS-101',
    tokenLink: 'TK-8942-BR',
    nome: 'José Aparecido Silva',
    cpf: '145.882.910-30',
    empresa: 'Metais Sul Brasil Ltda',
    telefone: '(11) 99812-4401',
    tipo: 'MOTORISTA_CARGA',
    anfitriao: 'Juliana Costa (Portaria)',
    setorDestino: 'Portão Azul Nº 250 & Pátio Leste',
    placaVeiculo: 'ABC-1D23',
    placaCarreta: 'PRT-8821',
    nfeNumero: 'NF-e 004.892',
    tipoCarga: 'Sucata de Cobre Mista (28.400 kg)',
    selfieCapturada: true,
    termoEpiAceito: true,
    horarioSubmissao: '14:05',
    status: 'DENTRO_DA_PLANTA',
    horarioEntrada: '14:12',
    rfidProvisorio: 'RFID-TEMP-01',
  },
  {
    id: 'VIS-102',
    tokenLink: 'TK-3310-SP',
    nome: 'Eng. Ricardo Vasconcelos',
    cpf: '298.441.008-15',
    empresa: 'WEG Automação Industrial',
    telefone: '(47) 99104-2280',
    tipo: 'PRESTADOR_SERVICO',
    anfitriao: 'Fernando Silva (Manutenção)',
    setorDestino: 'Subestação & Forno Indução',
    placaVeiculo: 'QWE-9A88',
    selfieCapturada: true,
    termoEpiAceito: true,
    horarioSubmissao: '14:18',
    status: 'AGUARDANDO_PORTARIA',
  },
  {
    id: 'VIS-103',
    tokenLink: 'TK-5521-MG',
    nome: 'Claudio Roberto Nogueira',
    cpf: '334.112.509-02',
    empresa: 'TransLog Cobre Express',
    telefone: '(31) 98765-1122',
    tipo: 'MOTORISTA_CARGA',
    anfitriao: 'Juliana Costa (Portaria)',
    setorDestino: 'Doca de Carga & Balança',
    placaVeiculo: 'GHT-7B14',
    placaCarreta: 'MGT-9940',
    nfeNumero: 'NF-e 009.114',
    tipoCarga: 'Bobinas de Vergalhão de Cobre',
    selfieCapturada: true,
    termoEpiAceito: true,
    horarioSubmissao: '14:22',
    status: 'AGUARDANDO_PORTARIA',
  }
];

export const AccessControlScreen: React.FC<AccessControlScreenProps> = ({
  voiceEnabled,
  activeFunctionId = 'catracas-ao-vivo',
  onSelectFunction
}) => {
  // Sincronização do modo direto com a Sidebar de Funções do ERP
  const currentMode = activeFunctionId || 'catracas-ao-vivo';

  const [listaFuncionarios, setListaFuncionarios] = useState<FuncionarioBiometria[]>(INITIAL_BIOMETRIA_FUNCIONARIOS);
  const [listaVisitantes, setListaVisitantes] = useState<PreCadastroVisitante[]>(INITIAL_VISITANTES);
  const [filtroPresenca, setFiltroPresenca] = useState<'TODOS' | 'FUNCIONARIOS' | 'VISITANTES'>('TODOS');
  const [feedbackBanner, setFeedbackBanner] = useState<string | null>(null);

  // =========================================================================
  // NOVO: CADASTRO COMPLETO DE VISITANTES / MOTORISTAS NA PORTARIA
  // =========================================================================
  const [showDirectCadModal, setShowDirectCadModal] = useState(false);
  const [cadTipo, setCadTipo] = useState<'MOTORISTA_CARGA' | 'VISITANTE' | 'PRESTADOR_SERVICO'>('MOTORISTA_CARGA');
  const [cadNome, setCadNome] = useState('');
  const [cadCpf, setCadCpf] = useState('');
  const [cadEmpresa, setCadEmpresa] = useState('');
  const [cadTelefone, setCadTelefone] = useState('');
  const [cadPlaca, setCadPlaca] = useState('');
  const [cadPlacaCarreta, setCadPlacaCarreta] = useState('');
  const [cadNfe, setCadNfe] = useState('');
  const [cadTipoCarga, setCadTipoCarga] = useState('Sucata de Cobre Mista');
  const [cadAnfitriao, setCadAnfitriao] = useState('Juliana Costa (Portaria)');
  const [cadSetor, setCadSetor] = useState('Portão Azul Nº 250 & Pátio Leste');
  const [cadTermoEpi, setCadTermoEpi] = useState(true);
  const [cadFotoCapturada, setCadFotoCapturada] = useState(false);
  const [cadEntradaImediata, setCadEntradaImediata] = useState(true);

  // Modal de Crachá / Credencial de Alta Segurança
  const [selectedVisitorForBadge, setSelectedVisitorForBadge] = useState<PreCadastroVisitante | null>(null);

  // Busca e Filtros na Lista de Visitantes
  const [searchVisitante, setSearchVisitante] = useState('');
  const [filtroTipoVis, setFiltroTipoVis] = useState<'TODOS' | 'MOTORISTA_CARGA' | 'VISITANTE' | 'PRESTADOR_SERVICO'>('TODOS');
  const [filtroStatusVis, setFiltroStatusVis] = useState<'TODOS' | 'AGUARDANDO_PORTARIA' | 'DENTRO_DA_PLANTA' | 'SAIDA_REGISTRADA'>('TODOS');

  // Estados: Drawer do Celular Simulado do Visitante
  const [showMobileDrawer, setShowMobileDrawer] = useState(false);

  // Estados: Cadastro de Funcionário + Scanner Biométrico Facial 3D
  const [selectedFuncForFacial, setSelectedFuncForFacial] = useState<FuncionarioBiometria>(listaFuncionarios[0]);
  const [showNovoFuncModal, setShowNovoFuncModal] = useState(false);
  const [novoFuncNome, setNovoFuncNome] = useState('');
  const [novoFuncCpf, setNovoFuncCpf] = useState('');
  const [novoFuncCargo, setNovoFuncCargo] = useState('');
  const [novoFuncSetor, setNovoFuncSetor] = useState<FuncionarioBiometria['setor']>('Pátio de Sucatas');
  const [novoFuncCofre, setNovoFuncCofre] = useState(false);

  const [scanningProgress, setScanningProgress] = useState<number>(0);
  const [isScanningFace, setIsScanningFace] = useState(false);
  const [useRealWebcam, setUseRealWebcam] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Simulador de Catraca Facial na Portaria
  const [catracaTestResult, setCatracaTestResult] = useState<{
    nome: string;
    cargo: string;
    score: number;
    status: 'APROVADO' | 'NEGADO';
    msg: string;
  } | null>(null);

  // Sub-aba dentro de 'visitantes-convites'
  const [subviewVisitantes, setSubviewVisitantes] = useState<'FILA_PORTARIA' | 'CONVITES_LINKS'>('FILA_PORTARIA');

  // Gestão de Convites & Links WhatsApp
  const [listaConvites, setListaConvites] = useState<ConviteVisitante[]>(INITIAL_CONVITES);
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Form State para Novo Convite / Link
  const [invNome, setInvNome] = useState('');
  const [invTelefone, setInvTelefone] = useState('');
  const [invEmpresa, setInvEmpresa] = useState('');
  const [invTipo, setInvTipo] = useState<PreCadastroVisitante['tipo']>('MOTORISTA_CARGA');
  const [invAnfitriao, setInvAnfitriao] = useState('Juliana Costa (Portaria)');
  const [invSetor, setInvSetor] = useState('Portão Azul Nº 250 & Pátio Leste');
  const [invValidadeHoras, setInvValidadeHoras] = useState(24);
  const [invPlaca, setInvPlaca] = useState('');

  // Configuração Avançada do Crachá com Foco em Impressão Térmica / PVC
  const [badgeViewMode, setBadgeViewMode] = useState<'PRINT_THERMAL' | 'TACTICAL_DARK'>('PRINT_THERMAL');
  const [badgePrintFormat, setBadgePrintFormat] = useState<'ZEBRA_100X60' | 'PVC_CR80' | 'A4_PROTOCOLO'>('ZEBRA_100X60');

  // Estados: Gerador de Link & Convite
  const [conviteTipo, setConviteTipo] = useState<PreCadastroVisitante['tipo']>('VISITANTE');
  const [conviteAnfitriao, setConviteAnfitriao] = useState('Juliana Costa (Portaria)');
  const [conviteSetor, setConviteSetor] = useState('Administrativo & Pátio');
  const [generatedToken, setGeneratedToken] = useState('TK-7749-CG');
  const [linkCopied, setLinkCopied] = useState(false);

  // Formulário dentro do Celular Simulado do Visitante
  const [mobNome, setMobNome] = useState('');
  const [mobCpf, setMobCpf] = useState('');
  const [mobEmpresa, setMobEmpresa] = useState('');
  const [mobTelefone, setMobTelefone] = useState('');
  const [mobPlaca, setMobPlaca] = useState('');
  const [mobNfe, setMobNfe] = useState('');
  const [mobSelfieDone, setMobSelfieDone] = useState(false);

  const showNotice = (msg: string) => {
    setFeedbackBanner(msg);
    setTimeout(() => setFeedbackBanner(null), 4500);
  };

  // Controle de Webcam Real (opcional) para Captura Facial
  useEffect(() => {
    let stream: MediaStream | null = null;
    if (useRealWebcam && videoRef.current) {
      navigator.mediaDevices
        ?.getUserMedia({ video: { width: 480, height: 480, facingMode: 'user' } })
        .then(s => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
          }
        })
        .catch(() => {
          setUseRealWebcam(false);
          showNotice('Webcam não encontrada ou sem permissão — usando Scanner Biométrico 3D Virtual.');
        });
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
    };
  }, [useRealWebcam]);

  // Iniciar Escaneamento Biométrico Facial (128 pontos)
  const handleStartFacialScan = (targetFunc: FuncionarioBiometria) => {
    setIsScanningFace(true);
    setScanningProgress(0);
    soundAndVoice.playAlertSound('beep');

    let p = 0;
    const interval = setInterval(() => {
      p += 20;
      setScanningProgress(p);
      if (p >= 100) {
        clearInterval(interval);
        setIsScanningFace(false);
        const hash = `FACE-${Math.random().toString(16).substring(2, 6).toUpperCase()}-${Math.random()
          .toString(16)
          .substring(2, 6)
          .toUpperCase()}`;
        const score = 99.8;
        const now = new Date().toLocaleDateString('pt-BR');

        setListaFuncionarios(prev =>
          prev.map(f =>
            f.id === targetFunc.id
              ? {
                  ...f,
                  facialCadastrada: true,
                  facialHash: hash,
                  facialScore: score,
                  dataCadastroFacial: now,
                }
              : f
          )
        );
        setSelectedFuncForFacial(prev => ({
          ...prev,
          facialCadastrada: true,
          facialHash: hash,
          facialScore: score,
          dataCadastroFacial: now,
        }));

        soundAndVoice.playAlertSound('critical');
        if (voiceEnabled) {
          soundAndVoice.speakAlert(`Biometria facial 3D de ${targetFunc.nome} cadastrada e sincronizada nas catracas com 99.8% de precisão.`);
        }
        showNotice(`Biometria 3D de ${targetFunc.nome} validada com sucesso!`);
      }
    }, 400);
  };

  // Criar Novo Funcionário
  const handleCreateFuncionario = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoFuncNome.trim()) return;

    const initials = novoFuncNome
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(w => w[0].toUpperCase())
      .join('');

    const newId = `FUNC-0${listaFuncionarios.length + 1}`;
    const novo: FuncionarioBiometria = {
      id: newId,
      nome: novoFuncNome,
      cpf: novoFuncCpf || '000.000.000-00',
      matricula: `MAT-${1200 + listaFuncionarios.length}`,
      cargo: novoFuncCargo || 'Operador Industrial',
      setor: novoFuncSetor,
      turno: 'Turno A (06h-14h)',
      rfidTag: `RFID-${Math.floor(1000 + Math.random() * 9000)}X`,
      facialCadastrada: false,
      acessoCofreAutorizado: novoFuncCofre,
      presenteNaPlanta: true,
      avatarIniciais: initials || 'CO',
    };

    setListaFuncionarios(prev => [novo, ...prev]);
    setSelectedFuncForFacial(novo);
    setShowNovoFuncModal(false);
    setNovoFuncNome('');
    setNovoFuncCpf('');
    setNovoFuncCargo('');
    setNovoFuncCofre(false);
    soundAndVoice.playAlertSound('beep');
    showNotice(`Funcionário ${novo.nome} criado. Realize agora o escaneamento facial 3D.`);
  };

  // Testar Passagem na Catraca Facial
  const handleSimulateCatracaPass = (func: FuncionarioBiometria) => {
    if (!func.facialCadastrada) {
      soundAndVoice.playAlertSound('warning');
      setCatracaTestResult({
        nome: func.nome,
        cargo: func.cargo,
        score: 0,
        status: 'NEGADO',
        msg: 'CATRACA BLOQUEADA: Colaborador sem Biometria Facial 3D cadastrada.',
      });
      if (voiceEnabled) {
        soundAndVoice.speakAlert(`Acesso negado na catraca para ${func.nome}. Biometria facial pendente.`);
      }
      return;
    }

    soundAndVoice.playAlertSound('beep');
    setCatracaTestResult({
      nome: func.nome,
      cargo: func.cargo,
      score: func.facialScore || 99.8,
      status: 'APROVADO',
      msg: `CATRACA LIBERADA EM 0.2s • Tag ${func.rfidTag} validada para o setor ${func.setor}.`,
    });
    setListaFuncionarios(prev =>
      prev.map(f =>
        f.id === func.id
          ? { ...f, presenteNaPlanta: true, ultimaCatraca: 'Agora • Catraca Facial #01' }
          : f
      )
    );
    if (voiceEnabled) {
      soundAndVoice.speakAlert(`Acesso autorizado em zero ponto dois segundos para ${func.nome}.`);
    }
  };

  // Submissão do Cadastro Direto da Portaria (Balcão)
  const handleDirectVisitorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cadNome.trim()) return;

    const newId = `VIS-${Math.floor(100 + Math.random() * 900)}`;
    const rfidCode = cadEntradaImediata ? `RFID-VIS-0${Math.floor(10 + Math.random() * 89)}` : undefined;
    const nowTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const novo: PreCadastroVisitante = {
      id: newId,
      tokenLink: `TK-${Math.floor(1000 + Math.random() * 9000)}-DIR`,
      nome: cadNome.trim(),
      cpf: cadCpf.trim() || '000.000.000-00',
      empresa: cadEmpresa.trim() || (cadTipo === 'MOTORISTA_CARGA' ? 'Transportadora Rodoviária' : 'Visita Comercial'),
      telefone: cadTelefone.trim() || '(11) 98888-0000',
      tipo: cadTipo,
      anfitriao: cadAnfitriao,
      setorDestino: cadSetor,
      placaVeiculo: cadPlaca.trim() ? cadPlaca.trim().toUpperCase() : undefined,
      placaCarreta: cadPlacaCarreta.trim() ? cadPlacaCarreta.trim().toUpperCase() : undefined,
      nfeNumero: cadNfe.trim() || undefined,
      tipoCarga: cadTipo === 'MOTORISTA_CARGA' ? cadTipoCarga : undefined,
      selfieCapturada: cadFotoCapturada,
      termoEpiAceito: cadTermoEpi,
      horarioSubmissao: nowTime,
      status: cadEntradaImediata ? 'DENTRO_DA_PLANTA' : 'AGUARDANDO_PORTARIA',
      horarioEntrada: cadEntradaImediata ? nowTime : undefined,
      rfidProvisorio: rfidCode
    };

    setListaVisitantes(prev => [novo, ...prev]);
    setShowDirectCadModal(false);

    // Limpa formulário
    setCadNome('');
    setCadCpf('');
    setCadEmpresa('');
    setCadTelefone('');
    setCadPlaca('');
    setCadPlacaCarreta('');
    setCadNfe('');
    setCadFotoCapturada(false);

    soundAndVoice.playAlertSound('beep');
    if (voiceEnabled) {
      soundAndVoice.speakAlert(
        cadEntradaImediata
          ? `Visitante ${novo.nome} cadastrado e liberado na portaria com crachá ${rfidCode}.`
          : `Visitante ${novo.nome} cadastrado na fila da portaria.`
      );
    }
    showNotice(
      cadEntradaImediata
        ? `Cadastro concluído! ${novo.nome} liberado com crachá ${rfidCode}`
        : `Pré-cadastro de ${novo.nome} adicionado à fila da portaria.`
    );
  };

  // Aprovação Expressa em 1 clique na Portaria (com emissão de RFID provisório)
  const handleAprovarVisitante = (visId: string) => {
    const target = listaVisitantes.find(v => v.id === visId);
    if (!target) return;

    const rfidCode = `RFID-VIS-0${Math.floor(10 + Math.random() * 89)}`;
    setListaVisitantes(prev =>
      prev.map(v =>
        v.id === visId
          ? {
              ...v,
              status: 'DENTRO_DA_PLANTA',
              horarioEntrada: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
              rfidProvisorio: rfidCode,
            }
          : v
      )
    );
    soundAndVoice.playAlertSound('beep');
    if (voiceEnabled) {
      soundAndVoice.speakAlert(
        `Acesso liberado na portaria para ${target.nome}, da empresa ${target.empresa}. Crachá RFID provisório ${rfidCode} vinculado.`
      );
    }
    showNotice(`Entrada liberada para ${target.nome} com crachá ${rfidCode}`);
  };

  // Registrar Saída (Check-Out) de Visitante
  const handleCheckoutVisitante = (visId: string) => {
    const target = listaVisitantes.find(v => v.id === visId);
    if (!target) return;

    setListaVisitantes(prev =>
      prev.map(v =>
        v.id === visId
          ? {
              ...v,
              status: 'SAIDA_REGISTRADA',
              horarioSaida: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            }
          : v
      )
    );
    soundAndVoice.playAlertSound('beep');
    if (voiceEnabled) {
      soundAndVoice.speakAlert(`Saída registrada para ${target.nome}. Crachá provisório liberado.`);
    }
    showNotice(`Check-out concluído para ${target.nome}`);
  };

  // Gerar Novo Token / Link
  const handleGerarNovoToken = () => {
    const r = Math.floor(1000 + Math.random() * 9000);
    setGeneratedToken(`TK-${r}-CG`);
    setLinkCopied(false);
    soundAndVoice.playAlertSound('beep');
  };

  // Copiar Link
  const handleCopyLink = () => {
    const link = `https://copperguard.ind.br/checkin/${generatedToken}`;
    navigator.clipboard?.writeText(link);
    setLinkCopied(true);
    soundAndVoice.playAlertSound('beep');
    showNotice('Link copiado para a área de transferência! Envie via WhatsApp.');
    setTimeout(() => setLinkCopied(false), 3000);
  };

  // Submissão de Novo Convite / Link WhatsApp
  const handleCreateInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invNome.trim()) return;

    const token = `TK-${Math.floor(1000 + Math.random() * 9000)}-CG`;
    const nowTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const newInvite: ConviteVisitante = {
      id: `CNV-${Math.floor(300 + Math.random() * 700)}`,
      token,
      nomeConvidado: invNome.trim(),
      telefone: invTelefone.trim() || '(11) 99999-9999',
      empresa: invEmpresa.trim() || (invTipo === 'MOTORISTA_CARGA' ? 'Transportadora Rodoviária' : 'Visita Comercial'),
      tipo: invTipo,
      anfitriao: invAnfitriao,
      setorDestino: invSetor,
      validadeHoras: invValidadeHoras,
      dataEnvio: `Hoje às ${nowTime}`,
      placaPrevista: invPlaca.trim() ? invPlaca.trim().toUpperCase() : undefined,
      status: 'PENDENTE'
    };

    setListaConvites(prev => [newInvite, ...prev]);
    setShowInviteModal(false);

    // Limpa campos
    setInvNome('');
    setInvTelefone('');
    setInvEmpresa('');
    setInvPlaca('');

    soundAndVoice.playAlertSound('beep');
    if (voiceEnabled) {
      soundAndVoice.speakAlert(`Link de auto-check-in gerado para ${newInvite.nomeConvidado}. Convite pronto para envio.`);
    }
    showNotice(`Convite ${token} gerado com sucesso!`);
  };

  // Disparo Imediato via WhatsApp
  const handleSendWhatsAppInvite = (inv: ConviteVisitante) => {
    soundAndVoice.playAlertSound('beep');
    const msg = `*COPPERGUARD • CONVITE DE ACESSO INDUSTRIAL*\n` +
      `Metalúrgica do Cobre S/A\n\n` +
      `Olá, *${inv.nomeConvidado}*!\n\n` +
      `Você foi autorizado para acessar nossa planta industrial:\n` +
      `🏭 *Destino:* ${inv.setorDestino}\n` +
      `👤 *Anfitrião:* ${inv.anfitriao}\n` +
      `⏳ *Validade do Token:* ${inv.validadeHoras} horas\n\n` +
      `Para evitar filas na guarita e na balança de caminhões (Portão 250), faça seu pré-cadastro com antecedência:\n` +
      `👉 https://copperguard.ind.br/checkin/${inv.token}\n\n` +
      `Ao chegar, seu crachá e liberação de entrada já estarão adiantados!`;

    const phoneClean = inv.telefone.replace(/\D/g, '');
    const url = phoneClean.length >= 10
      ? `https://wa.me/55${phoneClean}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
    showNotice(`Abrindo WhatsApp para enviar convite a ${inv.nomeConvidado}...`);
  };

  // Carregar dados no Simulador Mobile
  const handleOpenSimulatorForInvite = (inv: ConviteVisitante) => {
    setGeneratedToken(inv.token);
    setMobNome(inv.nomeConvidado);
    setMobEmpresa(inv.empresa);
    setMobTelefone(inv.telefone);
    setMobPlaca(inv.placaPrevista || '');
    setConviteTipo(inv.tipo);
    setConviteAnfitriao(inv.anfitriao);
    setConviteSetor(inv.setorDestino);
    setShowMobileDrawer(true);
    soundAndVoice.playAlertSound('beep');
    showNotice(`Abrindo Portal Mobile com os dados de ${inv.nomeConvidado}`);
  };

  // Impressão Especializada do Crachá (Zebra / Térmica / PVC)
  const handlePrintBadge = () => {
    setBadgeViewMode('PRINT_THERMAL');
    soundAndVoice.playAlertSound('beep');
    showNotice('Enviando crachá para a impressora térmica...');
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // Compartilhar Credencial do Visitante via WhatsApp
  const handleShareBadgeWhatsApp = (visitor: PreCadastroVisitante) => {
    soundAndVoice.playAlertSound('beep');
    const msg = `*COPPERGUARD - CREDENCIAL DE ACESSO*\n` +
      `Metalúrgica do Cobre S/A • Portão 250\n\n` +
      `Nome: *${visitor.nome}*\n` +
      `Empresa: *${visitor.empresa}*\n` +
      `Documento: ${visitor.cpf}\n` +
      `${visitor.placaVeiculo ? `Veículo: *${visitor.placaVeiculo}*\n` : ''}` +
      `Setor Autorizado: *${visitor.setorDestino}*\n` +
      `Crachá RFID: *${visitor.rfidProvisorio || 'Aguardando liberação'}*\n` +
      `Validade: 24 horas\n\n` +
      `Apresente esta credencial na guarita/balança para acesso.`;

    const phoneClean = visitor.telefone.replace(/\D/g, '');
    const url = phoneClean.length >= 10
      ? `https://wa.me/55${phoneClean}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
    showNotice(`Disparando credencial via WhatsApp para ${visitor.nome}...`);
  };

  // Copiar Dados da Credencial para Área de Transferência
  const handleCopyBadgeText = (visitor: PreCadastroVisitante) => {
    const text = `CREDENCIAL COPPERGUARD • ${visitor.nome} (${visitor.empresa}) • Token: ${visitor.tokenLink} • RFID: ${visitor.rfidProvisorio || 'TEMP'} • Setor: ${visitor.setorDestino}`;
    navigator.clipboard?.writeText(text);
    soundAndVoice.playAlertSound('beep');
    showNotice('Credencial copiada para a área de transferência!');
  };

  // Submissão do Celular Simulado do Visitante
  const handleMobileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mobNome.trim()) return;

    const novoVis: PreCadastroVisitante = {
      id: `VIS-${Math.floor(200 + Math.random() * 800)}`,
      tokenLink: generatedToken,
      nome: mobNome.trim(),
      cpf: mobCpf.trim() || '123.456.789-00',
      empresa: mobEmpresa.trim() || 'Transportes Cobre S/A',
      telefone: mobTelefone.trim() || '(11) 98877-6655',
      tipo: conviteTipo,
      anfitriao: conviteAnfitriao,
      setorDestino: conviteSetor,
      placaVeiculo: mobPlaca.trim() ? mobPlaca.trim().toUpperCase() : undefined,
      nfeNumero: mobNfe.trim() || undefined,
      selfieCapturada: true,
      termoEpiAceito: true,
      horarioSubmissao: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      status: 'AGUARDANDO_PORTARIA',
    };

    // Atualiza status do convite correspondente
    setListaConvites(prev =>
      prev.map(c => (c.token === generatedToken ? { ...c, status: 'PREENCHIDO' } : c))
    );

    setListaVisitantes(prev => [novoVis, ...prev]);
    setShowMobileDrawer(false);
    soundAndVoice.playAlertSound('beep');
    if (voiceEnabled) {
      soundAndVoice.speakAlert(
        `Novo pré-cadastro recebido via link web. Visitante ${novoVis.nome}, aguardando aprovação na portaria.`
      );
    }
    showNotice(`Pré-cadastro de ${novoVis.nome} recebido via Link! Já está na fila da Portaria.`);
  };

  // Filtragem inteligente da lista de visitantes
  const filteredVisitantes = useMemo(() => {
    return listaVisitantes.filter(v => {
      const matchSearch = searchVisitante.trim() === '' ||
        v.nome.toLowerCase().includes(searchVisitante.toLowerCase()) ||
        v.cpf.toLowerCase().includes(searchVisitante.toLowerCase()) ||
        v.empresa.toLowerCase().includes(searchVisitante.toLowerCase()) ||
        (v.placaVeiculo && v.placaVeiculo.toLowerCase().includes(searchVisitante.toLowerCase())) ||
        (v.nfeNumero && v.nfeNumero.toLowerCase().includes(searchVisitante.toLowerCase()));

      const matchTipo = filtroTipoVis === 'TODOS' || v.tipo === filtroTipoVis;
      const matchStatus = filtroStatusVis === 'TODOS' || v.status === filtroStatusVis;

      return matchSearch && matchTipo && matchStatus;
    });
  }, [listaVisitantes, searchVisitante, filtroTipoVis, filtroStatusVis]);

  const totalPresentesFuncionarios = listaFuncionarios.filter(f => f.presenteNaPlanta).length;
  const totalPresentesVisitantes = listaVisitantes.filter(v => v.status === 'DENTRO_DA_PLANTA').length;
  const totalFilaAprovacao = listaVisitantes.filter(v => v.status === 'AGUARDANDO_PORTARIA').length;
  const totalFaciaisOk = listaFuncionarios.filter(f => f.facialCadastrada).length;

  return (
    <div className="w-full h-full bg-[#070F0B] p-2.5 sm:p-3 flex flex-col justify-between overflow-hidden select-none text-slate-100 font-sans">
      {/* Banner Flutuante de Confirmação */}
      {feedbackBanner && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 bg-[#0E1A14] backdrop-blur-md border border-emerald-500/40 text-emerald-300 px-4 py-2 rounded-xl text-xs font-mono shadow-2xl flex items-center space-x-2 animate-fadeIn pointer-events-none">
          <span className="w-2 h-2 rounded-full bg-[#00FF88] animate-pulse shrink-0" />
          <span>{feedbackBanner}</span>
        </div>
      )}

      {/* =====================================================================
          FUNÇÃO 1: CATRACAS & PORTARIA AO VIVO (DEFAULT)
         ===================================================================== */}
      {currentMode === 'catracas-ao-vivo' && (
        <div className="flex-1 min-h-0 grid grid-cols-12 gap-3 overflow-hidden">
          {/* COLUNA ESQUERDA (5 cols): FILA DE PRÉ-CHECKIN (APROVAÇÃO EXPRESSA) */}
          <div className="col-span-12 lg:col-span-5 bg-[#0A140F] border border-[#16291E] rounded-2xl p-3.5 flex flex-col justify-between overflow-hidden shadow-sm font-mono">
            <div className="flex-1 min-h-0 flex flex-col">
              <div className="flex items-center justify-between border-b border-[#16291E] pb-2.5 mb-2.5 shrink-0">
                <div className="flex items-center space-x-2">
                  <Smartphone className="w-4 h-4 text-amber-400" />
                  <span className="font-bold text-xs text-white uppercase tracking-wider">
                    Fila de Entrada • Guarita & Balança
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setShowDirectCadModal(true)}
                    className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                  >
                    <UserPlus className="w-3 h-3" />
                    <span>+ Cadastrar no Balcão</span>
                  </button>
                  {totalFilaAprovacao > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-400 text-black text-[10px] font-extrabold animate-pulse">
                      {totalFilaAprovacao}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto space-y-2.5 pr-1">
                {listaVisitantes.filter(v => v.status === 'AGUARDANDO_PORTARIA').length === 0 ? (
                  <div className="p-6 rounded-xl bg-[#070F0B] border border-[#16291E] text-center space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto opacity-80" />
                    <p className="text-xs text-gray-300 font-bold">
                      Fila livre no momento
                    </p>
                    <p className="text-[11px] text-gray-500">
                      Nenhum motorista ou visitante aguardando liberação na guarita.
                    </p>
                  </div>
                ) : (
                  listaVisitantes
                    .filter(v => v.status === 'AGUARDANDO_PORTARIA')
                    .map(vis => (
                      <div
                        key={vis.id}
                        className="p-3 rounded-xl bg-[#070F0B] border border-amber-500/40 space-y-2 shadow-sm"
                      >
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded bg-amber-400 text-black font-bold text-[9px] uppercase tracking-wider">
                            AGUARDANDO GUARITA • {vis.horarioSubmissao}
                          </span>
                          <span className="text-[10px] text-amber-300 font-bold">
                            {vis.tokenLink}
                          </span>
                        </div>

                        <div>
                          <h4 className="text-sm font-bold text-white font-sans">{vis.nome}</h4>
                          <p className="text-xs text-emerald-400">
                            {vis.empresa} • CPF: {vis.cpf}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-1 text-[10px] bg-[#0A140F] p-2 rounded-lg border border-[#16291E]">
                          <div>
                            <span className="text-gray-500 block text-[9px]">TIPO / VEÍCULO:</span>
                            <span className="text-gray-200">
                              {vis.tipo === 'MOTORISTA_CARGA' ? '🚛 Motorista' : vis.tipo === 'PRESTADOR_SERVICO' ? '🔧 Prestador' : '💼 Visitante'} {vis.placaVeiculo ? `(${vis.placaVeiculo})` : ''}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500 block text-[9px]">SETOR DESTINO:</span>
                            <span className="text-emerald-300 truncate block">{vis.setorDestino}</span>
                          </div>
                        </div>

                        {/* Botão de Aprovação Expressa em 1 Clique */}
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={() => handleAprovarVisitante(vis.id)}
                            className="flex-1 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-[0_0_12px_rgba(16,185,129,0.3)] cursor-pointer"
                          >
                            <BadgeCheck className="w-4 h-4 stroke-[2.2]" />
                            <span>Aprovar Entrada (Emitir RFID)</span>
                          </button>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>

            {/* Status Rápido no Rodapé */}
            <div className="pt-2.5 border-t border-[#16291E] flex items-center justify-between text-[11px] text-gray-400 shrink-0">
              <span>Portaria Nº 250 (Caminhões):</span>
              <span className="text-emerald-400 font-bold">Cancela LPR Sincronizada</span>
            </div>
          </div>

          {/* COLUNA DIREITA (7 cols): CATRACAS FACIAIS 3D + PRESENTES NA PLANTA */}
          <div className="col-span-12 lg:col-span-7 bg-[#0A140F] border border-[#16291E] rounded-2xl p-3.5 flex flex-col justify-between overflow-hidden shadow-sm font-mono">
            {/* Top Cards de Status das Catracas */}
            <div className="grid grid-cols-2 gap-2.5 pb-2.5 border-b border-[#16291E] shrink-0 text-xs">
              <div className="p-2.5 rounded-xl bg-[#070F0B] border border-[#16291E] flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ScanFace className="w-4 h-4 text-emerald-400" />
                  <div>
                    <span className="text-[10px] text-gray-500 uppercase block">Catracas Faciais 3D</span>
                    <span className="text-white font-bold text-xs">Reconhecimento 0.2s</span>
                  </div>
                </div>
                <span className="w-2 h-2 rounded-full bg-[#00FF88] animate-pulse" />
              </div>

              <div className="p-2.5 rounded-xl bg-[#070F0B] border border-[#16291E] flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Truck className="w-4 h-4 text-amber-400" />
                  <div>
                    <span className="text-[10px] text-gray-500 uppercase block">Cancela LPR Portão 250</span>
                    <span className="text-white font-bold text-xs">Placa: ABC-8E90</span>
                  </div>
                </div>
                <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 text-[9px] font-bold border border-emerald-800">
                  VERIFICADO
                </span>
              </div>
            </div>

            {/* Simulador Interativo de Passagem na Catraca */}
            <div className="my-2.5 p-3 rounded-xl bg-[#070F0B] border border-[#16291E] space-y-2 shrink-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase flex items-center gap-1.5">
                  <ScanFace className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Simular Reconhecimento Facial na Catraca</span>
                </span>
                <span className="text-[10px] text-gray-400">Pressione para testar catraca #01</span>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                {listaFuncionarios.slice(0, 4).map(func => (
                  <button
                    key={func.id}
                    onClick={() => handleSimulateCatracaPass(func)}
                    className="px-3 py-1.5 rounded-xl bg-[#0E1A14] hover:bg-[#16291E] border border-emerald-800/40 text-left shrink-0 transition-colors cursor-pointer"
                  >
                    <span className="text-xs font-bold text-white block">{func.nome.split(' ')[0]} {func.nome.split(' ')[1]}</span>
                    <span className="text-[9px] text-emerald-400 block">{func.cargo}</span>
                  </button>
                ))}
              </div>

              {catracaTestResult && (
                <div className={`p-2 rounded-lg text-[11px] font-bold flex items-center justify-between border ${
                  catracaTestResult.status === 'APROVADO'
                    ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300'
                    : 'bg-rose-950/60 border-rose-500 text-rose-300'
                }`}>
                  <span>{catracaTestResult.msg}</span>
                  <span>Score: {catracaTestResult.score}%</span>
                </div>
              )}
            </div>

            {/* Tabela de Presentes na Planta com Filtros */}
            <div className="flex-1 min-h-0 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-xs text-white uppercase">
                  Presentes na Planta ({totalPresentesFuncionarios + totalPresentesVisitantes})
                </span>
                <div className="flex items-center gap-1 text-[10px]">
                  <button
                    onClick={() => setFiltroPresenca('TODOS')}
                    className={`px-2 py-0.5 rounded-lg border ${
                      filtroPresenca === 'TODOS' ? 'bg-emerald-500 text-black font-bold border-emerald-500' : 'text-gray-400 border-[#16291E]'
                    }`}
                  >
                    Todos
                  </button>
                  <button
                    onClick={() => setFiltroPresenca('FUNCIONARIOS')}
                    className={`px-2 py-0.5 rounded-lg border ${
                      filtroPresenca === 'FUNCIONARIOS' ? 'bg-emerald-500 text-black font-bold border-emerald-500' : 'text-gray-400 border-[#16291E]'
                    }`}
                  >
                    Funcionários ({totalPresentesFuncionarios})
                  </button>
                  <button
                    onClick={() => setFiltroPresenca('VISITANTES')}
                    className={`px-2 py-0.5 rounded-lg border ${
                      filtroPresenca === 'VISITANTES' ? 'bg-emerald-500 text-black font-bold border-emerald-500' : 'text-gray-400 border-[#16291E]'
                    }`}
                  >
                    Visitantes ({totalPresentesVisitantes})
                  </button>
                </div>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto space-y-1.5 pr-1 text-xs">
                {/* Funcionários Presentes */}
                {(filtroPresenca === 'TODOS' || filtroPresenca === 'FUNCIONARIOS') &&
                  listaFuncionarios
                    .filter(f => f.presenteNaPlanta)
                    .map(f => (
                      <div
                        key={f.id}
                        className="p-2 rounded-xl bg-[#070F0B] border border-[#16291E] flex items-center justify-between text-gray-300"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-emerald-950 border border-emerald-800 text-emerald-400 font-bold flex items-center justify-center text-xs">
                            {f.avatarIniciais}
                          </div>
                          <div>
                            <span className="font-bold text-white block">{f.nome}</span>
                            <span className="text-[10px] text-gray-500">{f.cargo} • {f.setor}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-[10px]">
                          <span className="text-gray-400">{f.ultimaCatraca}</span>
                          <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 font-bold border border-emerald-800">
                            FACE 3D
                          </span>
                        </div>
                      </div>
                    ))}

                {/* Visitantes Presentes */}
                {(filtroPresenca === 'TODOS' || filtroPresenca === 'VISITANTES') &&
                  listaVisitantes
                    .filter(v => v.status === 'DENTRO_DA_PLANTA')
                    .map(v => (
                      <div
                        key={v.id}
                        className="p-2 rounded-xl bg-[#070F0B] border border-amber-900/40 flex items-center justify-between text-gray-300"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-amber-950 border border-amber-700 text-amber-300 font-bold flex items-center justify-center text-xs">
                            {v.tipo === 'MOTORISTA_CARGA' ? <Truck className="w-3.5 h-3.5" /> : <Smartphone className="w-3.5 h-3.5" />}
                          </div>
                          <div>
                            <span className="font-bold text-white block">{v.nome}</span>
                            <span className="text-[10px] text-amber-400">{v.empresa} • {v.setorDestino}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-[10px]">
                          <span className="text-emerald-400 font-bold">{v.rfidProvisorio}</span>
                          <button
                            onClick={() => setSelectedVisitorForBadge(v)}
                            className="px-2 py-0.5 rounded bg-[#0E1A14] border border-emerald-800/40 text-emerald-300 hover:text-white cursor-pointer"
                          >
                            Crachá
                          </button>
                          <button
                            onClick={() => handleCheckoutVisitante(v.id)}
                            className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 hover:bg-rose-900 font-bold border border-rose-800 cursor-pointer"
                          >
                            Dar Saída
                          </button>
                        </div>
                      </div>
                    ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          FUNÇÃO 2: COLABORADORES & SCANNER FACIAL 3D (COM WEBCAM / VIRTUAL)
         ===================================================================== */}
      {currentMode === 'colaboradores-facial' && (
        <div className="flex-1 min-h-0 grid grid-cols-12 gap-3 overflow-hidden font-mono">
          {/* COLUNA ESQUERDA (5 cols): LISTA DE COLABORADORES */}
          <div className="col-span-12 lg:col-span-5 bg-[#0A140F] border border-[#16291E] rounded-2xl p-3.5 flex flex-col justify-between overflow-hidden shadow-sm">
            <div className="flex-1 min-h-0 flex flex-col">
              <div className="flex items-center justify-between border-b border-[#16291E] pb-2.5 mb-2.5 shrink-0">
                <span className="font-bold text-xs text-white uppercase tracking-wider flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-400" />
                  <span>Quadro de Colaboradores ({totalFaciaisOk}/{listaFuncionarios.length} com Biometria)</span>
                </span>
                <button
                  onClick={() => setShowNovoFuncModal(true)}
                  className="px-2.5 py-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs flex items-center gap-1 cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Novo</span>
                </button>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-1 text-xs">
                {listaFuncionarios.map(func => {
                  const isSelected = selectedFuncForFacial.id === func.id;

                  return (
                    <div
                      key={func.id}
                      onClick={() => {
                        soundAndVoice.playAlertSound('beep');
                        setSelectedFuncForFacial(func);
                      }}
                      className={`p-3 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#0E1A14] border-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                          : 'bg-[#070F0B] border-[#16291E] text-gray-300 hover:border-emerald-500/40'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-white text-sm">{func.nome}</span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
                          func.facialCadastrada
                            ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                            : 'bg-amber-950 text-amber-300 border-amber-800 animate-pulse'
                        }`}>
                          {func.facialCadastrada ? 'FACIAL ATIVA (99.8%)' : 'BIOMETRIA PENDENTE'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-gray-400">
                        <span>{func.cargo} • {func.setor}</span>
                        <span className="text-emerald-400 font-bold">{func.matricula}</span>
                      </div>

                      <div className="mt-2 pt-2 border-t border-[#16291E] flex items-center justify-between text-[10px] text-gray-500">
                        <span>RFID: {func.rfidTag}</span>
                        <span>{func.acessoCofreAutorizado ? '🔒 Cofre Nível 3' : 'Acesso Geral'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* COLUNA DIREITA (7 cols): SCANNER BIOMÉTRICO FACIAL 3D */}
          <div className="col-span-12 lg:col-span-7 bg-[#0A140F] border border-[#16291E] rounded-2xl p-4 flex flex-col justify-between overflow-hidden shadow-sm">
            <div className="flex items-center justify-between border-b border-[#16291E] pb-2.5 shrink-0">
              <div className="flex items-center gap-2">
                <ScanFace className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="font-bold text-white text-sm uppercase">Scanner Biométrico Facial 3D (128 Pontos)</h3>
                  <p className="text-[10px] text-gray-400">Captura de vetor facial com malha tridimensional de alta precisão.</p>
                </div>
              </div>

              {/* Botão de Alternar Webcam Real vs. Virtual */}
              <button
                onClick={() => setUseRealWebcam(!useRealWebcam)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  useRealWebcam
                    ? 'bg-emerald-500 text-black border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                    : 'bg-[#070F0B] border-[#16291E] text-gray-300 hover:text-white'
                }`}
              >
                {useRealWebcam ? '📷 Webcam do PC Ativa' : '🤖 Usar Scanner Virtual'}
              </button>
            </div>

            {/* Canvas de Escaneamento Facial com Malha 3D Verde Esmeralda */}
            <div className="flex-1 min-h-[260px] my-3 rounded-2xl bg-black border border-[#16291E] relative overflow-hidden flex items-center justify-center">
              {useRealWebcam ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              ) : (
                /* Avatar Virtual Escaneável */
                <div className="relative w-48 h-48 rounded-full border-2 border-emerald-500/40 bg-emerald-950/20 flex items-center justify-center">
                  <ScanFace className="w-24 h-24 text-emerald-400/60" />
                </div>
              )}

              {/* Malha Holográfica de Reconhecimento 3D (128 Pontos Estilo CopperOS) */}
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                {/* Retículo de Alinhamento */}
                <div className="w-64 h-64 border-2 border-dashed border-emerald-500/50 rounded-3xl relative flex items-center justify-center">
                  <Crosshair className="w-8 h-8 text-emerald-400/80 animate-pulse" />

                  {/* Cantos Táticos */}
                  <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-[#00FF88]" />
                  <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-[#00FF88]" />
                  <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-[#00FF88]" />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-[#00FF88]" />

                  {/* Linha Laser de Varredura Vertical */}
                  {isScanningFace && (
                    <div className="absolute inset-x-0 h-1 bg-[#00FF88] shadow-[0_0_15px_#00FF88] animate-bounce" />
                  )}
                </div>

                {/* Telemetria dos Pontos Biométricos */}
                <div className="absolute bottom-3 inset-x-3 flex items-center justify-between text-[10px] font-mono bg-black/80 backdrop-blur-xs p-2 rounded-xl border border-white/10">
                  <span className="text-gray-400">ALVO: <strong className="text-white">{selectedFuncForFacial.nome}</strong></span>
                  <span className="text-emerald-400 font-bold">{isScanningFace ? `MAPEANDO: ${scanningProgress}%` : selectedFuncForFacial.facialCadastrada ? 'BIOMETRIA 3D VÁLIDA' : 'AGUARDANDO SCAN'}</span>
                  <span className="text-gray-400">HASH: <strong className="text-emerald-300">{selectedFuncForFacial.facialHash || 'PENDENTE'}</strong></span>
                </div>
              </div>
            </div>

            {/* Botão de Disparo do Escaneamento */}
            <div className="pt-2 border-t border-[#16291E] flex items-center justify-between gap-3 shrink-0">
              <div className="text-xs text-gray-400">
                <span>Colaborador Selecionado: </span>
                <strong className="text-emerald-400">{selectedFuncForFacial.nome}</strong>
              </div>

              <button
                disabled={isScanningFace}
                onClick={() => handleStartFacialScan(selectedFuncForFacial)}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all cursor-pointer disabled:opacity-50"
              >
                <ScanFace className="w-4 h-4 stroke-[2.5]" />
                <span>{isScanningFace ? `Escaneando Face (${scanningProgress}%)...` : 'Iniciar Escaneamento 3D'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          FUNÇÃO 3: FILA DE VISITANTES & CONVITES (SISTEMA DE CADASTRO INDUSTRIAL)
         ===================================================================== */}
      {currentMode === 'visitantes-convites' && (
        <div className="flex-1 min-h-0 flex flex-col gap-3 overflow-hidden font-mono">
          {/* Card Superior: Sub-abas de Navegação & Ações de Cadastro/Convites */}
          <div className="p-3 rounded-2xl bg-[#0A140F] border border-[#16291E] shadow-sm flex flex-col lg:flex-row items-center justify-between gap-3 shrink-0">
            {/* Sub-abas de Seleção */}
            <div className="flex items-center gap-1.5 p-1 bg-[#070F0B] border border-[#16291E] rounded-xl w-full lg:w-auto">
              <button
                onClick={() => setSubviewVisitantes('FILA_PORTARIA')}
                className={`flex-1 lg:flex-none px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  subviewVisitantes === 'FILA_PORTARIA'
                    ? 'bg-emerald-500 text-black shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Fila da Portaria & Presentes ({listaVisitantes.length})</span>
              </button>

              <button
                onClick={() => setSubviewVisitantes('CONVITES_LINKS')}
                className={`flex-1 lg:flex-none px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  subviewVisitantes === 'CONVITES_LINKS'
                    ? 'bg-emerald-500 text-black shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Link2 className="w-3.5 h-3.5" />
                <span>Links & Convites WhatsApp ({listaConvites.length})</span>
              </button>
            </div>

            {/* Ações Globais */}
            <div className="flex items-center flex-wrap gap-2 w-full lg:w-auto justify-end">
              <button
                onClick={() => setShowDirectCadModal(true)}
                className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs flex items-center gap-1.5 shadow-[0_0_12px_rgba(16,185,129,0.3)] transition-all cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>+ Cadastrar no Balcão</span>
              </button>

              <button
                onClick={() => setShowInviteModal(true)}
                className="px-3 py-1.5 rounded-xl bg-[#0E1A14] hover:bg-[#16291E] border border-emerald-500/50 text-emerald-300 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>+ Gerar Link / Convite WhatsApp</span>
              </button>

              <button
                onClick={() => setShowMobileDrawer(true)}
                className="px-3 py-1.5 rounded-xl bg-[#070F0B] hover:bg-[#0E1A14] border border-[#16291E] text-gray-300 hover:text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                <span>Portal Mobile</span>
              </button>
            </div>
          </div>

          {/* VISUALIZAÇÃO 1: FILA DE VISITANTES & MOTORISTAS NA PORTARIA */}
          {subviewVisitantes === 'FILA_PORTARIA' && (
            <div className="flex-1 min-h-0 rounded-2xl bg-[#0A140F] border border-[#16291E] p-3.5 flex flex-col overflow-hidden shadow-sm">
              {/* Barra de Filtros e Busca */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-[#16291E] pb-3 mb-3 shrink-0 text-xs">
                {/* Campo de Busca */}
                <div className="relative w-full sm:w-72 shrink-0">
                  <Search className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Buscar por nome, CPF, empresa, placa..."
                    value={searchVisitante}
                    onChange={e => setSearchVisitante(e.target.value)}
                    className="w-full pl-8 pr-7 py-1.5 bg-[#070F0B] border border-[#16291E] rounded-xl text-xs text-gray-200 placeholder-gray-600 outline-none focus:border-emerald-500/60"
                  />
                  {searchVisitante && (
                    <button onClick={() => setSearchVisitante('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white cursor-pointer">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Filtros por Tipo */}
                <div className="flex items-center gap-1.5 text-[11px] overflow-x-auto w-full sm:w-auto">
                  <button
                    onClick={() => setFiltroTipoVis('TODOS')}
                    className={`px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                      filtroTipoVis === 'TODOS' ? 'bg-emerald-500 text-black font-bold border-emerald-500' : 'bg-[#070F0B] text-gray-400 border-[#16291E]'
                    }`}
                  >
                    Todos ({listaVisitantes.length})
                  </button>
                  <button
                    onClick={() => setFiltroTipoVis('MOTORISTA_CARGA')}
                    className={`px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                      filtroTipoVis === 'MOTORISTA_CARGA' ? 'bg-emerald-500 text-black font-bold border-emerald-500' : 'bg-[#070F0B] text-gray-400 border-[#16291E]'
                    }`}
                  >
                    🚛 Motoristas
                  </button>
                  <button
                    onClick={() => setFiltroTipoVis('VISITANTE')}
                    className={`px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                      filtroTipoVis === 'VISITANTE' ? 'bg-emerald-500 text-black font-bold border-emerald-500' : 'bg-[#070F0B] text-gray-400 border-[#16291E]'
                    }`}
                  >
                    💼 Visitantes
                  </button>
                  <button
                    onClick={() => setFiltroTipoVis('PRESTADOR_SERVICO')}
                    className={`px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                      filtroTipoVis === 'PRESTADOR_SERVICO' ? 'bg-emerald-500 text-black font-bold border-emerald-500' : 'bg-[#070F0B] text-gray-400 border-[#16291E]'
                    }`}
                  >
                    🔧 Prestadores
                  </button>
                </div>
              </div>

              {/* Lista Executiva de Visitantes */}
              <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-1 text-xs">
                {filteredVisitantes.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    Nenhum visitante ou motorista encontrado com os filtros selecionados.
                  </div>
                ) : (
                  filteredVisitantes.map(vis => (
                    <div
                      key={vis.id}
                      className="p-3 rounded-xl bg-[#070F0B] border border-[#16291E] hover:border-emerald-500/40 flex flex-col md:flex-row md:items-center justify-between gap-3 text-gray-300 transition-all shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 flex items-center justify-center shrink-0">
                          {vis.tipo === 'MOTORISTA_CARGA' ? <Truck className="w-5 h-5" /> : vis.tipo === 'PRESTADOR_SERVICO' ? <KeyRound className="w-5 h-5" /> : <Users className="w-5 h-5" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm font-sans">{vis.nome}</span>
                            <span className="text-[10px] text-gray-400 font-mono">({vis.empresa})</span>
                          </div>
                          <div className="text-[11px] text-gray-400 flex items-center flex-wrap gap-2.5 mt-0.5">
                            <span>Doc: {vis.cpf}</span>
                            <span>•</span>
                            <span>Destino: <strong className="text-emerald-400">{vis.setorDestino}</strong></span>
                            <span>•</span>
                            <span>Anfitrião: <strong className="text-gray-300">{vis.anfitriao}</strong></span>
                            {vis.placaVeiculo && (
                              <>
                                <span>•</span>
                                <span className="text-amber-400 font-bold">Placa: {vis.placaVeiculo} {vis.placaCarreta ? `+ ${vis.placaCarreta}` : ''}</span>
                              </>
                            )}
                            {vis.nfeNumero && (
                              <>
                                <span>•</span>
                                <span className="text-emerald-300 font-mono">{vis.nfeNumero}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Status & Botões de Ação */}
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${
                          vis.status === 'AGUARDANDO_PORTARIA'
                            ? 'bg-amber-950/60 text-amber-300 border-amber-600 animate-pulse'
                            : vis.status === 'DENTRO_DA_PLANTA'
                            ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800'
                            : 'bg-gray-900 text-gray-400 border-gray-700'
                        }`}>
                          {vis.status === 'AGUARDANDO_PORTARIA' ? 'AGUARDANDO GUARITA' : vis.status === 'DENTRO_DA_PLANTA' ? 'PRESENTE NA FÁBRICA' : 'SAÍDA CONCLUÍDA'}
                        </span>

                        {/* Botão Ver Crachá Digital (Foco em Impressão) */}
                        <button
                          onClick={() => {
                            setBadgeViewMode('PRINT_THERMAL');
                            setSelectedVisitorForBadge(vis);
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-[#0E1A14] hover:bg-[#16291E] border border-emerald-700/50 text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                          title="Imprimir Crachá Térmico / Ver Credencial"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Crachá</span>
                        </button>

                        {/* Botão de Ação: Liberar Entrada */}
                        {vis.status === 'AGUARDANDO_PORTARIA' && (
                          <button
                            onClick={() => handleAprovarVisitante(vis.id)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs transition-colors shadow-[0_0_10px_rgba(16,185,129,0.2)] cursor-pointer"
                          >
                            Aprovar Entrada
                          </button>
                        )}

                        {/* Botão de Ação: Dar Saída */}
                        {vis.status === 'DENTRO_DA_PLANTA' && (
                          <button
                            onClick={() => handleCheckoutVisitante(vis.id)}
                            className="px-3 py-1.5 rounded-xl bg-rose-950 hover:bg-rose-900 text-rose-300 font-bold border border-rose-800 text-xs transition-colors cursor-pointer"
                          >
                            Dar Saída
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* VISUALIZAÇÃO 2: LINKS & CONVITES WHATSAPP ATIVOS */}
          {subviewVisitantes === 'CONVITES_LINKS' && (
            <div className="flex-1 min-h-0 rounded-2xl bg-[#0A140F] border border-[#16291E] p-3.5 flex flex-col overflow-hidden shadow-sm space-y-3">
              {/* Cards de Métricas de Links */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 shrink-0 text-xs">
                <div className="p-2.5 rounded-xl bg-[#070F0B] border border-[#16291E]">
                  <span className="text-[10px] text-gray-500 block uppercase">Links & Convites Emitidos</span>
                  <span className="text-white font-bold text-base">{listaConvites.length} links</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#070F0B] border border-cyan-800/40">
                  <span className="text-[10px] text-cyan-400 block uppercase">Pré-Cadastros Recebidos</span>
                  <span className="text-cyan-300 font-bold text-base">
                    {listaConvites.filter(c => c.status === 'PREENCHIDO' || c.status === 'APROVADO').length} concluídos
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#070F0B] border border-amber-800/40">
                  <span className="text-[10px] text-amber-400 block uppercase">Aguardando Visitante</span>
                  <span className="text-amber-300 font-bold text-base">
                    {listaConvites.filter(c => c.status === 'PENDENTE').length} pendentes
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#070F0B] border border-emerald-800/40">
                  <span className="text-[10px] text-emerald-400 block uppercase">Tempo Médio na Guarita</span>
                  <span className="text-emerald-400 font-bold text-base">45s (Express)</span>
                </div>
              </div>

              {/* Tabela de Links Gerados */}
              <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-1 text-xs">
                {listaConvites.map(inv => (
                  <div
                    key={inv.id}
                    className="p-3 rounded-xl bg-[#070F0B] border border-[#16291E] hover:border-emerald-500/40 flex flex-col md:flex-row md:items-center justify-between gap-3 text-gray-300 transition-all shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#0E1A14] border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
                        {inv.tipo === 'MOTORISTA_CARGA' ? <Truck className="w-5 h-5" /> : inv.tipo === 'PRESTADOR_SERVICO' ? <KeyRound className="w-5 h-5" /> : <Users className="w-5 h-5" />}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm font-sans">{inv.nomeConvidado}</span>
                          <span className="text-[11px] text-emerald-400 font-mono font-bold">📱 {inv.telefone}</span>
                        </div>
                        <div className="text-[11px] text-gray-400 flex items-center flex-wrap gap-2.5 mt-0.5">
                          <span>Empresa: <strong className="text-gray-200">{inv.empresa}</strong></span>
                          <span>•</span>
                          <span>Destino: <strong className="text-emerald-300">{inv.setorDestino}</strong></span>
                          <span>•</span>
                          <span>Anfitrião: <strong className="text-gray-300">{inv.anfitriao}</strong></span>
                          <span>•</span>
                          <span>Token: <strong className="text-amber-300 font-mono">{inv.token}</strong></span>
                          <span>•</span>
                          <span>Validade: {inv.validadeHoras}h</span>
                        </div>
                      </div>
                    </div>

                    {/* Status e Botões de Disparo */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${
                        inv.status === 'PENDENTE'
                          ? 'bg-amber-950/60 text-amber-300 border-amber-600'
                          : inv.status === 'PREENCHIDO'
                          ? 'bg-cyan-950/60 text-cyan-300 border-cyan-600 animate-pulse'
                          : 'bg-emerald-950/60 text-emerald-400 border-emerald-800'
                      }`}>
                        {inv.status === 'PENDENTE'
                          ? 'AGUARDANDO VISITANTE'
                          : inv.status === 'PREENCHIDO'
                          ? 'PRÉ-CADASTRO RECEBIDO'
                          : 'ENTRADA LIBERADA'}
                      </span>

                      {/* Botão de Disparo WhatsApp */}
                      <button
                        onClick={() => handleSendWhatsAppInvite(inv)}
                        className="px-2.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold flex items-center gap-1.5 transition-colors shadow-[0_0_10px_rgba(16,185,129,0.2)] cursor-pointer"
                        title="Abrir WhatsApp com mensagem pronta"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Disparar WhatsApp</span>
                      </button>

                      {/* Botão de Abrir no Simulador Mobile */}
                      <button
                        onClick={() => handleOpenSimulatorForInvite(inv)}
                        className="px-2.5 py-1.5 rounded-xl bg-[#0E1A14] hover:bg-[#16291E] border border-[#16291E] text-gray-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Testar como visitante no simulador"
                      >
                        <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Simular</span>
                      </button>

                      {/* Botão Copiar Link */}
                      <button
                        onClick={() => {
                          const url = `https://copperguard.ind.br/checkin/${inv.token}`;
                          navigator.clipboard?.writeText(url);
                          soundAndVoice.playAlertSound('beep');
                          showNotice(`Link copiado: ${url}`);
                        }}
                        className="p-1.5 rounded-xl bg-[#070F0B] hover:bg-[#0E1A14] border border-[#16291E] text-gray-400 hover:text-white cursor-pointer"
                        title="Copiar URL do Link"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          FUNÇÃO 4: REGISTROS & AUDITORIA DE ACESSOS (HISTÓRICO CCO)
         ===================================================================== */}
      {currentMode === 'registros-acessos' && (
        <div className="flex-1 min-h-0 rounded-2xl bg-[#0A140F] border border-[#16291E] p-3.5 flex flex-col overflow-hidden shadow-sm font-mono">
          <div className="flex items-center justify-between border-b border-[#16291E] pb-2.5 mb-2.5 shrink-0">
            <span className="font-bold text-xs text-white uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span>Log de Auditoria de Entradas & Saídas (Tempo Real)</span>
            </span>
            <span className="text-xs text-gray-400">Total de eventos: 42 hoje</span>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto space-y-1.5 pr-1 text-xs">
            {listaFuncionarios.map(func => (
              <div
                key={func.id}
                className="p-2.5 rounded-xl bg-[#070F0B] border border-[#16291E] flex items-center justify-between text-gray-300"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-800 text-emerald-400 font-bold flex items-center justify-center text-xs">
                    {func.avatarIniciais}
                  </div>
                  <div>
                    <span className="font-bold text-white block">{func.nome}</span>
                    <span className="text-[10px] text-gray-500">{func.cargo} • Setor: {func.setor}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-[11px]">
                  <span className="text-gray-400">{func.ultimaCatraca}</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800 text-emerald-400 font-bold">
                    LIBERADO (0.2s)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =====================================================================
          FUNÇÃO 5: ACESSOS AO COFRE BLINDADO (NÍVEL 3)
         ===================================================================== */}
      {currentMode === 'autorizados-cofre' && (
        <div className="flex-1 min-h-0 rounded-2xl bg-[#0A140F] border border-[#16291E] p-3.5 flex flex-col overflow-hidden shadow-sm font-mono">
          <div className="flex items-center justify-between border-b border-[#16291E] pb-2.5 mb-2.5 shrink-0">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-400" />
              <div>
                <h3 className="font-bold text-white text-xs uppercase tracking-wider">
                  Cofre Blindado de Cobre • Dupla Autenticação (Nível 3)
                </h3>
                <p className="text-[10px] text-gray-400">Apenas colaboradores autorizados com biometria facial e RFID ativo.</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-amber-400 text-black text-[10px] font-bold">
              ECLUSA BIOMÉTRICA INTERTRAVADA
            </span>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-1 text-xs">
            {listaFuncionarios.filter(f => f.acessoCofreAutorizado).map(func => (
              <div
                key={func.id}
                className="p-3 rounded-xl bg-[#070F0B] border border-amber-900/40 flex items-center justify-between text-gray-300"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-950 border border-amber-700 text-amber-300 font-bold flex items-center justify-center text-xs">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-white block">{func.nome}</span>
                    <span className="text-[10px] text-gray-500">{func.cargo} • Matrícula: {func.matricula}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-amber-400 font-bold text-[11px]">{func.rfidTag}</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800 text-emerald-400 font-bold text-[10px]">
                    DUPLA FACE + RFID OK
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 1: NOVO CADASTRO DIRETO DE VISITANTE / MOTORISTA (BALCÃO PORTARIA)
         ===================================================================== */}
      {showDirectCadModal && (
        <div
          onClick={() => setShowDirectCadModal(false)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn font-mono"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="w-full max-w-2xl bg-[#070F0B] border border-[#16291E] rounded-2xl p-5 shadow-2xl text-slate-100 space-y-4 text-xs max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#16291E] pb-3">
              <div className="flex items-center gap-2.5 text-emerald-400">
                <UserPlus className="w-5 h-5" />
                <div>
                  <h3 className="font-bold text-sm tracking-wider text-white uppercase">
                    Novo Cadastro de Visitante & Motorista na Guarita
                  </h3>
                  <p className="text-[10px] text-gray-400">Recepção presencial com emissão imediata de crachá e credencial.</p>
                </div>
              </div>
              <button
                onClick={() => setShowDirectCadModal(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-[#0E1A14] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleDirectVisitorSubmit} className="space-y-3.5">
              {/* Seleção do Perfil de Entrada */}
              <div>
                <label className="block text-gray-400 mb-1.5 text-[10px] uppercase font-bold tracking-wider">
                  TIPO DE ACESSO:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setCadTipo('MOTORISTA_CARGA')}
                    className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      cadTipo === 'MOTORISTA_CARGA'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold'
                        : 'bg-[#0A140F] border-[#16291E] text-gray-400 hover:text-white'
                    }`}
                  >
                    <Truck className="w-4 h-4" />
                    <span className="text-[11px]">Motorista de Carga</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCadTipo('VISITANTE')}
                    className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      cadTipo === 'VISITANTE'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold'
                        : 'bg-[#0A140F] border-[#16291E] text-gray-400 hover:text-white'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    <span className="text-[11px]">Visitante Comercial</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCadTipo('PRESTADOR_SERVICO')}
                    className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      cadTipo === 'PRESTADOR_SERVICO'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold'
                        : 'bg-[#0A140F] border-[#16291E] text-gray-400 hover:text-white'
                    }`}
                  >
                    <KeyRound className="w-4 h-4" />
                    <span className="text-[11px]">Prestador de Serviço</span>
                  </button>
                </div>
              </div>

              {/* Dados Pessoais */}
              <div className="p-3 rounded-xl bg-[#0A140F] border border-[#16291E] space-y-2.5">
                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">
                  1. Dados Pessoais & Identificação
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-gray-400 block mb-0.5 text-[10px]">NOME COMPLETO *:</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Carlos Alberto da Silva"
                      value={cadNome}
                      onChange={e => setCadNome(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-[#070F0B] border border-[#16291E] text-white outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-gray-400 block mb-0.5 text-[10px]">CPF / CNH *:</label>
                    <input
                      type="text"
                      required
                      placeholder="000.000.000-00"
                      value={cadCpf}
                      onChange={e => setCadCpf(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-[#070F0B] border border-[#16291E] text-white outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-gray-400 block mb-0.5 text-[10px]">EMPRESA / TRANSPORTADORA *:</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: TransLog Metais Brasil"
                      value={cadEmpresa}
                      onChange={e => setCadEmpresa(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-[#070F0B] border border-[#16291E] text-white outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-gray-400 block mb-0.5 text-[10px]">CELULAR / WHATSAPP:</label>
                    <input
                      type="text"
                      placeholder="(11) 98765-4321"
                      value={cadTelefone}
                      onChange={e => setCadTelefone(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-[#070F0B] border border-[#16291E] text-white outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Seção Específica para Motoristas de Carga */}
              {cadTipo === 'MOTORISTA_CARGA' && (
                <div className="p-3 rounded-xl bg-[#0A140F] border border-amber-900/40 space-y-2.5">
                  <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5" />
                    <span>2. Dados da Carga & Balança Rodoviária 80t</span>
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="text-gray-400 block mb-0.5 text-[10px]">PLACA CAVALO:</label>
                      <input
                        type="text"
                        placeholder="ABC-1D23"
                        value={cadPlaca}
                        onChange={e => setCadPlaca(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-xl bg-[#070F0B] border border-[#16291E] text-white outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="text-gray-400 block mb-0.5 text-[10px]">PLACA CARRETA:</label>
                      <input
                        type="text"
                        placeholder="XYZ-9876"
                        value={cadPlacaCarreta}
                        onChange={e => setCadPlacaCarreta(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-xl bg-[#070F0B] border border-[#16291E] text-white outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="text-gray-400 block mb-0.5 text-[10px]">NÚMERO DA NF-e:</label>
                      <input
                        type="text"
                        placeholder="NF-e 004.892"
                        value={cadNfe}
                        onChange={e => setCadNfe(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-xl bg-[#070F0B] border border-[#16291E] text-white outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-gray-400 block mb-0.5 text-[10px]">MATERIAL / CARGA TRANSPORTADA:</label>
                    <select
                      value={cadTipoCarga}
                      onChange={e => setCadTipoCarga(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-[#070F0B] border border-[#16291E] text-white outline-none focus:border-emerald-500"
                    >
                      <option value="Sucata de Cobre Mista">Sucata de Cobre Mista (Balança / Pátio)</option>
                      <option value="Cátodos de Cobre Eletrolítico">Cátodos de Cobre Eletrolítico (Grau A)</option>
                      <option value="Bobinas de Vergalhão de Cobre">Bobinas de Vergalhão de Cobre (Expedição)</option>
                      <option value="Insumos Refratários / Químicos">Insumos Refratários / Químicos (Fundição)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Destino & Anfitrião */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-gray-400 block mb-0.5 text-[10px]">ANFITRIÃO INTERNO (RESPONSÁVEL):</label>
                  <select
                    value={cadAnfitriao}
                    onChange={e => setCadAnfitriao(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-[#0A140F] border border-[#16291E] text-white outline-none focus:border-emerald-500"
                  >
                    <option value="Juliana Costa (Portaria)">Juliana Costa (Portaria & Segurança)</option>
                    <option value="Carlos Eduardo Mendes (Fundição)">Carlos Eduardo Mendes (Fundição)</option>
                    <option value="Marcos Rocha (Logística)">Marcos Rocha (Logística & Expedição)</option>
                    <option value="Fernando Silva (Manutenção)">Fernando Silva (Manutenção)</option>
                    <option value="Diretoria Industrial">Diretoria Industrial (Sede Admin)</option>
                  </select>
                </div>

                <div>
                  <label className="text-gray-400 block mb-0.5 text-[10px]">SETOR AUTORIZADO NA PLANTA:</label>
                  <select
                    value={cadSetor}
                    onChange={e => setCadSetor(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-[#0A140F] border border-[#16291E] text-white outline-none focus:border-emerald-500"
                  >
                    <option value="Portão Azul Nº 250 & Pátio Leste">Portão Azul Nº 250 & Pátio Leste</option>
                    <option value="Doca de Carga & Balança">Doca de Carga & Balança</option>
                    <option value="Galpão de Fundição (Área Delimitada)">Galpão de Fundição (Área Delimitada)</option>
                    <option value="Sede Administrativa (Quadra Oeste)">Sede Administrativa (Quadra Oeste)</option>
                    <option value="Subestação & Manutenção">Subestação & Manutenção</option>
                  </select>
                </div>
              </div>

              {/* Captura de Foto & Termo de EPI */}
              <div className="p-3 rounded-xl bg-[#0A140F] border border-[#16291E] flex flex-col sm:flex-row items-center justify-between gap-3">
                <label className="flex items-center gap-2 cursor-pointer text-gray-300">
                  <input
                    type="checkbox"
                    checked={cadTermoEpi}
                    onChange={e => setCadTermoEpi(e.target.checked)}
                    className="accent-emerald-500 rounded"
                  />
                  <span className="text-[11px]">Termo de EPI & Normas Industriais aceito</span>
                </label>

                <button
                  type="button"
                  onClick={() => {
                    setCadFotoCapturada(!cadFotoCapturada);
                    soundAndVoice.playAlertSound('beep');
                  }}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    cadFotoCapturada
                      ? 'bg-emerald-500 text-black border-emerald-400'
                      : 'bg-[#070F0B] border-[#16291E] text-gray-300 hover:text-white'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>{cadFotoCapturada ? '✓ Foto Biométrica Capturada' : 'Tirar Foto do Visitante'}</span>
                </button>
              </div>

              {/* Botões Finais de Submissão */}
              <div className="pt-3 border-t border-[#16291E] flex flex-col sm:flex-row items-center justify-between gap-2.5">
                <label className="flex items-center gap-2 text-emerald-400 font-bold cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={cadEntradaImediata}
                    onChange={e => setCadEntradaImediata(e.target.checked)}
                    className="accent-emerald-500"
                  />
                  <span>Liberar Entrada Imediata (Emitir Tag RFID)</span>
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowDirectCadModal(false)}
                    className="px-4 py-2 rounded-xl bg-[#0A140F] border border-[#16291E] text-gray-400 hover:text-white cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold shadow-[0_0_12px_rgba(16,185,129,0.3)] transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <BadgeCheck className="w-4 h-4" />
                    <span>Concluir Cadastro</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 2: CRACHÁ DE SEGURANÇA COM FOCO TOTAL EM IMPRESSÃO (ZEBRA/PVC/A4)
         ===================================================================== */}
      {selectedVisitorForBadge && (
        <div
          onClick={() => setSelectedVisitorForBadge(null)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-fadeIn font-mono overflow-y-auto"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="w-full max-w-2xl bg-[#070F0B] border-2 border-emerald-500/60 rounded-3xl p-4 sm:p-5 shadow-2xl text-slate-100 space-y-4 text-xs max-h-[92vh] overflow-y-auto relative"
          >
            {/* Fechar */}
            <button
              onClick={() => setSelectedVisitorForBadge(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#0E1A14] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Cabeçalho do Modal & Ferramentas de Impressão */}
            <div className="border-b border-[#16291E] pb-3 space-y-2.5">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="font-bold text-white text-sm font-sans uppercase tracking-wider">
                    Emissão de Crachá & Credencial de Entrada
                  </h3>
                  <p className="text-[10px] text-gray-400">
                    Otimizado para impressoras térmicas (Zebra, Argox, Elgin) e cartões PVC CR80.
                  </p>
                </div>
              </div>

              {/* Barra de Controles: Formato & Modo de Visualização */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px]">
                {/* Seletor de Formato de Impressora */}
                <div className="flex items-center gap-1 p-1 bg-[#0A140F] border border-[#16291E] rounded-xl">
                  <button
                    onClick={() => setBadgePrintFormat('ZEBRA_100X60')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      badgePrintFormat === 'ZEBRA_100X60'
                        ? 'bg-emerald-500 text-black shadow-sm'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    🏷️ Térmica 100x60mm
                  </button>
                  <button
                    onClick={() => setBadgePrintFormat('PVC_CR80')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      badgePrintFormat === 'PVC_CR80'
                        ? 'bg-emerald-500 text-black shadow-sm'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    🪪 Cartão PVC CR80
                  </button>
                  <button
                    onClick={() => setBadgePrintFormat('A4_PROTOCOLO')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      badgePrintFormat === 'A4_PROTOCOLO'
                        ? 'bg-emerald-500 text-black shadow-sm'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    📄 Protocolo A4
                  </button>
                </div>

                {/* Alternador de Modo: Térmico (Preto no Branco) vs. Tático (Tela) */}
                <div className="flex items-center gap-1 p-1 bg-[#0A140F] border border-[#16291E] rounded-xl">
                  <button
                    onClick={() => setBadgeViewMode('PRINT_THERMAL')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      badgeViewMode === 'PRINT_THERMAL'
                        ? 'bg-white text-black shadow-sm'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    🖨️ Prévia Térmica (P&B)
                  </button>
                  <button
                    onClick={() => setBadgeViewMode('TACTICAL_DARK')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      badgeViewMode === 'TACTICAL_DARK'
                        ? 'bg-[#00FF88] text-black shadow-sm'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    🛡️ Modo Tático Tela
                  </button>
                </div>
              </div>
            </div>

            {/* CONTAINER PRINCIPAL DO CRACHÁ IMPRESSO (COM ID PARA O @media print) */}
            <div className="flex items-center justify-center p-2 bg-[#040806] rounded-2xl border border-[#16291E] overflow-x-auto">
              <div id="printable-badge" className="w-full flex justify-center">
                {badgeViewMode === 'PRINT_THERMAL' ? (
                  /* =========================================================
                     LAYOUT TÉRMICO PROFISSIONAL (ALTO CONTRASTE PRETO NO BRANCO)
                     ========================================================= */
                  badgePrintFormat === 'ZEBRA_100X60' ? (
                    /* 1. ETIQUETA TÉRMICA 100 x 60 mm (PADRÃO ZEBRA / ARGOX) */
                    <div className="w-full max-w-[430px] bg-white text-black font-sans border-2 border-black rounded-lg p-3 shadow-2xl space-y-1.5 select-text">
                      {/* Top Header Térmico */}
                      <div className="bg-black text-white text-center py-1 px-2 rounded-t font-black tracking-widest text-xs uppercase font-mono">
                        COPPERGUARD • METALÚRGICA DO COBRE S/A
                      </div>
                      <div className="text-center text-[8.5px] font-bold text-black border-b-2 border-black pb-0.5 tracking-tight uppercase font-mono">
                        PORTARIA & CONTROLE PATRIMONIAL • PORTÃO 250 (BALANÇA RODOVIÁRIA)
                      </div>

                      {/* Tarja de Categoria */}
                      <div className="bg-black text-white text-center font-black text-[11px] py-0.5 px-2 rounded-xs uppercase tracking-wider font-mono">
                        {selectedVisitorForBadge.tipo === 'MOTORISTA_CARGA'
                          ? '★ MOTORISTA DE CARGA - BALANÇA 80T ★'
                          : selectedVisitorForBadge.tipo === 'PRESTADOR_SERVICO'
                          ? '★ PRESTADOR DE SERVIÇOS TÉCNICOS ★'
                          : '★ VISITANTE COMERCIAL AUTORIZADO ★'}
                      </div>

                      {/* Nome do Visitante Grande e Legível a Distância */}
                      <div className="text-center my-0.5">
                        <h2 className="text-xl font-black uppercase text-black font-sans tracking-tight leading-none">
                          {selectedVisitorForBadge.nome}
                        </h2>
                        <span className="text-xs font-bold text-gray-800 uppercase block font-mono mt-0.5">
                          {selectedVisitorForBadge.empresa}
                        </span>
                      </div>

                      {/* Grid de Informações Cruciais */}
                      <div className="grid grid-cols-12 gap-1.5 border-t border-b-2 border-black py-1 text-[9.5px] font-mono leading-tight">
                        <div className="col-span-8 space-y-0.5 border-r border-black pr-1.5">
                          <div><strong>DOC:</strong> {selectedVisitorForBadge.cpf}</div>
                          {selectedVisitorForBadge.placaVeiculo && (
                            <div className="font-bold bg-black text-white px-1 py-0.2 rounded-xs inline-block">
                              PLACA: {selectedVisitorForBadge.placaVeiculo} {selectedVisitorForBadge.placaCarreta ? `+ ${selectedVisitorForBadge.placaCarreta}` : ''}
                            </div>
                          )}
                          {selectedVisitorForBadge.nfeNumero && (
                            <div><strong>NF-e:</strong> {selectedVisitorForBadge.nfeNumero}</div>
                          )}
                          {selectedVisitorForBadge.tipoCarga && (
                            <div className="truncate"><strong>CARGA:</strong> {selectedVisitorForBadge.tipoCarga}</div>
                          )}
                          <div><strong>DESTINO:</strong> <span className="font-bold underline">{selectedVisitorForBadge.setorDestino}</span></div>
                          <div><strong>RESP:</strong> {selectedVisitorForBadge.anfitriao}</div>
                          <div><strong>EMISSÃO:</strong> {selectedVisitorForBadge.horarioEntrada || '14:12'} • VÁLIDO 24H</div>
                        </div>

                        {/* Coluna QR Code & RFID */}
                        <div className="col-span-4 flex flex-col items-center justify-center text-center">
                          <div className="w-16 h-16 bg-white p-0.5 border border-black rounded flex items-center justify-center mb-0.5">
                            <QrCode className="w-full h-full text-black stroke-[2.8]" />
                          </div>
                          <div className="text-[8px] font-bold text-black border border-black px-1 py-0.2 rounded-xs bg-gray-100 font-mono">
                            {selectedVisitorForBadge.rfidProvisorio || selectedVisitorForBadge.tokenLink}
                          </div>
                        </div>
                      </div>

                      {/* Código de Barras Code 128 Vetorial */}
                      <div className="flex flex-col items-center justify-center pt-0.5">
                        <BarcodeSvg code={selectedVisitorForBadge.tokenLink} className="h-8 w-44" />
                      </div>

                      {/* Aviso de Segurança Legal */}
                      <div className="text-[7.5px] font-bold text-center border-t border-black pt-0.5 leading-tight uppercase tracking-tight text-black font-sans">
                        USO OBRIGATÓRIO E VISÍVEL NO PEITO. DEVOLVER NA SAÍDA PARA LIBERAÇÃO DA CANCELA.
                      </div>
                    </div>
                  ) : badgePrintFormat === 'PVC_CR80' ? (
                    /* 2. CARTÃO PVC CR80 (86 x 54 mm FORMATO VERTICAL COM SLOT) */
                    <div className="w-[280px] bg-white text-black font-sans border-2 border-black rounded-2xl p-4 shadow-2xl flex flex-col items-center text-center space-y-2 select-text">
                      {/* Slot Oval de Presilha / Cordão */}
                      <div className="w-10 h-2.5 rounded-full border-2 border-black bg-gray-200 mb-1" />

                      <div className="text-[10px] font-black uppercase tracking-wider font-mono text-black border-b border-black pb-1 w-full">
                        COPPERGUARD • PASS OFICIAL
                      </div>

                      {/* Avatar / Moldura de Foto */}
                      <div className="w-20 h-24 border-2 border-black rounded-xl flex flex-col items-center justify-center bg-gray-100 p-1">
                        <ScanFace className="w-10 h-10 text-gray-700 mb-1" />
                        <span className="text-[7px] font-bold uppercase font-mono">FOTO BIOMÉTRICA</span>
                      </div>

                      <div>
                        <h3 className="text-base font-black uppercase text-black leading-tight">
                          {selectedVisitorForBadge.nome}
                        </h3>
                        <span className="text-[10px] font-bold text-gray-700 block font-mono">
                          {selectedVisitorForBadge.empresa}
                        </span>
                      </div>

                      <div className="w-full bg-black text-white text-[9px] font-bold py-0.5 rounded uppercase font-mono">
                        {selectedVisitorForBadge.tipo}
                      </div>

                      <div className="w-full text-left text-[9px] font-mono border-t border-b border-black py-1 space-y-0.5">
                        <div><strong>DOC:</strong> {selectedVisitorForBadge.cpf}</div>
                        <div><strong>SETOR:</strong> {selectedVisitorForBadge.setorDestino}</div>
                        <div><strong>RFID:</strong> {selectedVisitorForBadge.rfidProvisorio || 'TEMP-01'}</div>
                      </div>

                      <div className="w-16 h-16 bg-white p-0.5 border border-black rounded">
                        <QrCode className="w-full h-full text-black" />
                      </div>

                      <BarcodeSvg code={selectedVisitorForBadge.tokenLink} className="h-7 w-36" />
                    </div>
                  ) : (
                    /* 3. PROTOCOLO A4 (FOLHA DE ENTRADA INDUSTRIAL COMPLETA) */
                    <div className="w-full max-w-[500px] bg-white text-black font-sans border-2 border-black rounded-lg p-5 shadow-2xl space-y-3 select-text text-[10px]">
                      <div className="border-b-2 border-black pb-2 flex items-center justify-between">
                        <div>
                          <h2 className="text-sm font-black uppercase tracking-tight">PROTOCOLO DE ENTRADA INDUSTRIAL</h2>
                          <span className="text-[9px] font-mono block">COPPERGUARD METALÚRGICA DO COBRE S/A • PORTÃO 250</span>
                        </div>
                        <div className="text-right font-mono font-bold text-[9px]">
                          {selectedVisitorForBadge.tokenLink}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 font-mono">
                        <div><strong>NOME:</strong> {selectedVisitorForBadge.nome}</div>
                        <div><strong>DOCUMENTO:</strong> {selectedVisitorForBadge.cpf}</div>
                        <div><strong>EMPRESA:</strong> {selectedVisitorForBadge.empresa}</div>
                        <div><strong>TIPO:</strong> {selectedVisitorForBadge.tipo}</div>
                        <div><strong>ANFITRIÃO:</strong> {selectedVisitorForBadge.anfitriao}</div>
                        <div><strong>SETOR:</strong> {selectedVisitorForBadge.setorDestino}</div>
                        {selectedVisitorForBadge.placaVeiculo && (
                          <div className="col-span-2"><strong>VEÍCULO:</strong> {selectedVisitorForBadge.placaVeiculo} {selectedVisitorForBadge.placaCarreta ? `+ ${selectedVisitorForBadge.placaCarreta}` : ''}</div>
                        )}
                        {selectedVisitorForBadge.nfeNumero && (
                          <div className="col-span-2"><strong>NF-e:</strong> {selectedVisitorForBadge.nfeNumero} ({selectedVisitorForBadge.tipoCarga || 'Cobre'})</div>
                        )}
                      </div>

                      <div className="border border-black p-2 rounded bg-gray-50 text-[9px]">
                        <strong>TERMO DE RESPONSABILIDADE & SEGURANÇA:</strong>
                        <p className="mt-0.5 leading-snug">
                          Declaro ciência do uso obrigatório de EPIs (botina de segurança, óculos e capacete). Proibida a circulação fora do setor delimitado sem acompanhamento de segurança.
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-black text-center font-mono text-[8.5px]">
                        <div>
                          <div className="border-b border-black mb-1 w-3/4 mx-auto" />
                          <span>Assinatura do Portador</span>
                        </div>
                        <div>
                          <div className="border-b border-black mb-1 w-3/4 mx-auto" />
                          <span>Visto Portaria / Segurança</span>
                        </div>
                      </div>
                    </div>
                  )
                ) : (
                  /* =========================================================
                     LAYOUT TÁTICO DE TELA (DARK COPPEROS ESTÉTICA VISUAL)
                     ========================================================= */
                  <div className="w-full max-w-sm bg-[#070F0B] border-2 border-emerald-500/70 rounded-3xl p-5 shadow-2xl text-slate-100 space-y-3.5 font-mono">
                    <div className="text-center pb-2.5 border-b border-[#16291E] space-y-1">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#0E1A14] border border-emerald-500/50 text-emerald-400 text-[9px] font-bold tracking-widest uppercase">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#00FF88] animate-pulse" />
                        <span>COPPERGUARD SECURITY PASS</span>
                      </div>
                      <h3 className="font-bold text-white text-base font-sans tracking-tight">
                        {selectedVisitorForBadge.nome}
                      </h3>
                      <span className="text-[10px] text-emerald-400 block font-bold">
                        {selectedVisitorForBadge.empresa}
                      </span>
                    </div>

                    <div className="p-3 rounded-2xl bg-[#0A140F] border border-[#16291E] flex flex-col items-center justify-center space-y-2">
                      <div className="w-32 h-32 bg-white rounded-xl p-2 flex items-center justify-center shadow-lg">
                        <QrCode className="w-full h-full text-black stroke-[2.2]" />
                      </div>
                      <span className="text-[10px] text-gray-400">
                        TOKEN: <strong className="text-emerald-400">{selectedVisitorForBadge.tokenLink}</strong>
                      </span>
                    </div>

                    <div className="space-y-1 text-[11px] bg-[#0A140F] p-3 rounded-xl border border-[#16291E]">
                      <div className="flex justify-between">
                        <span className="text-gray-500">TIPO:</span>
                        <span className="font-bold text-white">{selectedVisitorForBadge.tipo}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">DOCUMENTO:</span>
                        <span className="text-gray-200">{selectedVisitorForBadge.cpf}</span>
                      </div>
                      {selectedVisitorForBadge.placaVeiculo && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">PLACA:</span>
                          <span className="text-amber-400 font-bold">{selectedVisitorForBadge.placaVeiculo}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-500">SETOR:</span>
                        <span className="text-emerald-300 font-bold truncate max-w-[170px]">{selectedVisitorForBadge.setorDestino}</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-[#16291E]">
                        <span className="text-gray-500">CHIP RFID:</span>
                        <span className="text-emerald-400 font-bold">{selectedVisitorForBadge.rfidProvisorio || 'NÃO ATRIBUÍDO'}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* BARRA DE AÇÕES INFERIORES: DISPARO DIRETO PARA IMPRESSORA & WHATSAPP */}
            <div className="pt-2 border-t border-[#16291E] flex flex-col sm:flex-row items-center justify-between gap-2.5">
              <span className="text-[10px] text-gray-400 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-emerald-400" />
                <span>Pronto para impressão em bobinas térmicas de 100mm ou impressoras de PVC.</span>
              </span>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                {/* Botão Copiar Dados */}
                <button
                  onClick={() => handleCopyBadgeText(selectedVisitorForBadge)}
                  className="px-3 py-2 rounded-xl bg-[#0A140F] hover:bg-[#16291E] border border-[#16291E] text-gray-300 hover:text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Copiar dados da credencial"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar</span>
                </button>

                {/* Botão WhatsApp */}
                <button
                  onClick={() => handleShareBadgeWhatsApp(selectedVisitorForBadge)}
                  className="px-3.5 py-2 rounded-xl bg-[#0E1A14] hover:bg-[#16291E] border border-emerald-600/40 text-emerald-300 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Enviar comprovante para o WhatsApp do visitante"
                >
                  <Share2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Enviar WhatsApp</span>
                </button>

                {/* Botão Imprimir Principal (Chama window.print() sem sujeira) */}
                <button
                  onClick={handlePrintBadge}
                  className="flex-1 sm:flex-none px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.35)] transition-all cursor-pointer"
                >
                  <Printer className="w-4 h-4 stroke-[2.4]" />
                  <span>IMPRIMIR CRACHÁ TÉRMICO (Ctrl+P)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 3: GERADOR DE LINK DE AUTO-CHECK-IN & CONVITE WHATSAPP
         ===================================================================== */}
      {showInviteModal && (
        <div
          onClick={() => setShowInviteModal(false)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn font-mono"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="w-full max-w-xl bg-[#070F0B] border border-[#16291E] rounded-2xl p-5 shadow-2xl text-slate-100 space-y-4 text-xs max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#16291E] pb-3">
              <div className="flex items-center gap-2.5 text-emerald-400">
                <Share2 className="w-5 h-5" />
                <div>
                  <h3 className="font-bold text-sm tracking-wider text-white uppercase font-sans">
                    Gerar Link de Auto-Check-in & Convite WhatsApp
                  </h3>
                  <p className="text-[10px] text-gray-400">
                    O visitante preenche dados e envia foto pelo celular antes de chegar à fábrica.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowInviteModal(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-[#0E1A14] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateInviteSubmit} className="space-y-3.5">
              {/* Tipo de Convidado */}
              <div>
                <label className="block text-gray-400 mb-1 text-[10px] uppercase font-bold">
                  PERFIL DE ACESSO:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setInvTipo('MOTORISTA_CARGA')}
                    className={`p-2 rounded-xl border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      invTipo === 'MOTORISTA_CARGA'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold'
                        : 'bg-[#0A140F] border-[#16291E] text-gray-400 hover:text-white'
                    }`}
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>Motorista Carga</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setInvTipo('VISITANTE')}
                    className={`p-2 rounded-xl border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      invTipo === 'VISITANTE'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold'
                        : 'bg-[#0A140F] border-[#16291E] text-gray-400 hover:text-white'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Comercial</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setInvTipo('PRESTADOR_SERVICO')}
                    className={`p-2 rounded-xl border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      invTipo === 'PRESTADOR_SERVICO'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold'
                        : 'bg-[#0A140F] border-[#16291E] text-gray-400 hover:text-white'
                    }`}
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Prestador</span>
                  </button>
                </div>
              </div>

              {/* Informações do Convidado */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-gray-400 block mb-0.5 text-[10px]">NOME DO CONVIDADO *:</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Carlos Eduardo de Souza"
                    value={invNome}
                    onChange={e => setInvNome(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-[#0A140F] border border-[#16291E] text-white outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-gray-400 block mb-0.5 text-[10px]">WHATSAPP COM DDD *:</label>
                  <input
                    type="text"
                    required
                    placeholder="(11) 98765-4321"
                    value={invTelefone}
                    onChange={e => setInvTelefone(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-[#0A140F] border border-[#16291E] text-white outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-gray-400 block mb-0.5 text-[10px]">EMPRESA / TRANSPORTADORA:</label>
                  <input
                    type="text"
                    placeholder="Ex: Transportes Cobre S/A"
                    value={invEmpresa}
                    onChange={e => setInvEmpresa(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-[#0A140F] border border-[#16291E] text-white outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-gray-400 block mb-0.5 text-[10px]">PLACA PREVISTA (OPCIONAL):</label>
                  <input
                    type="text"
                    placeholder="ABC-1234"
                    value={invPlaca}
                    onChange={e => setInvPlaca(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-[#0A140F] border border-[#16291E] text-white outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Anfitrião & Setor */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-gray-400 block mb-0.5 text-[10px]">ANFITRIÃO INTERNO:</label>
                  <select
                    value={invAnfitriao}
                    onChange={e => setInvAnfitriao(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-[#0A140F] border border-[#16291E] text-white outline-none focus:border-emerald-500"
                  >
                    <option value="Juliana Costa (Portaria)">Juliana Costa (Portaria & Segurança)</option>
                    <option value="Carlos Eduardo Mendes (Fundição)">Carlos Eduardo Mendes (Fundição)</option>
                    <option value="Marcos Rocha (Logística)">Marcos Rocha (Logística & Expedição)</option>
                    <option value="Fernando Silva (Manutenção)">Fernando Silva (Manutenção)</option>
                    <option value="Diretoria Industrial">Diretoria Industrial (Sede Admin)</option>
                  </select>
                </div>

                <div>
                  <label className="text-gray-400 block mb-0.5 text-[10px]">VALIDADE DO LINK:</label>
                  <select
                    value={invValidadeHoras}
                    onChange={e => setInvValidadeHoras(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-[#0A140F] border border-[#16291E] text-white outline-none focus:border-emerald-500"
                  >
                    <option value={12}>Válido por 12 horas (Hoje)</option>
                    <option value={24}>Válido por 24 horas</option>
                    <option value={48}>Válido por 48 horas (2 dias)</option>
                    <option value={168}>Válido por 7 dias</option>
                  </select>
                </div>
              </div>

              {/* Preview da Mensagem do WhatsApp */}
              <div className="p-3 rounded-xl bg-[#0A140F] border border-emerald-900/40 space-y-1.5">
                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">
                  Prévia do Convite WhatsApp:
                </span>
                <p className="text-[11px] text-gray-300 font-sans leading-relaxed bg-[#070F0B] p-2.5 rounded-lg border border-[#16291E]">
                  *COPPERGUARD • CONVITE DE ACESSO INDUSTRIAL*<br />
                  Olá, *{invNome || '[Nome do Visitante]'}*!<br />
                  Você foi autorizado para acesso à nossa planta industrial na área: <strong>{invSetor}</strong>.<br />
                  Acesse o link para preenchimento de pré-cadastro e envio de foto:<br />
                  <span className="text-emerald-400 underline font-mono">https://copperguard.ind.br/checkin/TK-xxxx-CG</span>
                </p>
              </div>

              {/* Botões de Ação */}
              <div className="pt-2 border-t border-[#16291E] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#0A140F] border border-[#16291E] text-gray-400 hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold shadow-[0_0_12px_rgba(16,185,129,0.3)] transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Emitir Convite & Link</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          DRAWER LATERAL: PORTAL MOBILE DO VISITANTE (SIMULADOR DE ALTA PRECISÃO)
         ===================================================================== */}
      {showMobileDrawer && (
        <div
          onClick={() => setShowMobileDrawer(false)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-end animate-fadeIn font-mono"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="w-full max-w-md h-full bg-[#070F0B] border-l border-[#16291E] p-4 flex flex-col justify-between overflow-y-auto"
          >
            {/* Header do Drawer */}
            <div className="flex items-center justify-between pb-3 border-b border-[#16291E]">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-white text-xs uppercase tracking-wider font-sans">
                  Portal Mobile do Visitante • Auto-Check-in
                </span>
              </div>
              <button
                onClick={() => setShowMobileDrawer(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-[#0E1A14] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Simulador Fiel de Smartphone */}
            <div className="my-2 p-3 rounded-3xl bg-black border-2 border-emerald-500/50 text-slate-100 space-y-2.5 shadow-2xl relative">
              {/* Barra do Navegador Mobile com Padlock */}
              <div className="bg-[#0A140F] border border-[#16291E] py-1 px-3 rounded-full flex items-center justify-between text-[10px] text-gray-400">
                <div className="flex items-center gap-1.5">
                  <Lock className="w-3 h-3 text-emerald-400" />
                  <span className="text-gray-300 font-mono">copperguard.ind.br/checkin/{generatedToken}</span>
                </div>
                <span className="text-[9px] text-[#00FF88] font-bold">5G</span>
              </div>

              {/* Cabeçalho do App Web */}
              <div className="text-center pb-2 border-b border-[#16291E] space-y-0.5">
                <span className="text-[10px] text-emerald-400 font-bold tracking-widest uppercase block">
                  COPPERGUARD MOBILE PASS
                </span>
                <span className="text-xs text-white font-bold font-sans">Pré-Checkin para Acesso à Planta</span>
              </div>

              <form onSubmit={handleMobileSubmit} className="space-y-2 text-xs">
                <div>
                  <label className="text-[10px] text-gray-400 block mb-0.5">NOME COMPLETO *:</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Paulo Roberto Gomes"
                    value={mobNome}
                    onChange={e => setMobNome(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-[#0A140F] border border-[#16291E] text-white outline-none focus:border-emerald-500 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-gray-400 block mb-0.5">CPF *:</label>
                    <input
                      type="text"
                      placeholder="000.000.000-00"
                      value={mobCpf}
                      onChange={e => setMobCpf(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-[#0A140F] border border-[#16291E] text-white outline-none focus:border-emerald-500 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 block mb-0.5">EMPRESA:</label>
                    <input
                      type="text"
                      placeholder="Ex: Transportes Atlas"
                      value={mobEmpresa}
                      onChange={e => setMobEmpresa(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-[#0A140F] border border-[#16291E] text-white outline-none focus:border-emerald-500 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-gray-400 block mb-0.5">PLACA VEÍCULO:</label>
                    <input
                      type="text"
                      placeholder="ABC-1234"
                      value={mobPlaca}
                      onChange={e => setMobPlaca(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-[#0A140F] border border-[#16291E] text-white outline-none focus:border-emerald-500 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 block mb-0.5">Nº NOTA FISCAL (NF-e):</label>
                    <input
                      type="text"
                      placeholder="NF-e 000.000"
                      value={mobNfe}
                      onChange={e => setMobNfe(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-[#0A140F] border border-[#16291E] text-white outline-none focus:border-emerald-500 text-xs"
                    />
                  </div>
                </div>

                {/* Captura de Foto Facial (Selfie) */}
                <div className="p-2 rounded-xl bg-[#0A140F] border border-[#16291E] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Camera className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[10px] text-gray-300">Selfie Facial:</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setMobSelfieDone(!mobSelfieDone);
                      soundAndVoice.playAlertSound('beep');
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                      mobSelfieDone
                        ? 'bg-emerald-500 text-black'
                        : 'bg-[#0E1A14] text-emerald-400 border border-emerald-800'
                    }`}
                  >
                    {mobSelfieDone ? '✓ Foto Capturada' : 'Tirar Foto'}
                  </button>
                </div>

                {/* Aceite de Normas e Termo */}
                <div className="p-2 rounded-xl bg-[#0A140F] border border-[#16291E] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-[9.5px] text-gray-400">
                    Concordo com os procedimentos industriais e uso de EPIs da Metalúrgica.
                  </span>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs shadow-[0_0_12px_rgba(16,185,129,0.3)] transition-all cursor-pointer mt-1 font-sans"
                >
                  Concluir e Enviar à Guarita
                </button>
              </form>
            </div>

            <button
              onClick={() => setShowMobileDrawer(false)}
              className="w-full py-2 rounded-xl bg-[#0A140F] border border-[#16291E] text-gray-400 hover:text-white text-xs cursor-pointer mt-2"
            >
              Fechar Simulador
            </button>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: CADASTRO DE NOVO COLABORADOR
         ===================================================================== */}
      {showNovoFuncModal && (
        <div
          onClick={() => setShowNovoFuncModal(false)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn font-mono"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="w-full max-w-lg bg-[#070F0B] border border-[#16291E] rounded-2xl p-5 shadow-2xl text-slate-100 space-y-4 text-xs"
          >
            <div className="flex items-center justify-between border-b border-[#16291E] pb-3">
              <div className="flex items-center gap-2 text-emerald-400">
                <UserPlus className="w-5 h-5" />
                <h3 className="font-bold text-sm tracking-wider text-white uppercase">
                  Novo Colaborador na Planta
                </h3>
              </div>
              <button
                onClick={() => setShowNovoFuncModal(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-[#0E1A14]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateFuncionario} className="space-y-3">
              <div>
                <label className="block text-gray-400 mb-1 text-[11px]">NOME COMPLETO:</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Valter Fagundes de Souza"
                  value={novoFuncNome}
                  onChange={e => setNovoFuncNome(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#0A140F] border border-[#16291E] text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 mb-1 text-[11px]">CPF:</label>
                  <input
                    type="text"
                    placeholder="000.000.000-00"
                    value={novoFuncCpf}
                    onChange={e => setNovoFuncCpf(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#0A140F] border border-[#16291E] text-white outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 mb-1 text-[11px]">CARGO / FUNÇÃO:</label>
                  <input
                    type="text"
                    placeholder="Operador Industrial"
                    value={novoFuncCargo}
                    onChange={e => setNovoFuncCargo(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#0A140F] border border-[#16291E] text-white outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 mb-1 text-[11px]">SETOR:</label>
                  <select
                    value={novoFuncSetor}
                    onChange={e => setNovoFuncSetor(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-[#0A140F] border border-[#16291E] text-white outline-none focus:border-emerald-500"
                  >
                    <option value="Fundição">Fundição</option>
                    <option value="Portaria & Segurança">Portaria & Segurança</option>
                    <option value="Pátio de Sucatas">Pátio de Sucatas</option>
                    <option value="Logística">Logística</option>
                    <option value="Manutenção">Manutenção</option>
                  </select>
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer text-gray-300">
                    <input
                      type="checkbox"
                      checked={novoFuncCofre}
                      onChange={e => setNovoFuncCofre(e.target.checked)}
                      className="accent-emerald-500"
                    />
                    <span>Autorizar Cofre Nível 3</span>
                  </label>
                </div>
              </div>

              <div className="pt-3 border-t border-[#16291E] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowNovoFuncModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#0A140F] border border-[#16291E] text-gray-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                >
                  Salvar Colaborador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
