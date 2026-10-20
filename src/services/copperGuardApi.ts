import { CameraStream, PortaoSeguranca, IncidenteSeguranca, LogAcionamentoPortao } from '../types';
import { mockCameras, mockPortoes, mockIncidentes, mockLogsPortoes } from '../mockData';

export interface ApiConfig {
  baseUrl: string;
  nvrHost: string;
  nvrPort: number;
  useLiveStream: boolean;
  authToken?: string;
  status: 'ONLINE' | 'SIMULATED' | 'CONNECTING' | 'ERROR';
}

const DEFAULT_API_CONFIG: ApiConfig = {
  baseUrl: 'http://localhost:8000/api/v1',
  nvrHost: '192.168.10.200',
  nvrPort: 8000,
  useLiveStream: false,
  authToken: 'cpr_guard_jwt_token_demo_2026',
  status: 'SIMULATED'
};

const STORAGE_KEYS = {
  CAMERAS: 'copperguard_cameras_v3',
  API_CONFIG: 'copperguard_api_config_v1',
  GATES: 'copperguard_gates_v1',
  LOGS_GATES: 'copperguard_logs_gates_v1',
};

class CopperGuardApiService {
  private config: ApiConfig;

  constructor() {
    this.config = this.loadConfig();
  }

  public loadConfig(): ApiConfig {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.API_CONFIG);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return DEFAULT_API_CONFIG;
  }

  public saveConfig(newConfig: Partial<ApiConfig>): ApiConfig {
    this.config = { ...this.config, ...newConfig };
    try {
      localStorage.setItem(STORAGE_KEYS.API_CONFIG, JSON.stringify(this.config));
    } catch {
      // ignore
    }
    return this.config;
  }

  public getConfig(): ApiConfig {
    return { ...this.config };
  }

  // ==========================================
  // CÂMERAS & VIGILÂNCIA CFTV API
  // ==========================================

  public async getCameras(): Promise<CameraStream[]> {
    if (this.config.status === 'ONLINE' && this.config.baseUrl) {
      try {
        const res = await fetch(`${this.config.baseUrl}/cameras`, {
          headers: {
            'Authorization': `Bearer ${this.config.authToken || ''}`,
            'Content-Type': 'application/json'
          }
        });
        if (res.ok) {
          const data = await res.json();
          return data;
        }
      } catch (err) {
        console.warn('[CopperGuard API] Falha na conexão com NVR/Backend. Usando cache local.', err);
      }
    }

    // Fallback persistido no localStorage
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CAMERAS);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return mockCameras;
  }

  public async createCamera(
    cameraData: Omit<CameraStream, 'id' | 'status' | 'eventosUltimaHora'> & {
      id?: string;
      status?: CameraStream['status'];
      eventosUltimaHora?: number;
    }
  ): Promise<CameraStream> {
    const existing = await this.getCameras();
    const newId = cameraData.id || `CAM-0${existing.length + 1}`;
    const newCamera: CameraStream = {
      status: 'ONLINE',
      eventosUltimaHora: 0,
      ...cameraData,
      id: newId
    };

    if (this.config.status === 'ONLINE' && this.config.baseUrl) {
      try {
        const res = await fetch(`${this.config.baseUrl}/cameras`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.authToken || ''}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(newCamera)
        });
        if (res.ok) {
          return await res.json();
        }
      } catch (err) {
        console.warn('[CopperGuard API] Falha ao enviar nova câmera via REST. Salvando localmente.', err);
      }
    }

    const updated = [...existing, newCamera];
    try {
      localStorage.setItem(STORAGE_KEYS.CAMERAS, JSON.stringify(updated));
    } catch {
      // ignore
    }
    return newCamera;
  }

  public async updateCamera(id: string, updates: Partial<CameraStream>): Promise<CameraStream> {
    const cameras = await this.getCameras();
    const index = cameras.findIndex(c => c.id === id);
    if (index === -1) throw new Error(`Câmera ${id} não encontrada.`);

    const updatedCamera = { ...cameras[index], ...updates };
    cameras[index] = updatedCamera;

    if (this.config.status === 'ONLINE' && this.config.baseUrl) {
      try {
        await fetch(`${this.config.baseUrl}/cameras/${id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${this.config.authToken || ''}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updates)
        });
      } catch (err) {
        console.warn('[CopperGuard API] Falha ao sincronizar atualização de câmera com API.', err);
      }
    }

    try {
      localStorage.setItem(STORAGE_KEYS.CAMERAS, JSON.stringify(cameras));
    } catch {
      // ignore
    }
    return updatedCamera;
  }

  public async deleteCamera(id: string): Promise<boolean> {
    const cameras = await this.getCameras();
    const filtered = cameras.filter(c => c.id !== id);

    if (this.config.status === 'ONLINE' && this.config.baseUrl) {
      try {
        await fetch(`${this.config.baseUrl}/cameras/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${this.config.authToken || ''}` }
        });
      } catch (err) {
        console.warn('[CopperGuard API] Falha ao deletar câmera na API.', err);
      }
    }

    try {
      localStorage.setItem(STORAGE_KEYS.CAMERAS, JSON.stringify(filtered));
    } catch {
      // ignore
    }
    return true;
  }

  // Comandos PTZ (Pan / Tilt / Zoom / Foco / Iris)
  public async sendPtzCommand(
    camId: string, 
    action: 'PAN_LEFT' | 'PAN_RIGHT' | 'TILT_UP' | 'TILT_DOWN' | 'ZOOM_IN' | 'ZOOM_OUT' | 'FOCUS_IN' | 'FOCUS_OUT' | 'IRIS_UP' | 'IRIS_DOWN' | 'PRESET_HOME'
  ): Promise<{ success: boolean; message: string }> {
    if (this.config.status === 'ONLINE' && this.config.baseUrl) {
      try {
        const res = await fetch(`${this.config.baseUrl}/cameras/${camId}/ptz`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.authToken || ''}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ action, timestamp: Date.now() })
        });
        if (res.ok) return await res.json();
      } catch (err) {
        console.warn('[CopperGuard API] PTZ enviado localmente.', err);
      }
    }
    return { success: true, message: `Comando PTZ ${action} executado com sucesso na câmera ${camId}.` };
  }

  // Exportação / Download de Clipe Forense
  public async exportClip(camId: string, durationMinutes: number = 60): Promise<{ downloadUrl: string; filename: string }> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `CCTV_${camId}_${timestamp}_${durationMinutes}min.mp4`;

    if (this.config.status === 'ONLINE' && this.config.baseUrl) {
      try {
        const res = await fetch(`${this.config.baseUrl}/cameras/${camId}/export?duration=${durationMinutes}`, {
          headers: { 'Authorization': `Bearer ${this.config.authToken || ''}` }
        });
        if (res.ok) {
          const blob = await res.blob();
          const downloadUrl = URL.createObjectURL(blob);
          return { downloadUrl, filename };
        }
      } catch (err) {
        console.warn('[CopperGuard API] Falha ao requisitar clipe via REST. Gerando clipe simulado.', err);
      }
    }

    // Retorna arquivo de simulação instantâneo
    return {
      downloadUrl: `/cameras/${camId === 'CAM-01' || camId === 'CAM-02' ? 'cam-balanca.png' : camId === 'CAM-04' ? 'cam-forno.png' : 'cam-perimetro.png'}`,
      filename
    };
  }

  // ==========================================
  // PORTÕES, CANCELAS E ECLUSAS API
  // ==========================================

  public async getGates(): Promise<PortaoSeguranca[]> {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.GATES);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return mockPortoes;
  }

  public async toggleGate(gateId: string): Promise<PortaoSeguranca> {
    const gates = await this.getGates();
    const gate = gates.find(g => g.id === gateId);
    if (!gate) throw new Error(`Portão ${gateId} não encontrado.`);

    const abrindo = gate.status !== 'ABERTO';
    const novoStatus: PortaoSeguranca['status'] = abrindo ? 'ABERTO' : 'FECHADO_TRAVADO';
    const horario = new Date().toLocaleTimeString('pt-BR');

    const updatedGate: PortaoSeguranca = {
      ...gate,
      status: novoStatus,
      travaEletromagnetica: !abrindo,
      ultimoAcionamento: `${horario} (${abrindo ? 'Abertura Remota API' : 'Travado API'})`
    };

    const updatedGates = gates.map(g => g.id === gateId ? updatedGate : g);
    try {
      localStorage.setItem(STORAGE_KEYS.GATES, JSON.stringify(updatedGates));
    } catch {
      // ignore
    }
    return updatedGate;
  }

  // Testar Conectividade da API
  public async testConnection(): Promise<{ ok: boolean; latencyMs: number; message: string }> {
    const start = performance.now();
    try {
      const res = await fetch(`${this.config.baseUrl}/health`, { method: 'GET', signal: AbortSignal.timeout(2500) });
      const latency = Math.round(performance.now() - start);
      if (res.ok) {
        this.saveConfig({ status: 'ONLINE' });
        return { ok: true, latencyMs: latency, message: `Conexão REST API estabelecida com sucesso (${latency}ms).` };
      }
    } catch {
      // fallback para modo simulado
    }
    this.saveConfig({ status: 'SIMULATED' });
    return { ok: false, latencyMs: 12, message: 'Servidor REST não detectado na porta especificada. Operando em modo de emulação local de alta fidelidade.' };
  }
}

export const copperGuardApi = new CopperGuardApiService();
