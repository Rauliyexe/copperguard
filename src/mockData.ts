import { 
  PontoRisco, 
  IncidenteSeguranca, 
  RegistroAcesso, 
  FuncionarioProdutividade, 
  MaquinaOEE, 
  VeiculoTelemetria, 
  CameraStream,
  AnomaliaCruzada,
  PortaoSeguranca,
  LogAcionamentoPortao
} from './types';

export const mockPortoes: PortaoSeguranca[] = [
  {
    id: 'GATE-01',
    codigo: 'PT-250-LPR',
    nome: 'Portão Azul Nº 250 (Acesso Caminhões & Cancela LPR)',
    quadra: 'Quadra Leste (Galpões)',
    localizacao: 'Corredor Asfaltado Norte — Foto 3',
    tipo: 'PORTAO_DESLIZANTE',
    cameraId: 'CAM-01',
    status: 'ABERTO',
    travaEletromagnetica: false,
    sensorBarreiraIVA: 'VEICULO_DETECTADO',
    ultimoAcionamento: '12:18:05',
    operadorResponsavel: 'Julio Cesar Alencar (Guarita Nº 250)',
    placaOuCrachaUltimo: 'ABC-8E90 • VW Constellation Prata'
  },
  {
    id: 'GATE-02',
    codigo: 'PT-SEDE-GRD',
    nome: 'Portão de Correr de Grade Azul (Garagem Sede Admin)',
    quadra: 'Quadra Oeste (Sede Admin)',
    localizacao: 'Fachada Leste da Sede / Rua Divisória — Foto 6',
    tipo: 'PORTAO_GRADE_SEDE',
    cameraId: 'CAM-02',
    status: 'FECHADO_TRAVADO',
    travaEletromagnetica: true,
    sensorBarreiraIVA: 'LIVRE',
    ultimoAcionamento: '11:42:19',
    operadorResponsavel: 'Juliana Costa (Recepção Sede)',
    placaOuCrachaUltimo: 'Frota Diretoria (Nissan March Preto)'
  },
  {
    id: 'GATE-03',
    codigo: 'CAT-SEDE-01',
    nome: 'Portão Social & Catraca Facial 3D (Recepção Sede)',
    quadra: 'Quadra Oeste (Sede Admin)',
    localizacao: 'Porta de Vidro & Gradil Azul — Foto 6',
    tipo: 'CATRACA_FACIAL',
    cameraId: 'CAM-02',
    status: 'FECHADO_TRAVADO',
    travaEletromagnetica: true,
    sensorBarreiraIVA: 'LIVRE',
    ultimoAcionamento: '12:20:44',
    operadorResponsavel: 'Biometria Facial Automática (0.2s)',
    placaOuCrachaUltimo: 'Carlos Eduardo Santos (FACE-994A)'
  },
  {
    id: 'GATE-04',
    codigo: 'PT-ARCO-NE',
    nome: 'Portão de Enrolar sob Toldo Azul (Galpão de Arco)',
    quadra: 'Quadra Leste (Galpões)',
    localizacao: 'Galpão Nordeste de Teto em Arco — Foto 3',
    tipo: 'PORTAO_ENROLAR_TOLDO',
    cameraId: 'CAM-04',
    status: 'ABERTO',
    travaEletromagnetica: false,
    sensorBarreiraIVA: 'LIVRE',
    ultimoAcionamento: '08:00:12',
    operadorResponsavel: 'Carlos Eduardo Santos (Fundição)',
    placaOuCrachaUltimo: 'EMP-02 (Passagem Autorizada)'
  },
  {
    id: 'GATE-05',
    codigo: 'ECL-COFRE-02',
    nome: 'Eclusa Biométrica Dupla do Cofre de Cobre Nobre',
    quadra: 'Quadra Leste (Galpões)',
    localizacao: 'Sul da Nave Geminada Central 02',
    tipo: 'ECLUSA_COFRE',
    cameraId: 'CAM-06',
    status: 'INTERTRAVADO_SEGURANCA',
    travaEletromagnetica: true,
    sensorBarreiraIVA: 'BLOQUEADO',
    ultimoAcionamento: '10:55:30',
    operadorResponsavel: 'Sistema Central CopperGuard (Nível 3)',
    placaOuCrachaUltimo: 'Dupla Autenticação Facial + RFID'
  }
];

export const mockLogsPortoes: LogAcionamentoPortao[] = [
  {
    id: 'LOG-PT-904',
    horario: '12:20:44',
    portaoId: 'GATE-03',
    portaoNome: 'Portão Social & Catraca Facial (Sede)',
    acao: 'LIBERACAO_LPR_FACIAL',
    operador: 'Terminal Facial #01',
    detalhe: 'Reconhecimento facial confirmado em 0.2s (99.8%) para Carlos Eduardo Santos.'
  },
  {
    id: 'LOG-PT-903',
    horario: '12:18:05',
    portaoId: 'GATE-01',
    portaoNome: 'Portão Azul Nº 250 (Caminhões)',
    acao: 'ABERTURA_REMOTA',
    operador: 'Julio Cesar Alencar',
    detalhe: 'Leitura LPR placa ABC-8E90 (VW Constellation Prata) validada. Cancela aberta.'
  },
  {
    id: 'LOG-PT-902',
    horario: '11:42:19',
    portaoId: 'GATE-02',
    portaoNome: 'Portão de Correr Grade Azul (Sede)',
    acao: 'FECHAMENTO_TRAVA',
    operador: 'Juliana Costa',
    detalhe: 'Trava eletromagnética acionada após estacionamento na Rua Divisória.'
  },
  {
    id: 'LOG-PT-901',
    horario: '10:55:30',
    portaoId: 'GATE-05',
    portaoNome: 'Eclusa Biométrica Dupla do Cofre',
    acao: 'FECHAMENTO_TRAVA',
    operador: 'Protocolo Automático Nível 3',
    detalhe: 'Portas P1 e P2 da eclusa intertravadas com anel laser ativo.'
  }
];

export const mockAnomaliasCruzadas: AnomaliaCruzada[] = [
  {
    id: 'GOD-EYE-01',
    horario: '12:24:18',
    titulo: 'Intrusão Perimetral sem RFID + Rompimento Físico',
    fontesCruzadas: ['Cerca Elétrica Setor 3', 'Câmera Térmica CAM-05', 'Radar RFID Pátio (0 crachás na zona)'],
    confiancaIA: 99.4,
    severidade: 'CRITICA',
    detalhe: '2 silhuetas humanas detectadas a 36.8°C junto ao Alambrado Norte. Nenhum colaborador com crachá RFID ativo num raio de 80 metros.',
    cameraRelacionadaId: 'CAM-05',
    status: 'ATIVA'
  },
  {
    id: 'GOD-EYE-02',
    horario: '11:15:02',
    titulo: 'Tentativa de Acesso em Eclusa sem Biometria Nível 3',
    fontesCruzadas: ['Eclusa Biométrica Cofre', 'Câmera Interna CAM-06', 'Leitor RFID Nave 02'],
    confiancaIA: 98.6,
    severidade: 'ALTA',
    detalhe: 'Crachá provisório tentou aproximação na porta externa da Eclusa do Cofre Blindado. Trava eletromagnética mantida bloqueada.',
    cameraRelacionadaId: 'CAM-06',
    status: 'CONTIDA'
  },
  {
    id: 'GOD-EYE-03',
    horario: '12:18:40',
    titulo: 'Excesso de Velocidade em Zona de Pedestres',
    fontesCruzadas: ['CAN-Bus Pá Carregadeira PA-01', 'Câmera Pátio CAM-03', 'GPS Indoor'],
    confiancaIA: 95.0,
    severidade: 'MEDIA',
    detalhe: 'Veículo PA-01 atingiu 14.5 km/h no corredor do Pátio Leste (limite 10 km/h) próximo à ala de Big-Bags.',
    cameraRelacionadaId: 'CAM-03',
    status: 'ATIVA'
  }
];

export const mockCameras: CameraStream[] = [
  {
    id: 'CAM-01',
    nome: 'Portão Azul Nº 250 - Controle LPR & Baia de Caminhões',
    setor: 'Portaria Nº 250 (Quadra Leste)',
    ip: '192.168.10.101',
    resolucao: '4K (3840x2160)',
    fps: 30,
    status: 'ONLINE',
    analiticoIA: {
      linhaVirtualAtiva: true,
      deteccaoHumanos: true,
      deteccaoVeiculos: true,
      leituraPlacaLPR: true,
    },
    eventosUltimaHora: 14,
    holofoteLigado: false,
    sireneLigada: false,
    modoTermico: false,
    zoomLevel: 1,
    coords: { x: 64.5, y: 20 }
  },
  {
    id: 'CAM-02',
    nome: 'Sede Administrativa Azul & Gradil (Outro Lado da Rua)',
    setor: 'Sede Administrativa (Quadra Oeste)',
    ip: '192.168.10.102',
    resolucao: '4K DarkFighter',
    fps: 60,
    status: 'ONLINE',
    analiticoIA: {
      linhaVirtualAtiva: true,
      deteccaoHumanos: true,
      deteccaoVeiculos: true,
      leituraPlacaLPR: true,
      reconhecimentoFacial: true
    },
    eventosUltimaHora: 28,
    holofoteLigado: false,
    sireneLigada: false,
    modoTermico: false,
    zoomLevel: 1,
    coords: { x: 22.5, y: 28 }
  },
  {
    id: 'CAM-03',
    nome: 'Pátio Leste de Carretas Lonadas, Big-Bags & Alambrado',
    setor: 'Pátio Leste & Big-Bags',
    ip: '192.168.10.105',
    resolucao: '4K (3840x2160)',
    fps: 30,
    status: 'ONLINE',
    analiticoIA: {
      linhaVirtualAtiva: true,
      deteccaoHumanos: true,
      deteccaoVeiculos: true,
      leituraPlacaLPR: false,
    },
    eventosUltimaHora: 6,
    holofoteLigado: false,
    sireneLigada: false,
    modoTermico: false,
    zoomLevel: 1,
    coords: { x: 80, y: 68 }
  },
  {
    id: 'CAM-04',
    nome: 'Galpão Nordeste (Teto em Arco Azul/Prata) - Toldo & Fornos',
    setor: 'Galpão de Arco Nordeste',
    ip: '192.168.10.110',
    resolucao: '4K Termográfica',
    fps: 30,
    status: 'ONLINE',
    analiticoIA: {
      linhaVirtualAtiva: true,
      deteccaoHumanos: true,
      deteccaoVeiculos: true,
      leituraPlacaLPR: false,
      termometria: true,
    },
    eventosUltimaHora: 3,
    holofoteLigado: false,
    sireneLigada: false,
    modoTermico: true,
    zoomLevel: 1,
    coords: { x: 82, y: 24 }
  },
  {
    id: 'CAM-05',
    nome: 'Alambrado Norte & Anexo Noroeste - Divisa Via Norte (Alvo Travado)',
    setor: 'Perímetro Norte',
    ip: '192.168.10.120',
    resolucao: '4K DarkFighter',
    fps: 30,
    status: 'ALERTA',
    analiticoIA: {
      linhaVirtualAtiva: true,
      deteccaoHumanos: true,
      deteccaoVeiculos: false,
      leituraPlacaLPR: false,
      termometria: true
    },
    eventosUltimaHora: 1,
    holofoteLigado: true,
    sireneLigada: true,
    modoTermico: false,
    zoomLevel: 1,
    coords: { x: 46, y: 12 }
  },
  {
    id: 'CAM-06',
    nome: 'Galpões Geminados Norte-Sul (Naves 01 e 02) - Cofre & Eclusa',
    setor: 'Galpões Geminados (Quadra Leste)',
    ip: '192.168.10.125',
    resolucao: '4K UltraHD',
    fps: 30,
    status: 'ONLINE',
    analiticoIA: {
      linhaVirtualAtiva: true,
      deteccaoHumanos: true,
      deteccaoVeiculos: false,
      leituraPlacaLPR: false,
      reconhecimentoFacial: true
    },
    eventosUltimaHora: 8,
    holofoteLigado: false,
    sireneLigada: false,
    modoTermico: false,
    zoomLevel: 1,
    coords: { x: 51, y: 64 }
  },
];

export const mockPontosRisco: PontoRisco[] = [
  {
    id: 'RISK-01',
    nome: 'Perímetro Alambrado Norte (Próximo ao Portão Nº 250)',
    localizacao: 'Muro/Alambrado Norte (Extensão 240m)',
    tipoSensor: 'Cerca Elétrica Alta Tensão',
    cameraId: 'CAM-05',
    cameraNome: 'Alambrado Norte & Anexo Noroeste',
    status: 'VIOLADO',
    nivelRisco: 'CRITICO',
    ultimoDisparo: 'Há 4 minutos (Tentativa de corte/flexão no setor 3)',
    historicoAlertasHoje: 1,
    coords: { x: 46, y: 11.5 },
    holofoteAtivo: true,
    sireneAtiva: true
  },
  {
    id: 'RISK-02',
    nome: 'Pátio Leste de Big-Bags e Carretas (Alambrado Mourões de Concreto)',
    localizacao: 'Pátio Aberto Sudeste - R. David de Souza Franco',
    tipoSensor: 'Linha Virtual IA (Tripwire)',
    cameraId: 'CAM-03',
    cameraNome: 'Pátio Leste de Carretas & Big-Bags',
    status: 'ARMADO',
    nivelRisco: 'ALTO',
    ultimoDisparo: 'Ontem às 23:42 (Movimentação não autorizada)',
    historicoAlertasHoje: 0,
    coords: { x: 80, y: 74 }
  },
  {
    id: 'RISK-03',
    nome: 'Portão Azul Nº 250 & Cancela Dupla de Caminhões',
    localizacao: 'Corredor Asfaltado de Entrada Norte',
    tipoSensor: 'Barreira Infravermelho (IVA)',
    cameraId: 'CAM-01',
    cameraNome: 'Portão Azul Nº 250 - Controle LPR',
    status: 'ARMADO',
    nivelRisco: 'MEDIO',
    ultimoDisparo: 'Sem ocorrências hoje',
    historicoAlertasHoje: 0,
    coords: { x: 64.5, y: 24 }
  },
  {
    id: 'RISK-04',
    nome: 'Galpões Geminados Norte-Sul (Naves 01 & 02 - Eclusa Cofre)',
    localizacao: 'Nave Central 02 - Setor Cofre & Bobinas',
    tipoSensor: 'Barreira Infravermelho (IVA)',
    cameraId: 'CAM-06',
    cameraNome: 'Galpões Geminados Norte-Sul',
    status: 'ARMADO',
    nivelRisco: 'ALTO',
    ultimoDisparo: 'Sem ocorrências hoje',
    historicoAlertasHoje: 0,
    coords: { x: 51, y: 65 }
  },
  {
    id: 'RISK-05',
    nome: 'Galpão Nordeste de Teto em Arco (Fornos & Toldo Azul)',
    localizacao: 'Setor Nordeste - Fundição',
    tipoSensor: 'Câmera Térmica Termográfica',
    cameraId: 'CAM-04',
    cameraNome: 'Galpão Nordeste (Teto em Arco)',
    status: 'ARMADO',
    nivelRisco: 'CRITICO',
    ultimoDisparo: 'Há 3 horas (Pico de aquecimento pontual corrigido)',
    historicoAlertasHoje: 1,
    coords: { x: 82, y: 24 }
  },
];

export const mockIncidentes: IncidenteSeguranca[] = [
  {
    id: 'INC-2026-098',
    timestamp: '12:24:18',
    pontoRiscoId: 'RISK-01',
    pontoRiscoNome: 'Perímetro Muro Norte (Zona Rodovia)',
    tipo: 'Disparo de Cerca Elétrica + Linha Virtual IA',
    nivel: 'CRITICO',
    status: 'EM_ABERTO',
    snapshotUrl: '/cameras/cam-perimetro.png',
    descricao: 'Queda de tensão na zona 3 do arame e IA identificou aproximação de 2 indivíduos no lado externo sem tag RFID.',
    correlacaoIA: 'Cruzamento: Pulso Cerca Elétrica (-8kV) + Visão Térmica Humana + 0 Crachás RFID na área',
    hashForense: 'SHA256: 9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b',
    acaoTomada: 'Sirene perimétrica e holofotes acionados automaticamente. Viatura informada.',
  },
  {
    id: 'INC-2026-097',
    timestamp: '11:15:02',
    pontoRiscoId: 'RISK-03',
    pontoRiscoNome: 'Portão Azul Nº 250 — Barreira LPR & Cancela',
    tipo: 'Bloqueio Preventivo de Eclusa Veicular',
    nivel: 'ALTO',
    status: 'RESOLVIDO',
    snapshotUrl: '/cameras/cam-balanca.png',
    descricao: 'Caminhão VW Constellation (ABC-8E90) aguardou validação cruzada de token QR Code do motorista na guarita Nº 250.',
    correlacaoIA: 'Cruzamento: Leitura LPR 4K (ABC-8E90) + Biometria Facial do Motorista + Liberação Portão Nº 250',
    hashForense: 'SHA256: 4b227777d4dd1fc61c6f884f48641d02b4d121d3fd',
    acaoTomada: 'Documentação e biometria confirmadas pelo vigilante; Portão Azul Nº 250 liberado.',
  },
];

export const mockAcessos: RegistroAcesso[] = [
  {
    id: 'ACS-5041',
    tipo: 'CAMINHAO',
    placaOuDoc: 'ABC-8E90',
    nomePessoa: 'Marcos Vinícius Silva',
    empresa: 'Transportadora Cobre Rápido / Sucatas São Paulo',
    tipoFluxo: 'ENTRADA',
    horarioEntrada: '11:05:12',
    status: 'EM_INSPECAO_LPR',
    nfeNumero: 'NFe-49201',
    observacaoSeguranca: 'Inspeção LPR & Biometria no Portão Azul Nº 250',
    portaoUtilizado: 'Portão Azul Nº 250'
  },
  {
    id: 'ACS-5040',
    tipo: 'CAMINHAO',
    placaOuDoc: 'RQK-4B12',
    nomePessoa: 'Sebastião Oliveira',
    empresa: 'Logística Rodonaves (Expedição de Tarugos)',
    tipoFluxo: 'SAIDA',
    horarioEntrada: '09:20:00',
    horarioSaida: '12:10:45',
    status: 'LIBERADO',
    nfeNumero: 'NFe-88192',
    portaoUtilizado: 'Portão Azul Nº 250'
  },
  {
    id: 'ACS-5039',
    tipo: 'COLABORADOR',
    placaOuDoc: 'CPF: 382.***.***-10',
    nomePessoa: 'Carlos Eduardo Santos',
    empresa: 'CopperOS Metalurgia (Matriz)',
    tipoFluxo: 'ENTRADA',
    horarioEntrada: '05:48:30',
    status: 'NO_PATIO',
    portaoUtilizado: 'Catraca Facial Recepção Sede'
  },
  {
    id: 'ACS-5038',
    tipo: 'PRESTADOR',
    placaOuDoc: 'CPF: 219.***.***-99',
    nomePessoa: 'Roberto Guimarães (Eng. Segurança)',
    empresa: 'Sistemas Perimetrais & CFTV Industrial',
    tipoFluxo: 'ENTRADA',
    horarioEntrada: '10:15:00',
    status: 'NO_PATIO',
    portaoUtilizado: 'Portão Social Sede Admin'
  },
];

export const mockFuncionarios: FuncionarioProdutividade[] = [
  {
    id: 'FUNC-01',
    nome: 'Carlos Eduardo Santos',
    cargo: 'Operador Chefe de Forno de Indução',
    setor: 'Fundição',
    turno: 'Turno A (06h-14h)',
    horasTrabalhadasHoje: 6.4,
    horasMeta: 8.0,
    status: 'PRODUZINDO',
    eficienciaPercentual: 111.5,
    atrasosMinutos: 0,
    rfidTag: 'RFID-9901',
    zonaAtual: 'Galpão de Arco Nordeste - Forno 01',
    coords: { x: 78, y: 26 }
  },
  {
    id: 'FUNC-02',
    nome: 'Julio Cesar Alencar',
    cargo: 'Inspetor de Segurança & Portaria Nº 250',
    setor: 'Portaria & Segurança',
    turno: 'Turno A (06h-14h)',
    horasTrabalhadasHoje: 6.3,
    horasMeta: 8.0,
    status: 'PRODUZINDO',
    eficienciaPercentual: 108.5,
    atrasosMinutos: 0,
    rfidTag: 'RFID-9902',
    zonaAtual: 'Portão Azul Nº 250 / Controle LPR',
    coords: { x: 64.5, y: 24 }
  },
  {
    id: 'FUNC-03',
    nome: 'Alexandre Moreira',
    cargo: 'Operador de Empilhadeira e Pátio Leste',
    setor: 'Pátio de Sucatas',
    turno: 'Turno A (06h-14h)',
    horasTrabalhadasHoje: 6.1,
    horasMeta: 8.0,
    status: 'PRODUZINDO',
    eficienciaPercentual: 105.0,
    atrasosMinutos: 5,
    rfidTag: 'RFID-9903',
    zonaAtual: 'Pátio Leste - Ala de Big-Bags & Carretas',
    coords: { x: 76, y: 58 }
  },
  {
    id: 'FUNC-04',
    nome: 'Fernando Dias',
    cargo: 'Classificador de Sucata & Amostragem',
    setor: 'Pátio de Sucatas',
    turno: 'Turno A (06h-14h)',
    horasTrabalhadasHoje: 5.8,
    horasMeta: 8.0,
    status: 'PAUSA_NR',
    eficienciaPercentual: 96.6,
    atrasosMinutos: 0,
    rfidTag: 'RFID-9904',
    zonaAtual: 'Galpão Geminado Central 02 - Bobinas',
    coords: { x: 51, y: 44 }
  },
];

export const mockMaquinas: MaquinaOEE[] = [
  {
    id: 'MAQ-01',
    codigo: 'FORNO-IND-01',
    nome: 'Forno de Indução 01 (Galpão de Arco)',
    setor: 'Galpão de Arco Nordeste',
    status: 'OPERANDO',
    horasTrabalhadasTurno: 5.8,
    horasDisponiveis: 6.5,
    oee: {
      disponibilidade: 89.2,
      performance: 96.5,
      qualidade: 98.8,
      oeeGeral: 85.0,
    },
    temperaturaAtualC: 1145,
    consumoKwhTon: 520,
    operadorLogado: 'Carlos Eduardo Santos'
  },
  {
    id: 'MAQ-02',
    codigo: 'FORNO-IND-02',
    nome: 'Forno de Indução 02 (Galpão de Arco)',
    setor: 'Galpão de Arco Nordeste',
    status: 'OPERANDO',
    horasTrabalhadasTurno: 5.5,
    horasDisponiveis: 6.5,
    oee: {
      disponibilidade: 84.6,
      performance: 94.0,
      qualidade: 99.2,
      oeeGeral: 78.9,
    },
    temperaturaAtualC: 1130,
    consumoKwhTon: 535,
    operadorLogado: 'Carlos Eduardo Santos'
  },
  {
    id: 'MAQ-03',
    codigo: 'PRENSA-HID-01',
    nome: 'Prensa Hidráulica Enfardadeira (Nave Oeste 01)',
    setor: 'Galpões Geminados (Quadra Leste)',
    status: 'OPERANDO',
    horasTrabalhadasTurno: 6.5,
    horasDisponiveis: 6.5,
    oee: {
      disponibilidade: 100.0,
      performance: 97.0,
      qualidade: 100.0,
      oeeGeral: 97.0,
    },
    operadorLogado: 'Fernando Dias'
  },
];

export const mockVeiculos: VeiculoTelemetria[] = [
  {
    id: 'VEIC-01',
    prefixo: 'EMP-01',
    modelo: 'Empilhadeira Hyster Elétrica 3.5t',
    setor: 'Galpões Geminados',
    tipo: 'EMPILHADEIRA',
    operadorAtual: 'Alexandre Moreira',
    status: 'EM_MOVIMENTO',
    horimetroTotal: 4182.4,
    horasOperandoTurno: 4.8,
    horasOciosasTurno: 0.6,
    velocidadeAtualKmH: 8.2,
    nivelEnergiaCombustivel: 72,
    ciclosCargaRealizados: 42,
    alertaExcessoVelocidade: false,
    zonaAtual: 'Galpão Geminado Central 02',
    coords: { x: 51, y: 49 }
  } as VeiculoTelemetria,
  {
    id: 'VEIC-02',
    prefixo: 'EMP-02',
    modelo: 'Empilhadeira Clark GLP 2.5t',
    tipo: 'EMPILHADEIRA',
    operadorAtual: 'Thiago Mendes',
    status: 'EM_MOVIMENTO',
    horimetroTotal: 6814.1,
    horasOperandoTurno: 3.2,
    horasOciosasTurno: 1.4,
    velocidadeAtualKmH: 6.5,
    nivelEnergiaCombustivel: 45,
    ciclosCargaRealizados: 28,
    alertaExcessoVelocidade: false,
    zonaAtual: 'Corredor Asfaltado Portão 250 -> Galpão Arco',
    coords: { x: 66, y: 37 }
  },
  {
    id: 'VEIC-03',
    prefixo: 'PA-01',
    modelo: 'Pá Carregadeira Caterpillar 924K',
    tipo: 'PA_CARREGADEIRA',
    operadorAtual: 'Jorge Henrique',
    status: 'EM_MOVIMENTO',
    horimetroTotal: 8940.6,
    horasOperandoTurno: 5.1,
    horasOciosasTurno: 0.4,
    velocidadeAtualKmH: 14.5,
    nivelEnergiaCombustivel: 68,
    ciclosCargaRealizados: 56,
    alertaExcessoVelocidade: true,
    zonaAtual: 'Pátio Leste de Carretas & Big-Bags',
    coords: { x: 77, y: 60 }
  },
];
