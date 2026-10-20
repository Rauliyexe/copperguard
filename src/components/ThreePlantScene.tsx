import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import {
  CameraStream,
  FuncionarioProdutividade,
  MaquinaOEE,
  VeiculoTelemetria,
  IncidenteSeguranca,
  PortaoSeguranca,
  LightingCycleMode,
  MapRenderStyle,
  PlantSpatialFocus,
  PlantSectorId,
  SECTOR_FOCUS_PRESETS
} from '../types';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Play,
  PenTool,
  Layers,
  Compass,
  Sparkles,
  Eye,
  Sun,
  Sunset,
  Moon,
  Globe,
  Lock,
  Unlock,
  Camera
} from 'lucide-react';
import { soundAndVoice } from '../utils/soundAndVoice';

export interface Node3D {
  id: string;
  x: number; // -80 a +80 (metros no eixo X)
  z: number; // -50 a +50 (metros no eixo Z)
}

interface ProjectedLabel {
  id: string;
  title: string;
  subtitle: string;
  color: 'emerald' | 'amber' | 'purple' | 'rose' | 'blue';
  cameraId?: string;
  screenX: number;
  screenY: number;
  visible: boolean;
  minZoomDist?: number;
  onClick?: () => void;
}

interface ThreePlantSceneProps {
  cameras: CameraStream[];
  funcionarios: FuncionarioProdutividade[];
  maquinas: MaquinaOEE[];
  veiculos: VeiculoTelemetria[];
  portoes?: PortaoSeguranca[];
  incidentes: IncidenteSeguranca[];
  focusedCamId: string;
  onSelectCamera: (camId: string) => void;
  onSelectSector: (sector: 'PORTOES' | 'MAQUINAS' | 'PESSOAS' | 'FROTAS' | 'CAMERAS') => void;
  onTogglePortao?: (portaoId: string) => void;
  onAddCameraAt: (xPercent: number, yPercent: number) => void;
  onSimulateIncident: () => void;
  voiceEnabled: boolean;
  onSwitchTo2D: () => void;
  spatialFocus?: PlantSpatialFocus;
  onUpdateSpatialFocus?: (focus: PlantSpatialFocus) => void;
}

// Perímetro Real 3D da Quadra Leste Principal (Galpões + Pátio de Carretas)
const DEFAULT_FENCE_3D: Node3D[] = [
  { id: 'P1', x: -32, z: -39 },   // Canto Noroeste dos Galpões (Esquina Rua Divisória)
  { id: 'P2', x: -4, z: -39 },    // Divisa Norte / Anexo Norte (Zona Alarme)
  { id: 'P3', x: 15, z: -39 },    // Portão Azul Nº 250 / Controle LPR
  { id: 'P4', x: 73.5, z: -39 },  // Canto Nordeste (Galpão de Arco)
  { id: 'P5', x: 73.5, z: 0 },    // Alambrado Leste (Mourões de Concreto)
  { id: 'P6', x: 73.5, z: 38.5 }, // Canto Sudeste (R. David de Souza Franco)
  { id: 'P7', x: 14, z: 38.5 },   // Divisa Sul Pátio / Galpões
  { id: 'P8', x: -32, z: 38.5 },  // Canto Sudoeste da Nave 01 (R. David de Souza Franco)
];

export const ThreePlantScene: React.FC<ThreePlantSceneProps> = ({
  cameras,
  funcionarios,
  veiculos,
  portoes = [],
  incidentes,
  onSelectCamera,
  onSelectSector,
  onTogglePortao,
  onAddCameraAt,
  onSimulateIncident,
  voiceEnabled,
  onSwitchTo2D,
  spatialFocus,
  onUpdateSpatialFocus
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  // Estados de Interação 3D
  const [fenceNodes, setFenceNodes] = useState<Node3D[]>(DEFAULT_FENCE_3D);
  const [tool, setTool] = useState<'ORBIT' | 'ADD_TOWER' | 'ADD_CAMERA'>('ORBIT');
  const [xrayRoofs, setXrayRoofs] = useState<boolean>(false);
  const [autoRotate, setAutoRotate] = useState<boolean>(false);
  const [buildPhase, setBuildPhase] = useState<number>(0); // 0 = completo, 1..5 = animação
  const [buildTitle, setBuildTitle] = useState<string>('');
  const [labels, setLabels] = useState<ProjectedLabel[]>([]);
  const [cameraDistance, setCameraDistance] = useState<number>(122);
  const [currentSectorId, setCurrentSectorId] = useState<PlantSectorId>(spatialFocus?.sectorId || 'COMPLEXO_COMPLETO');

  // Sincronização Automática: quando o foco espacial muda externamente (ex: veio do 2D CAD ou de seleção de Câmera)
  useEffect(() => {
    if (!spatialFocus) return;
    if (spatialFocus.lastUpdatedBy === '3D') return;

    setCurrentSectorId(spatialFocus.sectorId);
    const { x, z, radius, theta, phi } = spatialFocus.threeTarget;
    stateRef.current.desiredTarget.set(x, 2, z);
    stateRef.current.desiredRadius = radius;
    stateRef.current.desiredTheta = theta;
    stateRef.current.desiredPhi = phi;
    setCameraDistance(radius);
  }, [spatialFocus]);

  // Novo: Ciclo Dia / Entardecer / Noite & Estilo Terreno Real vs Tático
  const [lightingMode, setLightingMode] = useState<LightingCycleMode>('NOITE');
  const [mapStyle, setMapStyle] = useState<MapRenderStyle>('CAD_TATICO');

  // Novo: Hover PiP nas etiquetas e câmeras 3D
  const [hoveredCam, setHoveredCam] = useState<{
    cam: CameraStream;
    screenX: number;
    screenY: number;
  } | null>(null);

  // Estado dos portões
  const [localGate250Open, setLocalGate250Open] = useState<boolean>(true);
  const [localSedeGateOpen, setLocalSedeGateOpen] = useState<boolean>(false);

  const gate250Obj = portoes.find(p => p.id === 'GATE-01');
  const gateSedeObj = portoes.find(p => p.id === 'GATE-02');
  const isGate250Open = gate250Obj ? gate250Obj.status === 'ABERTO' : localGate250Open;
  const isSedeGateOpen = gateSedeObj ? gateSedeObj.status === 'ABERTO' : localSedeGateOpen;

  const handleToggleGate3D = (gateId: string) => {
    soundAndVoice.playAlertSound('beep');
    if (onTogglePortao) {
      onTogglePortao(gateId);
    } else {
      if (gateId === 'GATE-01') setLocalGate250Open(prev => !prev);
      if (gateId === 'GATE-02') setLocalSedeGateOpen(prev => !prev);
    }
  };

  const activeIncidente = Boolean(incidentes.find(i => i.status === 'EM_ABERTO'));

  const getCameraImage = (camId: string) => {
    if (camId === 'CAM-01' || camId === 'CAM-02') return '/cameras/cam-balanca.png';
    if (camId === 'CAM-04') return '/cameras/cam-forno.png';
    return '/cameras/cam-perimetro.png';
  };

  // Refs mutáveis para o loop de animação WebGL acessar sem recriar a cena
  const stateRef = useRef({
    theta: 0.20,
    phi: 0.80,
    radius: 122,
    target: new THREE.Vector3(0, 0, 2),
    desiredTarget: new THREE.Vector3(0, 0, 2),
    desiredRadius: 122,
    desiredTheta: 0.20,
    desiredPhi: 0.80,
    isPointerDown: false,
    pointerButton: 0,
    lastX: 0,
    lastY: 0,
    autoRotate: false,
    xrayRoofs: false,
    activeIncidente: false,
    buildPhase: 0,
    tool: 'ORBIT' as 'ORBIT' | 'ADD_TOWER' | 'ADD_CAMERA',
    fenceNodes: DEFAULT_FENCE_3D,
    lightingMode: 'NOITE' as LightingCycleMode,
    mapStyle: 'CAD_TATICO' as MapRenderStyle,
    isGate250Open: true,
    isSedeGateOpen: false,
  });

  useEffect(() => {
    stateRef.current.autoRotate = autoRotate;
    stateRef.current.xrayRoofs = xrayRoofs;
    stateRef.current.activeIncidente = activeIncidente;
    stateRef.current.buildPhase = buildPhase;
    stateRef.current.tool = tool;
    stateRef.current.fenceNodes = fenceNodes;
    stateRef.current.lightingMode = lightingMode;
    stateRef.current.mapStyle = mapStyle;
    stateRef.current.isGate250Open = isGate250Open;
    stateRef.current.isSedeGateOpen = isSedeGateOpen;
  }, [autoRotate, xrayRoofs, activeIncidente, buildPhase, tool, fenceNodes, lightingMode, mapStyle, isGate250Open, isSedeGateOpen]);

  // Função Cinematográfica Fly-To (Voa com a Câmera 3D até um Setor Real!)
  const flyToRoom = useCallback((x: number, z: number, radius: number, theta = 0.25, phi = 0.68) => {
    stateRef.current.desiredTarget.set(x, 2, z);
    stateRef.current.desiredRadius = radius;
    stateRef.current.desiredTheta = theta;
    stateRef.current.desiredPhi = phi;
    setCameraDistance(radius);
    soundAndVoice.playAlertSound('beep');
  }, []);

  // Foco Sincronizado 3D -> Atualiza tanto o voo 3D quanto o estado compartilhado 2D
  const focusSector3D = useCallback((sectorId: PlantSectorId) => {
    const preset = SECTOR_FOCUS_PRESETS[sectorId];
    if (!preset) return;
    setCurrentSectorId(sectorId);
    const { x, z, radius, theta, phi } = preset.threeTarget;
    stateRef.current.desiredTarget.set(x, 2, z);
    stateRef.current.desiredRadius = radius;
    stateRef.current.desiredTheta = theta;
    stateRef.current.desiredPhi = phi;
    setCameraDistance(radius);
    soundAndVoice.playAlertSound('beep');

    if (onUpdateSpatialFocus) {
      onUpdateSpatialFocus({
        sectorId,
        label: preset.label,
        threeTarget: preset.threeTarget,
        twoTarget: preset.twoTarget,
        lastUpdatedBy: '3D',
        timestamp: Date.now()
      });
    }
  }, [onUpdateSpatialFocus]);

  // Simulação Guiada de Construção 3D em 5 Fases (com Voo de Câmera Automático)
  const start3DConstruction = () => {
    setBuildPhase(1);
    setBuildTitle('FASE 1/5: Arruamento 3D — Rua Divisória Norte-Sul (Entre Sede e Galpões) e R. David de Souza Franco');
    flyToRoom(0, 0, 128, 0.28, 0.85);
    soundAndVoice.playAlertSound('beep');
    soundAndVoice.speakAlert(
      'Iniciando maquete três D real. Fase um: rua divisória entre a sede administrativa e os galpões industriais.',
      voiceEnabled
    );
  };

  useEffect(() => {
    if (buildPhase === 0) return;
    const timer = setTimeout(() => {
      if (buildPhase === 1) {
        setBuildPhase(2);
        setBuildTitle('FASE 2/5: Sede Administrativa Azul (Outro Lado da Rua), Galpões Geminados e Galpão de Arco');
        flyToRoom(-55, -15, 65, 0.45, 0.65);
        soundAndVoice.playAlertSound('beep');
        soundAndVoice.speakAlert(
          'Fase dois: erguendo a sede administrativa azul do outro lado da rua, os galpões geminados norte-sul e o galpão de teto em arco.',
          voiceEnabled
        );
      } else if (buildPhase === 2) {
        setBuildPhase(3);
        setBuildTitle('FASE 3/5: Caminhão Prata no Portão Nº 250 (LPR), Carretas Lonadas, Big-Bags Brancos e Fornos');
        flyToRoom(38, 8, 76, 0.35, 0.64);
        soundAndVoice.playAlertSound('beep');
        soundAndVoice.speakAlert(
          'Fase três: posicionando caminhão prata no controle L P R do portão duzentos e cinquenta, carretas lonadas, big-bags brancos e fornos.',
          voiceEnabled
        );
      } else if (buildPhase === 3) {
        setBuildPhase(4);
        setBuildTitle('FASE 4/5: Gradil Azul & Portão da Sede + Mourões de Concreto do Alambrado e Torres 10kV');
        flyToRoom(0, 0, 122, 0.20, 0.78);
        soundAndVoice.playAlertSound('beep');
        soundAndVoice.speakAlert(
          'Fase quatro: ativando gradil azul da sede administrativa, alambrado com mourões de concreto inclinados e anel laser.',
          voiceEnabled
        );
      } else if (buildPhase === 4) {
        setBuildPhase(5);
        setBuildTitle('FASE 5/5: Alerta de Intrusão no Alambrado Norte (P2-P3) — Domo Radar 3D Ativo');
        flyToRoom(4, -36, 50, 0.05, 0.58);
        onSimulateIncident();
      } else if (buildPhase === 5) {
        setBuildPhase(0);
        setBuildTitle('');
      }
    }, 3500);
    return () => clearTimeout(timer);
  }, [buildPhase, flyToRoom, onSimulateIncident, voiceEnabled]);

  // =========================================================================
  // INICIALIZAÇÃO DA CENA THREE.JS (MAQUETE 3D FIEL ÀS 6 FOTOS REAIS)
  // =========================================================================
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#040A07');
    scene.fog = new THREE.FogExp2('#040A07', 0.0026);

    const camera = new THREE.PerspectiveCamera(42, width / height, 1, 600);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // -----------------------------------------------------------------------
    // 1. ILUMINAÇÃO INDUSTRIAL + CICLO DIA/ENTARDECER/NOITE + POSTES LED
    // -----------------------------------------------------------------------
    const ambientLight = new THREE.AmbientLight('#A7F3D0', 0.65);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight('#F8FAFC', 1.45);
    dirLight.position.set(65, 115, 80);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 10;
    dirLight.shadow.camera.far = 280;
    const d = 105;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    scene.add(dirLight);

    // Luz Laranja Incandescente emanando dos Fornos dentro do Galpão de Arco Nordeste
    const furnaceLight = new THREE.PointLight('#FF6B00', 4.2, 42);
    furnaceLight.position.set(45, 7, -25);
    scene.add(furnaceLight);

    // Luz Roxo/Neon emanando do Cofre Blindado no Sul da Nave Central 02
    const vaultLight = new THREE.PointLight('#A855F7', 2.4, 34);
    vaultLight.position.set(2, 6, 16);
    scene.add(vaultLight);

    // Luz Vermelha de Alarme no Alambrado Norte
    const breachLight = new THREE.PointLight('#F43F5E', 0, 50);
    breachLight.position.set(5, 8, -39);
    scene.add(breachLight);

    // Postes de Iluminação Perimetral 3D (Acesos no Entardecer e Noite)
    const poleLights: THREE.PointLight[] = [];
    const poleBulbs: THREE.Mesh[] = [];
    const poleCoords = [
      { x: -42, z: -28 },
      { x: -42, z: -6 },
      { x: -33, z: -15 },
      { x: 16, z: -36 },
      { x: 35, z: -14 },
      { x: 71, z: 2 },
      { x: 71, z: 32 },
    ];
    poleCoords.forEach(pc => {
      const poleMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.22, 7.5, 10),
        new THREE.MeshStandardMaterial({ color: '#64748B', metalness: 0.7, roughness: 0.3 })
      );
      poleMesh.position.set(pc.x, 3.75, pc.z);
      scene.add(poleMesh);

      const bulb = new THREE.Mesh(
        new THREE.SphereGeometry(0.45, 10, 10),
        new THREE.MeshBasicMaterial({ color: '#FEF08A' })
      );
      bulb.position.set(pc.x, 7.6, pc.z);
      scene.add(bulb);
      poleBulbs.push(bulb);

      const pLight = new THREE.PointLight('#FDE047', 1.6, 32);
      pLight.position.set(pc.x, 7.4, pc.z);
      scene.add(pLight);
      poleLights.push(pLight);
    });

    // -----------------------------------------------------------------------
    // 2. TERRENO E ARRUAMENTO REAL (RUA DIVISÓRIA NORTE-SUL + R. DAVID DE SOUZA FRANCO)
    // -----------------------------------------------------------------------
    const groundGeo = new THREE.PlaneGeometry(240, 165);
    const groundMat = new THREE.MeshStandardMaterial({
      color: '#06100B',
      roughness: 0.92,
      metalness: 0.08,
    });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.receiveShadow = true;
    scene.add(groundMesh);

    const gridMajor = new THREE.GridHelper(190, 19, '#10B981', '#11271B');
    gridMajor.position.y = 0.04;
    (gridMajor.material as THREE.Material).opacity = 0.26;
    (gridMajor.material as THREE.Material).transparent = true;
    scene.add(gridMajor);

    const streetMat = new THREE.MeshStandardMaterial({ color: '#0C1411', roughness: 0.85 });
    const sidewalkMat = new THREE.MeshStandardMaterial({ color: '#1E293B', roughness: 0.8 });

    // Rua Sul: R. David de Souza Franco (Z = +43.8)
    const southRoad = new THREE.Mesh(new THREE.BoxGeometry(185, 0.18, 7.2), streetMat);
    southRoad.position.set(0, 0.09, 43.8);
    scene.add(southRoad);

    // Rua Norte — Acesso Sede & Portão Nº 250 (Z = -44.2)
    const northRoad = new THREE.Mesh(new THREE.BoxGeometry(185, 0.18, 7.0), streetMat);
    northRoad.position.set(0, 0.09, -44.2);
    scene.add(northRoad);

    // RUA DIVISÓRIA NORTE-SUL ENTRE A SEDE ADMINISTRATIVA (OESTE) E OS GALPÕES (LESTE) (X = -37.5)
    const middleStreet = new THREE.Mesh(new THREE.BoxGeometry(8.2, 0.19, 94), streetMat);
    middleStreet.position.set(-37.5, 0.095, 0);
    scene.add(middleStreet);

    // Calçada Oeste da Rua Divisória (frente do Gradil Azul da Sede: X = -42.1)
    const westSidewalk = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.24, 78), sidewalkMat);
    westSidewalk.position.set(-42.1, 0.12, 0);
    scene.add(westSidewalk);

    // Calçada Leste da Rua Divisória (empena oeste do Galpão Geminado 01: X = -32.9)
    const eastSidewalk = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.24, 78), sidewalkMat);
    eastSidewalk.position.set(-32.9, 0.12, 0);
    scene.add(eastSidewalk);

    // Faixas tracejadas nas 3 ruas
    const stripeMat = new THREE.MeshBasicMaterial({ color: '#34D399' });
    for (let rx = -85; rx <= 85; rx += 10) {
      const sSouth = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.22, 0.22), stripeMat);
      sSouth.position.set(rx, 0.12, 43.8);
      scene.add(sSouth);

      const sNorth = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.22, 0.22), stripeMat);
      sNorth.position.set(rx, 0.12, -44.2);
      scene.add(sNorth);
    }
    for (let rz = -38; rz <= 38; rz += 9) {
      const sMid = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 4.0), stripeMat);
      sMid.position.set(-37.5, 0.12, rz);
      scene.add(sMid);
    }

    // -----------------------------------------------------------------------
    // GRUPOS DINÂMICOS PARA ANIMAÇÃO DE CONSTRUÇÃO EM FASES
    // -----------------------------------------------------------------------
    const wallsGroup = new THREE.Group();
    const interiorGroup = new THREE.Group();
    const roofsGroup = new THREE.Group();
    const perimeterGroup = new THREE.Group();
    scene.add(wallsGroup);
    scene.add(interiorGroup);
    scene.add(roofsGroup);
    scene.add(perimeterGroup);

    // Função utilitária para criar blocos 3D com bordas técnicas
    const createBox3D = (
      w: number,
      h: number,
      d: number,
      x: number,
      y: number,
      z: number,
      colorHex: string,
      edgeHex: string,
      parent: THREE.Group = wallsGroup,
      opacity = 1
    ) => {
      const geo = new THREE.BoxGeometry(w, h, d);
      const mat = new THREE.MeshStandardMaterial({
        color: colorHex,
        roughness: 0.48,
        metalness: 0.25,
        transparent: opacity < 1,
        opacity,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, y, z);
      mesh.castShadow = opacity === 1;
      mesh.receiveShadow = true;

      const edges = new THREE.EdgesGeometry(geo);
      const line = new THREE.LineSegments(
        edges,
        new THREE.LineBasicMaterial({ color: edgeHex, transparent: true, opacity: 0.7 })
      );
      mesh.add(line);
      parent.add(mesh);
      return mesh;
    };

    const createPitchedRoof3D = (
      w: number,
      lengthZ: number,
      wallH: number,
      ridgeH: number,
      centerX: number,
      centerZ: number,
      roofColor: string,
      edgeColor: string
    ) => {
      const halfW = w / 2;
      const slopeLen = Math.sqrt(halfW * halfW + ridgeH * ridgeH);
      const slopeAngle = Math.atan2(ridgeH, halfW);

      const leftSlope = createBox3D(
        slopeLen,
        0.25,
        lengthZ,
        centerX - halfW / 2,
        wallH + ridgeH / 2,
        centerZ,
        roofColor,
        edgeColor,
        roofsGroup,
        0.92
      );
      leftSlope.rotation.z = slopeAngle;

      const rightSlope = createBox3D(
        slopeLen,
        0.25,
        lengthZ,
        centerX + halfW / 2,
        wallH + ridgeH / 2,
        centerZ,
        roofColor,
        edgeColor,
        roofsGroup,
        0.92
      );
      rightSlope.rotation.z = -slopeAngle;

      for (let sz = centerZ - lengthZ / 2 + 6; sz <= centerZ + lengthZ / 2 - 6; sz += 8.5) {
        createBox3D(2.8, 0.35, 1.3, centerX - halfW / 2, wallH + ridgeH / 2 + 0.15, sz, '#38BDF8', '#BAE6FD', roofsGroup, 0.55);
        createBox3D(2.8, 0.35, 1.3, centerX + halfW / 2, wallH + ridgeH / 2 + 0.15, sz, '#38BDF8', '#BAE6FD', roofsGroup, 0.55);
      }
    };

    // =======================================================================
    // QUADRA OESTE (DO OUTRO LADO DA RUA): SEDE ADMINISTRATIVA AZUL,
    // COBERTURA ESCALONADA EM 4 NÍVEIS, GRADIL AZUL & TERRENO SUL
    // =======================================================================
    createBox3D(30.5, 0.22, 39.5, -57.75, 0.11, -19.25, '#0D1B24', '#38BDF8', wallsGroup);

    createBox3D(19.5, 5.2, 5.5, -58, 2.6, -31.25, '#1E3A8A', '#60A5FA', wallsGroup);
    createBox3D(19.8, 0.28, 5.7, -58, 5.35, -31.25, '#E2E8F0', '#94A3B8', roofsGroup, 0.94);

    createBox3D(21.5, 6.8, 8.5, -58.5, 3.4, -24.25, '#1E3A8A', '#93C5FD', wallsGroup);
    createBox3D(21.8, 0.28, 8.7, -58.5, 6.95, -24.25, '#F1F5F9', '#94A3B8', roofsGroup, 0.94);

    createBox3D(22.5, 6.0, 9.5, -58.5, 3.0, -15.25, '#1D4ED8', '#60A5FA', wallsGroup);
    createBox3D(22.8, 0.28, 9.7, -58.5, 6.15, -15.25, '#E2E8F0', '#94A3B8', roofsGroup, 0.94);

    createBox3D(26.5, 6.4, 10.3, -59.5, 3.2, -5.35, '#1E293B', '#94A3B8', wallsGroup);
    createBox3D(26.8, 0.28, 10.5, -59.5, 6.55, -5.35, '#F8FAFC', '#CBD5E1', roofsGroup, 0.94);

    createBox3D(3.8, 3.8, 18.0, -45.6, 1.9, -19.5, '#2563EB', '#93C5FD', wallsGroup);
    [-26.5, -23.0, -19.5, -16.0].forEach(wz => {
      createBox3D(0.25, 1.5, 2.3, -43.65, 2.0, wz, '#78350F', '#F59E0B', wallsGroup);
      createBox3D(0.55, 0.8, 1.1, -44.2, 4.3, wz + 0.3, '#F8FAFC', '#94A3B8', wallsGroup);
    });
    createBox3D(0.25, 2.7, 3.4, -43.65, 1.35, -12.4, '#38BDF8', '#E0F2FE', wallsGroup, 0.65);

    for (let gz = -29; gz <= -1; gz += 3.5) {
      createBox3D(0.55, 2.3, 0.55, -42.5, 1.15, gz, '#F8FAFC', '#93C5FD', wallsGroup);
      if (gz < -1) {
        createBox3D(0.25, 0.5, 2.95, -42.5, 0.25, gz + 1.75, '#E2E8F0', '#94A3B8', wallsGroup);
        createBox3D(0.12, 1.6, 2.95, -42.5, 1.3, gz + 1.75, '#2563EB', '#60A5FA', wallsGroup, 0.75);
      }
    }
    // Portão Grande de Correr de Grade Azul da Sede (Animado em 3D conforme aberto/fechado!)
    const sedeSlidingGateMesh = createBox3D(0.22, 2.2, 8.8, -42.5, 1.1, -34.0, '#1D4ED8', '#60A5FA', wallsGroup, 0.85);

    // Carros Pretos Estacionados na Rua em frente ao Gradil Azul da Sede (Foto 6)
    createBox3D(1.9, 1.45, 3.8, -40.2, 0.85, -24.5, '#0F172A', '#64748B', interiorGroup);
    createBox3D(1.9, 1.45, 3.8, -40.2, 0.85, -18.5, '#0F172A', '#64748B', interiorGroup);

    // METADE SUL DA QUADRA OESTE: TERRENO DE TERRA BATIDA ABAIXO DA SEDE (Foto 5 Satélite)
    const earthYardMesh = createBox3D(30.5, 0.18, 38.0, -57.75, 0.09, 19.5, '#2A170E', '#9A3412', wallsGroup);
    createBox3D(5.4, 3.8, 6.4, -69.5, 1.9, 10.5, '#E2E8F0', '#94A3B8', wallsGroup);
    createBox3D(7.5, 1.8, 2.4, -53.5, 0.9, 11.5, '#78350F', '#F59E0B', interiorGroup);

    // =======================================================================
    // QUADRA LESTE PRINCIPAL: DOIS GRANDES GALPÕES GEMINADOS NORTE-SUL
    // =======================================================================
    createBox3D(23, 0.25, 65, -20.5, 0.12, 5.0, '#0B151C', '#64748B', wallsGroup);
    createBox3D(0.5, 8.2, 65, -32, 4.1, 5.0, '#CBD5E1', '#94A3B8', wallsGroup);
    createBox3D(23, 8.2, 0.5, -20.5, 4.1, -27.5, '#CBD5E1', '#94A3B8', wallsGroup);
    createBox3D(23, 8.2, 0.5, -20.5, 4.1, 37.5, '#CBD5E1', '#94A3B8', wallsGroup);
    createBox3D(0.4, 8.2, 53, -9, 4.1, -1.0, '#94A3B8', '#64748B', wallsGroup);
    createPitchedRoof3D(23, 65, 8.2, 2.5, -20.5, 5.0, '#E2E8F0', '#94A3B8');

    createBox3D(22.5, 0.25, 53, 2.25, 0.12, -1.0, '#0D1821', '#64748B', wallsGroup);
    createBox3D(22.5, 8.2, 0.5, 2.25, 4.1, -27.5, '#CBD5E1', '#94A3B8', wallsGroup);
    createBox3D(22.5, 8.2, 0.5, 2.25, 4.1, 25.5, '#CBD5E1', '#94A3B8', wallsGroup);
    createBox3D(0.5, 8.2, 53, 13.5, 4.1, -1.0, '#CBD5E1', '#94A3B8', wallsGroup);
    createPitchedRoof3D(22.5, 53, 8.2, 2.5, 2.25, -1.0, '#F1F5F9', '#94A3B8');

    createBox3D(9.0, 6.0, 13.5, 18.0, 3.0, 19.25, '#DBEAFE', '#93C5FD', wallsGroup);
    createBox3D(9.3, 0.3, 13.8, 18.0, 6.15, 19.25, '#F8FAFC', '#94A3B8', roofsGroup, 0.92);

    createBox3D(45.5, 0.18, 11.5, -9.25, 0.09, -33.25, '#0B1712', '#1E3F2E', wallsGroup);
    createBox3D(12.2, 5.2, 10.0, 7.1, 2.6, -33.2, '#E2E8F0', '#94A3B8', wallsGroup);
    createBox3D(12.5, 0.3, 10.3, 7.1, 5.35, -33.2, '#F8FAFC', '#CBD5E1', roofsGroup, 0.92);

    const coilGeo = new THREE.CylinderGeometry(1.25, 1.25, 2.0, 20);
    const coilMat = new THREE.MeshStandardMaterial({ color: '#D97706', metalness: 0.78, roughness: 0.25 });
    for (let cx = -27; cx <= -14; cx += 4.3) {
      for (let cz = -20; cz <= -8; cz += 4.5) {
        const coil = new THREE.Mesh(coilGeo, coilMat);
        coil.position.set(cx, 1.1, cz);
        coil.castShadow = true;
        interiorGroup.add(coil);
      }
    }
    createBox3D(13, 4.2, 6.5, -20.5, 2.1, 6, '#065F46', '#34D399', interiorGroup);

    createBox3D(19.5, 4.8, 15, 2.25, 2.4, 16.5, '#1B132C', '#C084FC', interiorGroup, 0.55);
    [-3.5, 2.25, 8.0].forEach(rx => {
      [13, 20].forEach(rz => {
        createBox3D(4.2, 3.2, 4.0, rx, 1.6, rz, '#B45309', '#FBBF24', interiorGroup);
      });
    });
    const vaultLaserEdges = new THREE.EdgesGeometry(new THREE.BoxGeometry(20.8, 5.4, 16.2));
    const vaultLaserBox = new THREE.LineSegments(
      vaultLaserEdges,
      new THREE.LineBasicMaterial({ color: '#C084FC' })
    );
    vaultLaserBox.position.set(2.25, 2.7, 16.5);
    perimeterGroup.add(vaultLaserBox);

    // =======================================================================
    // SETOR CENTRO-NORTE: PORTÃO AZUL Nº 250, BAIA DE INSPEÇÃO LPR,
    // CANCELA DUPLA & CAMINHÃO PRATA CONSTELLATION (100% SEGURANÇA!)
    // =======================================================================
    createBox3D(18, 0.22, 25, 23, 0.11, -26.5, '#0B1014', '#38BDF8', wallsGroup);

    // Pilar de Alvenaria Azul "Nº 250" + Portão Duplo Metálico Azul Animado (Foto 3)
    createBox3D(3.0, 4.2, 1.8, 15.8, 2.1, -38.8, '#1D4ED8', '#93C5FD', wallsGroup);
    createBox3D(2.4, 4.2, 1.8, 30.2, 2.1, -38.8, '#1D4ED8', '#93C5FD', wallsGroup);
    const gate250LeftMesh = createBox3D(0.3, 3.6, 6.2, 17.4, 1.8, -35.2, '#2563EB', '#60A5FA', wallsGroup, 0.82);
    const gate250RightMesh = createBox3D(0.3, 3.6, 6.2, 28.8, 1.8, -35.2, '#2563EB', '#60A5FA', wallsGroup, 0.82);

    // Piso Demarcado da Baia de Inspeção LPR & Barreira IVA
    createBox3D(10.5, 0.32, 18.5, 23, 0.16, -25.5, '#071710', '#10B981', wallsGroup);

    // CAMINHÃO CAVALO MECÂNICO PRATA (VW CONSTELLATION DA FOTO 3) NA BAIA LPR
    const entranceTruck = new THREE.Group();
    createBox3D(3.5, 3.6, 11.2, 23, 2.3, -28.0, '#1E293B', '#94A3B8', entranceTruck);
    createBox3D(3.4, 3.8, 4.2, 23, 2.4, -19.6, '#CBD5E1', '#FFFFFF', entranceTruck);
    createBox3D(3.0, 1.3, 0.2, 23, 3.1, -17.45, '#0F172A', '#38BDF8', entranceTruck);
    createBox3D(2.3, 1.4, 0.2, 23, 1.6, -17.45, '#1E293B', '#64748B', entranceTruck);
    interiorGroup.add(entranceTruck);

    // =======================================================================
    // SETOR NORDESTE: GALPÃO DE TETO EM ARCO AZUL E PRATA + TOLDO AZUL
    // =======================================================================
    createBox3D(40, 0.3, 20, 52.5, 0.15, -26.0, '#14110B', '#38BDF8', wallsGroup);

    createBox3D(40, 3.8, 0.5, 52.5, 1.9, -36, '#1D4ED8', '#60A5FA', wallsGroup);
    createBox3D(40, 3.8, 0.5, 52.5, 1.9, -16, '#1D4ED8', '#60A5FA', wallsGroup);
    createBox3D(0.5, 3.8, 20, 32.5, 1.9, -26, '#1D4ED8', '#60A5FA', wallsGroup);
    createBox3D(0.5, 3.8, 20, 72.5, 1.9, -26, '#1D4ED8', '#60A5FA', wallsGroup);

    createBox3D(40, 3.0, 0.4, 52.5, 5.3, -36, '#CBD5E1', '#94A3B8', wallsGroup);
    createBox3D(40, 3.0, 0.4, 52.5, 5.3, -16, '#CBD5E1', '#94A3B8', wallsGroup);
    createBox3D(0.4, 3.0, 20, 32.5, 5.3, -26, '#CBD5E1', '#94A3B8', wallsGroup);
    createBox3D(0.4, 3.0, 20, 72.5, 5.3, -26, '#CBD5E1', '#94A3B8', wallsGroup);

    const archRadius = 10.1;
    const archGeo = new THREE.CylinderGeometry(
      archRadius,
      archRadius,
      40,
      28,
      1,
      false,
      -Math.PI / 2,
      Math.PI
    );
    const archMat = new THREE.MeshStandardMaterial({
      color: '#E2E8F0',
      roughness: 0.35,
      metalness: 0.65,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.92,
    });
    const archRoofMesh = new THREE.Mesh(archGeo, archMat);
    archRoofMesh.rotation.z = Math.PI / 2;
    archRoofMesh.position.set(52.5, 6.8, -26.0);
    archRoofMesh.scale.set(1, 1, 0.36);
    const archEdges = new THREE.EdgesGeometry(archGeo);
    archRoofMesh.add(
      new THREE.LineSegments(
        archEdges,
        new THREE.LineBasicMaterial({ color: '#38BDF8', transparent: true, opacity: 0.45 })
      )
    );
    roofsGroup.add(archRoofMesh);

    createBox3D(10, 5.2, 0.65, 41.0, 2.6, -15.9, '#1E293B', '#94A3B8', wallsGroup);
    createBox3D(12.5, 0.9, 3.2, 41.0, 5.6, -14.3, '#1D4ED8', '#93C5FD', wallsGroup);

    const createFurnace3D = (fx: number, fz: number, radius: number) => {
      const body = new THREE.Mesh(
        new THREE.CylinderGeometry(radius, radius * 1.08, 4.5, 28),
        new THREE.MeshStandardMaterial({ color: '#291D12', roughness: 0.6, metalness: 0.5 })
      );
      body.position.set(fx, 2.25, fz);
      body.castShadow = true;
      interiorGroup.add(body);

      const molten = new THREE.Mesh(
        new THREE.CylinderGeometry(radius * 0.78, radius * 0.78, 0.3, 28),
        new THREE.MeshBasicMaterial({ color: '#FF6B00' })
      );
      molten.position.set(fx, 4.45, fz);
      interiorGroup.add(molten);
    };
    createFurnace3D(41, -26, 3.4);
    createFurnace3D(51, -26, 3.0);

    const craneBridge = createBox3D(1.5, 0.8, 18.0, 46, 6.2, -26.0, '#D97706', '#FEF08A', interiorGroup);

    // =======================================================================
    // SETOR LESTE & SUDESTE: GRANDE PÁTIO ABERTO DE CARRETAS, CAMINHÕES,
    // BIG-BAGS BRANCOS & ALAMBRADO COM MOURÕES DE CONCRETO
    // =======================================================================
    createBox3D(50, 0.18, 51, 48.0, 0.09, 12, '#09140F', '#2E5A42', wallsGroup);

    const createTrailer3D = (tx: number, tz: number, lengthX: number, widthZ: number, bodyHex: string, edgeHex: string, hasCab = false) => {
      const tg = new THREE.Group();
      createBox3D(lengthX, 3.4, widthZ, tx, 2.1, tz, bodyHex, edgeHex, tg);
      if (hasCab) {
        createBox3D(3.6, 3.5, widthZ * 0.95, tx - lengthX / 2 - 2.0, 2.15, tz, '#1E3A8A', '#93C5FD', tg);
      }
      interiorGroup.add(tg);
    };

    [-5, 0.5, 6, 11.5, 17].forEach((tz, idx) => {
      createTrailer3D(29.5, tz, 11.5, 3.3, idx % 2 === 0 ? '#334155' : '#1E293B', '#94A3B8', false);
    });

    createTrailer3D(64.0, -3.5, 13.0, 3.5, '#064E3B', '#34D399', false);
    createTrailer3D(64.5, 2.5, 11.0, 3.3, '#1E3A8A', '#60A5FA', true);
    [8.2, 13.8, 19.2].forEach(tz => {
      createTrailer3D(64.0, tz, 12.5, 3.3, '#1E293B', '#64748B', false);
    });

    [30, 46, 62].forEach(tx => {
      createTrailer3D(tx, 32.5, 13.0, 3.4, '#1E293B', '#94A3B8', false);
    });

    const bagGeo = new THREE.BoxGeometry(2.3, 2.2, 2.3);
    const bagMat = new THREE.MeshStandardMaterial({ color: '#F1F5F9', roughness: 0.75, metalness: 0.05 });
    const copperTopGeo = new THREE.CylinderGeometry(0.8, 0.8, 0.25, 14);
    const copperTopMat = new THREE.MeshStandardMaterial({ color: '#B45309', roughness: 0.4, metalness: 0.6 });

    for (let bx = 25; bx <= 69; bx += 3.6) {
      for (let bz = 23.5; bz <= 27.0; bz += 3.2) {
        const bag = new THREE.Mesh(bagGeo, bagMat);
        bag.position.set(bx, 1.2, bz);
        bag.castShadow = true;
        bag.receiveShadow = true;
        interiorGroup.add(bag);

        const copperFill = new THREE.Mesh(copperTopGeo, copperTopMat);
        copperFill.position.set(bx, 2.35, bz);
        interiorGroup.add(copperFill);
      }
    }

    const postMat = new THREE.MeshStandardMaterial({ color: '#CBD5E1', roughness: 0.7 });
    for (let px = 16; px <= 73; px += 5) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.32, 3.2, 0.32), postMat);
      post.position.set(px, 1.6, 38.5);
      wallsGroup.add(post);
      const tip = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.85, 0.3), postMat);
      tip.position.set(px, 3.45, 38.25);
      tip.rotation.x = -0.55;
      wallsGroup.add(tip);
    }
    for (let pz = -36; pz <= 36; pz += 5.5) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.32, 3.2, 0.32), postMat);
      post.position.set(73.5, 1.6, pz);
      wallsGroup.add(post);
      const tip = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.85, 0.3), postMat);
      tip.position.set(73.25, 3.45, pz);
      tip.rotation.z = 0.55;
      wallsGroup.add(tip);
    }

    // EMPILHADEIRAS & PÁ CARREGADEIRA 3D EM MOVIMENTO NO PÁTIO
    const forkliftMeshes: THREE.Group[] = [];
    veiculos.forEach((_v, idx) => {
      const fg = new THREE.Group();
      createBox3D(3.2, 2.1, 1.9, 0, 1.05, 0, idx === 2 ? '#E11D48' : '#D97706', '#FEF08A', fg);
      createBox3D(0.3, 3.2, 1.5, 1.7, 1.6, 0, '#374151', '#9CA3AF', fg);
      fg.position.set(38 + idx * 7, 0, 11);
      interiorGroup.add(fg);
      forkliftMeshes.push(fg);
    });

    // DOMO DE RADAR 3D E FEIXES DE ALARME NO ALAMBRADO NORTE
    const radarDomeGeo = new THREE.SphereGeometry(8.5, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const radarDomeMat = new THREE.MeshBasicMaterial({
      color: '#F43F5E',
      transparent: true,
      opacity: 0.22,
      wireframe: true,
    });
    const radarDome = new THREE.Mesh(radarDomeGeo, radarDomeMat);
    radarDome.position.set(5, 0.1, -39);
    scene.add(radarDome);

    // FUNÇÃO QUE RECONSTRÓI AS TORRES E PAREDES DE LASER 3D DO PERÍMETRO
    const dynamicFenceGroup = new THREE.Group();
    perimeterGroup.add(dynamicFenceGroup);

    const rebuildPerimeter3D = (nodes: Node3D[], isBreached: boolean) => {
      while (dynamicFenceGroup.children.length > 0) {
        dynamicFenceGroup.remove(dynamicFenceGroup.children[0]);
      }
      if (nodes.length < 2) return;

      nodes.forEach((node, index) => {
        const next = nodes[(index + 1) % nodes.length];
        const isNorthSegment = index === 1;
        const violated = isBreached && isNorthSegment;

        const tower = new THREE.Mesh(
          new THREE.CylinderGeometry(0.5, 0.7, 5.8, 16),
          new THREE.MeshStandardMaterial({
            color: violated ? '#E11D48' : '#059669',
            roughness: 0.3,
            metalness: 0.7,
          })
        );
        tower.position.set(node.x, 2.9, node.z);
        dynamicFenceGroup.add(tower);

        const beacon = new THREE.Mesh(
          new THREE.SphereGeometry(0.68, 12, 12),
          new THREE.MeshBasicMaterial({ color: violated ? '#FF2E55' : '#34D399' })
        );
        beacon.position.set(node.x, 6.1, node.z);
        dynamicFenceGroup.add(beacon);

        const dx = next.x - node.x;
        const dz = next.z - node.z;
        const length = Math.sqrt(dx * dx + dz * dz);
        const midX = (node.x + next.x) / 2;
        const midZ = (node.z + next.z) / 2;
        const angle = Math.atan2(dx, dz);

        const wallLaser = new THREE.Mesh(
          new THREE.BoxGeometry(0.16, 4.8, length),
          new THREE.MeshBasicMaterial({
            color: violated ? '#F43F5E' : '#10B981',
            transparent: true,
            opacity: violated ? 0.34 : 0.13,
          })
        );
        wallLaser.position.set(midX, 2.4, midZ);
        wallLaser.rotation.y = angle;
        dynamicFenceGroup.add(wallLaser);

        [1.1, 2.3, 3.5, 4.7].forEach(wireY => {
          const wire = new THREE.Mesh(
            new THREE.BoxGeometry(0.22, 0.1, length),
            new THREE.MeshBasicMaterial({ color: violated ? '#FDA4AF' : '#6EE7B7' })
          );
          wire.position.set(midX, wireY, midZ);
          wire.rotation.y = angle;
          dynamicFenceGroup.add(wire);
        });
      });
    };

    rebuildPerimeter3D(stateRef.current.fenceNodes, stateRef.current.activeIncidente);

    // =======================================================================
    // LOOP DE RENDERIZAÇÃO WEBGL + PROJEÇÃO DE RÓTULOS 3D -> 2D
    // =======================================================================
    let animId: number;
    let clock = 0;

    // Pontos 3D âncora para os Rótulos Flutuantes das 2 Quadras Reais (com cameraId p/ Hover PiP!)
    const anchorPoints = [
      {
        id: 'LBL-SEDE-OESTE',
        pos: new THREE.Vector3(-56, 9.2, -19),
        title: 'CAM-02 • SEDE ADMINISTRATIVA AZUL (OUTRO LADO DA RUA)',
        subtitle: 'Telhado Escalonado 4 Níveis • Gradil & Portão Azul',
        color: 'blue' as const,
        cameraId: 'CAM-02',
        onClick: () => {
          flyToRoom(-54, -18, 46, 0.38, 0.62);
          onSelectSector('PESSOAS');
          onSelectCamera('CAM-02');
        },
      },
      {
        id: 'LBL-PORTAO250',
        pos: new THREE.Vector3(23, 7.2, -26),
        title: 'CAM-01 • PORTÃO AZUL Nº 250 & CONTROLE LPR',
        subtitle: 'Constellation Prata (ABC-8E90) • Cancela & Barreira IVA',
        color: 'emerald' as const,
        cameraId: 'CAM-01',
        onClick: () => {
          flyToRoom(23, -26, 44, 0.12, 0.62);
          onSelectSector('PORTOES');
          onSelectCamera('CAM-01');
        },
      },
      {
        id: 'LBL-GEMINADOS',
        pos: new THREE.Vector3(-9, 12.2, 0),
        title: 'CAM-06 • GALPÕES GEMINADOS NORTE-SUL (NAVES 01 & 02)',
        subtitle: 'Bobinas Cobre Mel • Prensa • Cofre & Eclusa',
        color: 'purple' as const,
        cameraId: 'CAM-06',
        onClick: () => {
          flyToRoom(-9, 0, 64, -0.22, 0.64);
          onSelectSector('PESSOAS');
          onSelectCamera('CAM-06');
        },
      },
      {
        id: 'LBL-ARCO',
        pos: new THREE.Vector3(52.5, 11.8, -26.0),
        title: 'CAM-04 • GALPÃO NORDESTE (TETO EM ARCO AZUL/PRATA)',
        subtitle: 'Toldo Azul • Fornos Indução 1.145°C • Ponte 15t',
        color: 'amber' as const,
        cameraId: 'CAM-04',
        onClick: () => {
          flyToRoom(52, -25, 48, 0.30, 0.62);
          onSelectSector('MAQUINAS');
          onSelectCamera('CAM-04');
        },
      },
      {
        id: 'LBL-PATIO-LESTE',
        pos: new THREE.Vector3(48, 6.5, 16),
        title: 'CAM-03 • PÁTIO LESTE DE CARRETAS & BIG-BAGS BRANCOS',
        subtitle: 'Carreta Lonada Verde • Mourões Concreto Inclinados',
        color: 'emerald' as const,
        cameraId: 'CAM-03',
        onClick: () => {
          flyToRoom(48, 15, 56, 0.22, 0.64);
          onSelectSector('FROTAS');
          onSelectCamera('CAM-03');
        },
      },
      {
        id: 'LBL-BREACH',
        pos: new THREE.Vector3(5, 8.8, -39),
        title: 'CAM-05 • INTRUSÃO ALAMBRADO NORTE (P2-P3)',
        subtitle: 'Domo Radar 3D Ativo • Alvo sem RFID',
        color: 'rose' as const,
        cameraId: 'CAM-05',
        onClick: () => {
          flyToRoom(5, -36, 42, 0.05, 0.55);
          onSelectCamera('CAM-05');
        },
      },
      {
        id: 'SUB-TERRENO-SEDE',
        pos: new THREE.Vector3(-57, 4.2, 20),
        title: 'Terreno Sul da Sede (Terra Batida)',
        subtitle: 'Anexo Oeste & Área de Apoio (Foto 5)',
        color: 'amber' as const,
        minZoomDist: 82,
      },
      {
        id: 'SUB-BIGBAGS',
        pos: new THREE.Vector3(48, 4.2, 25.5),
        title: 'Lotes de Big-Bags Brancos (Foto 2)',
        subtitle: 'Sucata de Cobre junto ao Alambrado Sul',
        color: 'blue' as const,
        minZoomDist: 78,
      },
    ];

    let lastIncidenteState = stateRef.current.activeIncidente;
    let lastNodesLen = stateRef.current.fenceNodes.length;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      clock += 0.025;

      const st = stateRef.current;

      // Atualiza iluminação Dia / Entardecer / Noite e Textura Satélite vs Tático
      if (st.lightingMode === 'DIA') {
        scene.background = new THREE.Color(st.mapStyle === 'SATELITE_REAL' ? '#1E2D24' : '#0E1F17');
        ambientLight.intensity = 1.15;
        dirLight.intensity = 1.95;
        dirLight.color.set('#FFFFFF');
        poleLights.forEach(pl => (pl.intensity = 0));
        poleBulbs.forEach(pb => ((pb.material as THREE.MeshBasicMaterial).color.set('#64748B')));
      } else if (st.lightingMode === 'ENTARDECER') {
        scene.background = new THREE.Color('#141820');
        ambientLight.intensity = 0.78;
        dirLight.intensity = 1.35;
        dirLight.color.set('#FDBA74');
        poleLights.forEach(pl => (pl.intensity = 1.2));
        poleBulbs.forEach(pb => ((pb.material as THREE.MeshBasicMaterial).color.set('#FDE047')));
      } else {
        scene.background = new THREE.Color('#040A07');
        ambientLight.intensity = 0.58;
        dirLight.intensity = 1.25;
        dirLight.color.set('#E2E8F0');
        poleLights.forEach(pl => (pl.intensity = 1.8));
        poleBulbs.forEach(pb => ((pb.material as THREE.MeshBasicMaterial).color.set('#FEF08A')));
      }

      groundMat.color.set(st.mapStyle === 'SATELITE_REAL' ? '#132018' : '#06100B');
      streetMat.color.set(st.mapStyle === 'SATELITE_REAL' ? '#1E242B' : '#0C1411');
      (earthYardMesh.material as THREE.MeshStandardMaterial).color.set(
        st.mapStyle === 'SATELITE_REAL' ? '#4A2816' : '#2A170E'
      );
      gridMajor.visible = st.mapStyle === 'CAD_TATICO';

      // Animação física em tempo real dos portões 3D (Portão Nº 250 e Portão Grade Sede)
      const targetGate250Rot = st.isGate250Open ? 0 : Math.PI / 2;
      gate250LeftMesh.rotation.y += (targetGate250Rot - gate250LeftMesh.rotation.y) * 0.12;
      gate250RightMesh.rotation.y += (-targetGate250Rot - gate250RightMesh.rotation.y) * 0.12;

      const targetSedeGateZ = st.isSedeGateOpen ? -25.5 : -34.0;
      sedeSlidingGateMesh.position.z += (targetSedeGateZ - sedeSlidingGateMesh.position.z) * 0.12;

      if (st.activeIncidente !== lastIncidenteState || st.fenceNodes.length !== lastNodesLen) {
        rebuildPerimeter3D(st.fenceNodes, st.activeIncidente);
        lastIncidenteState = st.activeIncidente;
        lastNodesLen = st.fenceNodes.length;
      }

      if (st.autoRotate && !st.isPointerDown) {
        st.desiredTheta += 0.0025;
      }

      st.theta += (st.desiredTheta - st.theta) * 0.09;
      st.phi += (st.desiredPhi - st.phi) * 0.09;
      st.radius += (st.desiredRadius - st.radius) * 0.09;
      st.target.lerp(st.desiredTarget, 0.09);

      const camX = st.target.x + st.radius * Math.sin(st.phi) * Math.sin(st.theta);
      const camY = st.target.y + st.radius * Math.cos(st.phi);
      const camZ = st.target.z + st.radius * Math.sin(st.phi) * Math.cos(st.theta);

      camera.position.set(camX, Math.max(4, camY), camZ);
      camera.lookAt(st.target);

      craneBridge.position.x = 48 + Math.sin(clock * 0.7) * 10;

      forkliftMeshes.forEach((fg, idx) => {
        fg.position.x = 40 + idx * 6 + Math.sin(clock * 0.9 + idx) * 4;
      });

      const targetWallScale = st.buildPhase === 0 || st.buildPhase >= 2 ? 1 : 0.001;
      const targetIntScale = st.buildPhase === 0 || st.buildPhase >= 3 ? 1 : 0.001;
      const targetPerimScale = st.buildPhase === 0 || st.buildPhase >= 4 ? 1 : 0.001;

      wallsGroup.scale.y += (targetWallScale - wallsGroup.scale.y) * 0.12;
      interiorGroup.scale.y += (targetIntScale - interiorGroup.scale.y) * 0.12;
      perimeterGroup.scale.y += (targetPerimScale - perimeterGroup.scale.y) * 0.12;

      roofsGroup.visible = !st.xrayRoofs && (st.buildPhase === 0 || st.buildPhase >= 2);

      radarDome.visible = st.activeIncidente && (st.buildPhase === 0 || st.buildPhase >= 5);
      if (radarDome.visible) {
        const pulse = 1 + Math.sin(clock * 3.5) * 0.2;
        radarDome.scale.set(pulse, pulse, pulse);
        breachLight.intensity = 4.5 + Math.sin(clock * 6) * 2.5;
      } else {
        breachLight.intensity = 0;
      }

      renderer.render(scene, camera);

      if (Math.floor(clock * 40) % 2 === 0 && container) {
        const cw = container.clientWidth;
        const ch = container.clientHeight;
        const projected: ProjectedLabel[] = anchorPoints.map(ap => {
          if (ap.minZoomDist && st.radius > ap.minZoomDist) {
            return { ...ap, screenX: 0, screenY: 0, visible: false };
          }
          const v = ap.pos.clone().project(camera);
          const sx = (v.x * 0.5 + 0.5) * cw;
          const sy = (-(v.y * 0.5) + 0.5) * ch;
          const isBehind = v.z > 1;
          return {
            ...ap,
            screenX: sx,
            screenY: sy,
            visible: !isBehind && sx > 40 && sx < cw - 40 && sy > 50 && sy < ch - 60,
          };
        });
        setLabels(projected);
      }
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, [flyToRoom, onSelectCamera, onSelectSector, funcionarios, veiculos]);

  // =========================================================================
  // CONTROLES DE MOUSE: ORBITAR 360°, PAN E ZOOM 3D
  // =========================================================================
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    stateRef.current.isPointerDown = true;
    stateRef.current.pointerButton = e.button;
    stateRef.current.lastX = e.clientX;
    stateRef.current.lastY = e.clientY;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!stateRef.current.isPointerDown) return;
    const dx = e.clientX - stateRef.current.lastX;
    const dy = e.clientY - stateRef.current.lastY;
    stateRef.current.lastX = e.clientX;
    stateRef.current.lastY = e.clientY;

    if (stateRef.current.pointerButton === 2 || e.shiftKey) {
      const panSpeed = stateRef.current.radius * 0.0012;
      stateRef.current.desiredTarget.x -= dx * panSpeed;
      stateRef.current.desiredTarget.z -= dy * panSpeed;
    } else {
      stateRef.current.desiredTheta -= dx * 0.0065;
      stateRef.current.desiredPhi = Math.max(
        0.22,
        Math.min(1.42, stateRef.current.desiredPhi - dy * 0.0055)
      );
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const moved =
      Math.abs(e.clientX - stateRef.current.lastX) + Math.abs(e.clientY - stateRef.current.lastY);
    stateRef.current.isPointerDown = false;

    if (moved < 5 && tool !== 'ORBIT' && mountRef.current) {
      const rect = mountRef.current.getBoundingClientRect();
      const normX = (e.clientX - rect.left) / rect.width;
      const normY = (e.clientY - rect.top) / rect.height;

      if (tool === 'ADD_TOWER') {
        const worldX = Math.round((normX - 0.5) * 140);
        const worldZ = Math.round((normY - 0.5) * 85);
        setFenceNodes(prev => [...prev, { id: `P${prev.length + 1}`, x: worldX, z: worldZ }]);
        soundAndVoice.playAlertSound('beep');
      } else if (tool === 'ADD_CAMERA') {
        onAddCameraAt(Math.round(normX * 100), Math.round(normY * 100));
        soundAndVoice.playAlertSound('beep');
        setTool('ORBIT');
      }
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const delta = e.deltaY > 0 ? 1.12 : 0.88;
    const nextR = Math.max(22, Math.min(175, Math.round(stateRef.current.desiredRadius * delta)));
    stateRef.current.desiredRadius = nextR;
    setCameraDistance(nextR);
  };

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onContextMenu={e => e.preventDefault()}
      onWheel={handleWheel}
      className={`relative w-full h-full overflow-hidden bg-[#040A07] select-none ${
        tool !== 'ORBIT' ? 'cursor-crosshair' : 'cursor-grab active:cursor-grabbing'
      }`}
    >
      {/* CONTAINER WEBGL THREE.JS */}
      <div ref={mountRef} className="w-full h-full" />

      {/* =====================================================================
          BARRA SUPERIOR ESQUERDA: MODO SATÉLITE/TÁTICO + CICLO DIA/NOITE + PORTÕES 3D
         ===================================================================== */}
      <div
        onPointerDown={e => e.stopPropagation()}
        className="absolute left-4 top-4 z-30 flex items-center flex-wrap gap-2 bg-night-950/90 backdrop-blur-md border border-night-700 p-2 rounded-xl shadow-2xl text-[11px] font-mono"
      >
        <div className="flex items-center bg-night-900 p-0.5 rounded-lg border border-night-800">
          <button
            onClick={() => {
              setMapStyle('CAD_TATICO');
              soundAndVoice.playAlertSound('beep');
            }}
            className={`px-2.5 py-1 rounded-md flex items-center space-x-1.5 transition-all ${
              mapStyle === 'CAD_TATICO'
                ? 'bg-brand-500 text-night-950 font-bold'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>3D Tático</span>
          </button>
          <button
            onClick={() => {
              setMapStyle('SATELITE_REAL');
              soundAndVoice.playAlertSound('beep');
            }}
            className={`px-2.5 py-1 rounded-md flex items-center space-x-1.5 transition-all ${
              mapStyle === 'SATELITE_REAL'
                ? 'bg-sky-400 text-night-950 font-bold'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Terreno Realista</span>
          </button>
        </div>

        {/* Ciclo Dia / Entardecer / Noite */}
        <div className="flex items-center bg-night-900 p-0.5 rounded-lg border border-night-800">
          <button
            onClick={() => {
              setLightingMode('DIA');
              soundAndVoice.playAlertSound('beep');
            }}
            className={`px-2 py-1 rounded-md flex items-center space-x-1 transition-all ${
              lightingMode === 'DIA'
                ? 'bg-amber-400 text-night-950 font-bold'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            <span>Dia</span>
          </button>
          <button
            onClick={() => {
              setLightingMode('ENTARDECER');
              soundAndVoice.playAlertSound('beep');
            }}
            className={`px-2 py-1 rounded-md flex items-center space-x-1 transition-all ${
              lightingMode === 'ENTARDECER'
                ? 'bg-orange-500 text-white font-bold'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Sunset className="w-3.5 h-3.5" />
            <span>Entardecer</span>
          </button>
          <button
            onClick={() => {
              setLightingMode('NOITE');
              soundAndVoice.playAlertSound('beep');
            }}
            className={`px-2 py-1 rounded-md flex items-center space-x-1 transition-all ${
              lightingMode === 'NOITE'
                ? 'bg-indigo-500 text-white font-bold'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Moon className="w-3.5 h-3.5" />
            <span>Noite (Postes LED)</span>
          </button>
        </div>

        {/* Controles Diretos dos Portões 3D */}
        <div className="flex items-center space-x-1.5 border-l border-night-700 pl-2">
          <button
            onClick={() => handleToggleGate3D('GATE-01')}
            className={`px-2.5 py-1 rounded-lg border flex items-center space-x-1 transition-all ${
              isGate250Open
                ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
            }`}
          >
            {isGate250Open ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
            <span>Portão Nº 250: {isGate250Open ? 'ABERTO' : 'TRAVADO'}</span>
          </button>

          <button
            onClick={() => handleToggleGate3D('GATE-02')}
            className={`px-2.5 py-1 rounded-lg border flex items-center space-x-1 transition-all ${
              isSedeGateOpen
                ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
            }`}
          >
            {isSedeGateOpen ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
            <span>Grade Sede: {isSedeGateOpen ? 'ABERTO' : 'TRAVADO'}</span>
          </button>
        </div>
      </div>

      {/* =====================================================================
          HOVER PICTURE-IN-PICTURE (MINI-PLAYER FLUTUANTE AO PASSAR O MOUSE NA ETIQUETA 3D)
         ===================================================================== */}
      {hoveredCam && (
        <div
          style={{
            left: `${Math.min(window.innerWidth - 290, Math.max(20, hoveredCam.screenX + 18))}px`,
            top: `${Math.min(window.innerHeight - 210, Math.max(20, hoveredCam.screenY - 95))}px`,
          }}
          className="fixed z-50 w-64 rounded-2xl bg-night-950/95 backdrop-blur-md border border-brand-400/70 shadow-2xl overflow-hidden pointer-events-none animate-fadeIn"
        >
          <div className="px-2.5 py-1.5 bg-night-900 border-b border-night-800 flex items-center justify-between text-[10px] font-mono">
            <div className="flex items-center space-x-1.5 truncate">
              <Camera className="w-3 h-3 text-brand-400 shrink-0" />
              <span className="font-bold text-brand-300">{hoveredCam.cam.id}</span>
              <span className="text-white truncate">{hoveredCam.cam.setor}</span>
            </div>
            <span
              className={`px-1.5 py-0.2 rounded font-bold text-[9px] ${
                hoveredCam.cam.status === 'ALERTA'
                  ? 'bg-rose-500 text-white'
                  : 'bg-emerald-500/20 text-emerald-400'
              }`}
            >
              {hoveredCam.cam.status}
            </span>
          </div>
          <div className="relative w-full h-32 bg-black">
            <img
              src={getCameraImage(hoveredCam.cam.id)}
              alt={hoveredCam.cam.nome}
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-1.5 inset-x-1.5 bg-black/80 px-2 py-0.5 rounded text-[9px] font-mono text-gray-200 truncate">
              {hoveredCam.cam.nome}
            </div>
          </div>
          <div className="px-2.5 py-1 bg-night-950 text-[9px] font-mono text-gray-400 flex items-center justify-between">
            <span>{hoveredCam.cam.ip} • {hoveredCam.cam.resolucao}</span>
            <span className="text-brand-400">Clique p/ voar &amp; focar</span>
          </div>
        </div>
      )}

      {/* =====================================================================
          ETIQUETAS 3D PROJETADAS EM TEMPO REAL SOBRE AS 2 QUADRAS REAIS
         ===================================================================== */}
      <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
        {labels.map(lbl => {
          if (!lbl.visible) return null;
          const badgeStyle =
            lbl.color === 'rose'
              ? 'bg-rose-950/90 border-rose-500/70 text-rose-200 shadow-lg'
              : lbl.color === 'amber'
              ? 'bg-night-950/85 border-amber-500/60 text-amber-200'
              : lbl.color === 'purple'
              ? 'bg-night-950/85 border-purple-400/60 text-purple-200'
              : lbl.color === 'blue'
              ? 'bg-night-950/90 border-sky-400/60 text-sky-200'
              : 'bg-night-950/85 border-brand-400/60 text-emerald-200';

          return (
            <div
              key={lbl.id}
              style={{
                left: `${lbl.screenX}px`,
                top: `${lbl.screenY}px`,
              }}
              onMouseEnter={e => {
                if (lbl.cameraId) {
                  const found = cameras.find(c => c.id === lbl.cameraId);
                  if (found) {
                    setHoveredCam({ cam: found, screenX: e.clientX, screenY: e.clientY });
                  }
                }
              }}
              onMouseMove={e => {
                if (lbl.cameraId) {
                  const found = cameras.find(c => c.id === lbl.cameraId);
                  if (found) {
                    setHoveredCam({ cam: found, screenX: e.clientX, screenY: e.clientY });
                  }
                }
              }}
              onMouseLeave={() => setHoveredCam(null)}
              onClick={e => {
                e.stopPropagation();
                lbl.onClick?.();
              }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto cursor-pointer px-2.5 py-1 rounded-lg border backdrop-blur-md transition-transform hover:scale-105 ${badgeStyle}`}
            >
              <div className="text-[10px] font-mono font-bold text-white whitespace-nowrap">
                {lbl.title}
              </div>
              <div className="text-[9px] font-mono opacity-80 whitespace-nowrap">
                {lbl.subtitle}
              </div>
            </div>
          );
        })}
      </div>

      {/* =====================================================================
          MENU DE VOO DE CÂMERA 3D POR SETOR REAL (CANTO SUPERIOR DIREITO)
         ===================================================================== */}
      <div
        onPointerDown={e => e.stopPropagation()}
        className="absolute right-4 top-4 z-30 flex flex-col space-y-1.5 bg-night-950/90 backdrop-blur-md border border-night-700 p-2.5 rounded-xl shadow-2xl text-[11px] font-mono"
      >
        <div className="flex items-center justify-between px-2 pt-0.5">
          <span className="text-[9px] text-brand-400 uppercase font-bold tracking-wider">
            Voo Câmera 3D (2 Quadras):
          </span>
          <span className="text-[8px] px-1.5 py-0.2 rounded bg-emerald-950 border border-emerald-800 text-emerald-400">
            2D⇄3D SYNC
          </span>
        </div>

        <button
          onClick={() => focusSector3D('COMPLEXO_COMPLETO')}
          className={`px-2.5 py-1.5 rounded-lg border text-left flex items-center justify-between space-x-3 transition-colors ${
            currentSectorId === 'COMPLEXO_COMPLETO'
              ? 'bg-brand-500/20 text-brand-300 border-brand-400 font-bold'
              : 'bg-night-900 hover:bg-brand-500/20 text-gray-200 hover:text-brand-300 border-night-800'
          }`}
        >
          <span>Complexo Completo 3D</span>
          <span className="text-[9px] text-gray-500">122m</span>
        </button>

        <button
          onClick={() => focusSector3D('SEDE_ADMIN')}
          className={`px-2.5 py-1.5 rounded-lg border text-left flex items-center justify-between space-x-3 transition-colors ${
            currentSectorId === 'SEDE_ADMIN'
              ? 'bg-sky-500/20 text-sky-200 border-sky-400 font-bold'
              : 'bg-night-900 hover:bg-sky-500/20 text-sky-200 border-night-800'
          }`}
        >
          <span>Sede Admin (Outro Lado Rua)</span>
          <span className="text-[9px] text-sky-400">Fotos 5/6</span>
        </button>

        <button
          onClick={() => focusSector3D('PORTAO_250')}
          className={`px-2.5 py-1.5 rounded-lg border text-left flex items-center justify-between space-x-3 transition-colors ${
            currentSectorId === 'PORTAO_250'
              ? 'bg-brand-500/20 text-brand-300 border-brand-400 font-bold'
              : 'bg-night-900 hover:bg-brand-500/20 text-gray-200 hover:text-brand-300 border-night-800'
          }`}
        >
          <span>Portão Azul Nº 250 &amp; LPR</span>
          <span className="text-[9px] text-brand-400">Foto 3</span>
        </button>

        <button
          onClick={() => focusSector3D('GALPOES_GEMINADOS')}
          className={`px-2.5 py-1.5 rounded-lg border text-left flex items-center justify-between space-x-3 transition-colors ${
            currentSectorId === 'GALPOES_GEMINADOS'
              ? 'bg-purple-500/20 text-purple-200 border-purple-400 font-bold'
              : 'bg-night-900 hover:bg-purple-500/20 text-purple-200 border-night-800'
          }`}
        >
          <span>Galpões Geminados 01 e 02</span>
          <span className="text-[9px] text-purple-400">Foto 1</span>
        </button>

        <button
          onClick={() => focusSector3D('GALPAO_ARCO')}
          className={`px-2.5 py-1.5 rounded-lg border text-left flex items-center justify-between space-x-3 transition-colors ${
            currentSectorId === 'GALPAO_ARCO'
              ? 'bg-amber-500/20 text-amber-200 border-amber-400 font-bold'
              : 'bg-night-900 hover:bg-amber-500/20 text-amber-200 border-night-800'
          }`}
        >
          <span>Galpão de Arco &amp; Toldo Azul</span>
          <span className="text-[9px] text-amber-400">Foto 3</span>
        </button>

        <button
          onClick={() => focusSector3D('PATIO_CARRETAS')}
          className={`px-2.5 py-1.5 rounded-lg border text-left flex items-center justify-between space-x-3 transition-colors ${
            currentSectorId === 'PATIO_CARRETAS'
              ? 'bg-brand-500/20 text-brand-300 border-brand-400 font-bold'
              : 'bg-night-900 hover:bg-brand-500/20 text-gray-200 hover:text-brand-300 border-night-800'
          }`}
        >
          <span>Pátio Carretas &amp; Big-Bags</span>
          <span className="text-[9px] text-brand-400">Foto 2</span>
        </button>

        <button
          onClick={() => focusSector3D('ALAMBRADO_NORTE')}
          className={`px-2.5 py-1.5 rounded-lg border text-left flex items-center justify-between space-x-3 transition-colors ${
            currentSectorId === 'ALAMBRADO_NORTE'
              ? 'bg-rose-950/70 text-rose-200 border-rose-500 font-bold'
              : 'bg-rose-950/40 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30'
          }`}
        >
          <span>Alambrado Norte (Alarme)</span>
          <span className="text-[9px] text-rose-400">Radar</span>
        </button>

        <button
          onClick={() => setXrayRoofs(!xrayRoofs)}
          className={`px-2.5 py-1.5 rounded-lg text-[10px] border flex items-center justify-between ${
            xrayRoofs
              ? 'bg-brand-500/20 text-brand-300 border-brand-400'
              : 'bg-night-900 text-gray-300 border-night-800'
          }`}
        >
          <span className="flex items-center space-x-1.5">
            <Eye className="w-3.5 h-3.5" />
            <span>{xrayRoofs ? 'Raio-X (Sem Telhado)' : 'Telhados Reais: ON'}</span>
          </span>
        </button>

        <div className="border-t border-night-800 pt-1.5 mt-1 flex items-center justify-between px-1">
          <button
            onClick={() => {
              stateRef.current.desiredRadius = Math.min(170, stateRef.current.desiredRadius + 18);
              setCameraDistance(stateRef.current.desiredRadius);
            }}
            className="p-1.5 rounded bg-night-900 hover:bg-night-800 text-gray-300 border border-night-700"
            title="Afastar Câmera 3D"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-brand-400 font-bold">{cameraDistance}m</span>
          <button
            onClick={() => {
              stateRef.current.desiredRadius = Math.max(24, stateRef.current.desiredRadius - 18);
              setCameraDistance(stateRef.current.desiredRadius);
            }}
            className="p-1.5 rounded bg-night-900 hover:bg-night-800 text-gray-300 border border-night-700"
            title="Aproximar Câmera 3D"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>

        <button
          onClick={() => setAutoRotate(!autoRotate)}
          className={`px-2 py-1 rounded text-[10px] border ${
            autoRotate
              ? 'bg-brand-500/20 text-brand-300 border-brand-400'
              : 'bg-night-900 text-gray-400 border-night-800'
          }`}
        >
          {autoRotate ? 'Giro Orbital 360°: ON' : 'Giro Orbital 360°: OFF'}
        </button>
      </div>

      {/* BANNER DISCRETO DE CONSTRUÇÃO 3D EM 5 FASES */}
      {buildPhase > 0 && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-40 bg-night-950/95 border border-brand-500/50 px-5 py-2 rounded-xl shadow-2xl flex items-center space-x-3 text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
          <span className="text-white font-semibold">{buildTitle}</span>
        </div>
      )}

      {/* =====================================================================
          DOCK TÁTICO INFERIOR CENTRALIZADO
         ===================================================================== */}
      <footer
        onPointerDown={e => e.stopPropagation()}
        className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 px-3.5 py-2 rounded-xl bg-night-950/90 backdrop-blur-md border border-night-700 flex items-center space-x-2 shadow-2xl flex-wrap justify-center gap-y-2"
      >
        <button
          onClick={start3DConstruction}
          disabled={buildPhase > 0}
          className="px-3.5 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-400 text-night-950 font-mono font-bold text-xs flex items-center space-x-1.5 transition-all"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>
            {buildPhase > 0 ? `Erguendo 3D (${buildPhase}/5)...` : 'Construir Maquete 3D Real (5 Fases)'}
          </span>
        </button>

        <span className="text-night-700">|</span>

        <button
          onClick={() => setTool('ORBIT')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold flex items-center space-x-1.5 border transition-all ${
            tool === 'ORBIT'
              ? 'bg-brand-500/20 text-brand-300 border-brand-400'
              : 'bg-night-900 text-gray-300 border-night-800 hover:text-white'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Orbitar 360°</span>
        </button>

        <button
          onClick={() => {
            setTool(tool === 'ADD_TOWER' ? 'ORBIT' : 'ADD_TOWER');
            soundAndVoice.playAlertSound('beep');
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold flex items-center space-x-1.5 border transition-all ${
            tool === 'ADD_TOWER'
              ? 'bg-brand-500/20 text-brand-300 border-brand-400'
              : 'bg-night-900 text-gray-300 border-night-800 hover:text-white'
          }`}
        >
          <PenTool className="w-3.5 h-3.5" />
          <span>+ Torre 3D ({fenceNodes.length})</span>
        </button>

        <button
          onClick={() => {
            setFenceNodes(DEFAULT_FENCE_3D);
            soundAndVoice.playAlertSound('beep');
          }}
          className="px-2.5 py-1.5 rounded-lg text-xs font-mono bg-night-900 hover:bg-night-800 text-gray-300 border border-night-800 flex items-center space-x-1"
          title="Restaurar Perímetro Padrão"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onSwitchTo2D}
          className="px-3 py-1.5 rounded-lg text-xs font-mono font-semibold flex items-center space-x-1.5 border bg-night-900 text-gray-300 border-night-800 hover:text-brand-300 hover:border-brand-500/40 transition-all"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Ver Planta CAD 2D</span>
        </button>

        <button
          onClick={onSimulateIncident}
          className="px-3 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/40 text-xs font-mono font-bold flex items-center space-x-1.5 transition-all"
        >
          <Sparkles className="w-3.5 h-3.5 text-rose-400" />
          <span>Simular Invasão 3D</span>
        </button>
      </footer>
    </div>
  );
};
