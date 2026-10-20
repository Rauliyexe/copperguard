# 🛡️ CopperGuard — Torre de Segurança Perimetral, OEE & Telemetria Industrial

O **CopperGuard** é uma plataforma dedicada e independente de monitoramento e telemetria industrial em tempo real, concebida para operar integrada ao ecossistema do **CopperOS**.

---

## 🎯 Escopo Operacional Implementado

1. **🚨 Mapeamento e Registro de Pontos de Risco (Câmeras + Alarmes):**
   - Zonas perimetrais críticas (Muros, Pátio de Sucatas, Fornos, Almoxarifado Nobre, Balança).
   - Sensores industriais (Cerca elétrica alta voltagem com corte/aterramento, barreiras infravermelho IVA duplo, analíticos de linha virtual IA Tripwire, termometria infravermelha de fornos).
   - Fila de auditoria de disparos e incidentes em tempo real.
2. **🚚 Registro Completo de Entradas e Saídas (Portaria & Metrologia):**
   - Leitura de placas via LPR.
   - Integração com indicador de peso da Balança Líder 80t (RS-232 + TCP/IP Ethernet).
   - Captura de peso bruto, tara, líquido real e validação de divergência com a NF-e.
   - Controle de fluxo e permanência de motoristas, terceiros e colaboradores.
3. **👥 Horas Trabalhadas & Produtividade por Funcionário:**
   - Horas ativas no turno vs. horas meta.
   - Rendimento individual em kg/hora de cobre e conformidade de pausas regulamentares (NR-15 e NR-12).
4. **⚙️ Horas Trabalhadas & OEE por Máquina:**
   - Fornos de Indução de Cobre, Prensa de Sucata, Balança Rodoviária Líder 80t e Ponte Rolante.
   - Cálculo automático dos 3 fatores de OEE (Disponibilidade, Performance e Qualidade).
   - Monitoramento de temperatura refratária (°C) e consumo elétrico específico (kWh/ton).
5. **🚜 Horas Trabalhadas & Produtividade por Veículo (Frotas Internas):**
   - Telemetria de Empilhadeiras, Pás Carregadeiras e Caminhões Roll-on.
   - Horímetro total, horas em operação no turno e horas ociosas com motor ligado.
   - Velocidade instantânea no pátio com alerta de excesso (> 10 km/h).
6. **📊 Dashboard Geral ao Vivo (Cockpit Executivo):**
   - Indicadores consolidados em tempo real com relógio, KPIs e feed de eventos.
7. **📹 Video Wall de Câmeras ao Vivo:**
   - Grid dinâmico (Mosaico de 6 ou 4 câmeras e modo individual maximizado).
   - Overlays analíticos de IA (detecção de alvos humanos, placas e temperatura).
   - Botão para **Simulação de Intrusão** que dispara o alarme, alerta no topo e foca imediatamente na câmera do muro perimetral violado.

---

## 🎨 Design System e Identidade Visual

O CopperGuard compartilha rigorosamente as convenções visuais do CopperOS:
- **Tema:** Dark mode industrial (`night-950`, `night-900`, `night-850`, `night-800`).
- **Acento e Marca:** Verde Esmeralda canônico (`#10B981` / `brand-500`).
- **Tipografia:** Inter (textos gerais) + JetBrains Mono (métricas, números e placas).

---

## 🚀 Como Executar

```bash
cd CopperGuard
npm install
npm run dev
```

A aplicação roda por padrão na porta `5174` (para não conflitar com a porta `5173` do CopperOS).
