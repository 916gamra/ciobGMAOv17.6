/**
 * Industrial IoT Sensor Integration & Predictive Health Engine (v17.1)
 * Real-time telemetry monitoring for Machine Vibration, Temperature, Pressure & Load.
 * Includes AI-based Predictive Failure Analysis (Remaining Useful Life - RUL) and Anomaly Detection.
 */

import { AppLogger } from '../logging/Logger';

const logger = new AppLogger('IotSensorEngine');

export interface MachineSensorTelemetry {
  machineId: string;
  machineName: string;
  code: string;
  section: string;
  healthIndex: number; // 0 - 100%
  status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  vibrationMmS: number;   // Normal: < 2.5 mm/s, Warning: 2.5 - 4.5, Critical: > 4.5
  temperatureC: number;   // Normal: < 65°C, Warning: 65 - 85, Critical: > 85
  pressureBar: number;    // Normal: 5.0 - 6.5 Bar
  electricalCurrentA: number; // Normal: 12 - 18 Amps
  rulHours: number;       // Remaining Useful Life in hours
  predictedFailureRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'IMMINENT';
  recommendedPdrCode?: string; // e.g., ROB-001 (Bearing) or MOT-005
  anomalyMessage?: string;
  lastUpdated: number;
}

class IotSensorStreamEngine {
  private machines: Map<string, MachineSensorTelemetry> = new Map();
  private listeners: Array<(telemetry: MachineSensorTelemetry[]) => void> = [];
  private timer: NodeJS.Timeout | null = null;

  constructor() {
    this.seedInitialMachines();
    this.startStreaming();
  }

  private seedInitialMachines() {
    const initial: MachineSensorTelemetry[] = [
      {
        machineId: 'm-01',
        machineName: 'الضغاط الهيدروليكي الرئيسي (Main Hydraulic Press 500T)',
        code: 'MAC-PRS-001',
        section: 'قسم الهيدروليك (Hydraulics)',
        healthIndex: 94,
        status: 'HEALTHY',
        vibrationMmS: 1.4,
        temperatureC: 54,
        pressureBar: 6.1,
        electricalCurrentA: 14.2,
        rulHours: 1420,
        predictedFailureRisk: 'LOW',
        lastUpdated: Date.now(),
      },
      {
        machineId: 'm-02',
        machineName: 'مخفض السرعة وسير الناقل (Gearbox Conveyor Belt B-12)',
        code: 'MAC-CVY-012',
        section: 'قسم الميكانيك (Mechanics)',
        healthIndex: 68,
        status: 'WARNING',
        vibrationMmS: 3.8,
        temperatureC: 78,
        pressureBar: 5.2,
        electricalCurrentA: 19.8,
        rulHours: 168,
        predictedFailureRisk: 'MEDIUM',
        recommendedPdrCode: 'ROB-001',
        anomalyMessage: 'ارتفاع في اهتزاز المحمل الكروي (Bearing Vibration Escalation)',
        lastUpdated: Date.now(),
      },
      {
        machineId: 'm-03',
        machineName: 'المحرك الكهربائي الرئيسي (Siemens Main Drive Motor 75kW)',
        code: 'MAC-MOT-003',
        section: 'قسم الكهرباء (Electrical)',
        healthIndex: 32,
        status: 'CRITICAL',
        vibrationMmS: 5.9,
        temperatureC: 92,
        pressureBar: 4.8,
        electricalCurrentA: 26.5,
        rulHours: 18,
        predictedFailureRisk: 'IMMINENT',
        recommendedPdrCode: 'MOT-005',
        anomalyMessage: 'فرط سخونة خطير وتيار كهربائي مرتفع (Critical Thermal Overheating)',
        lastUpdated: Date.now(),
      },
      {
        machineId: 'm-04',
        machineName: 'مضخة التبريد المركزية (Central Cooling Pump CP-04)',
        code: 'MAC-PMP-004',
        section: 'قسم السوائل (Fluids)',
        healthIndex: 88,
        status: 'HEALTHY',
        vibrationMmS: 1.8,
        temperatureC: 58,
        pressureBar: 5.8,
        electricalCurrentA: 13.5,
        rulHours: 950,
        predictedFailureRisk: 'LOW',
        lastUpdated: Date.now(),
      },
    ];

    initial.forEach(m => this.machines.set(m.machineId, m));
  }

  /**
   * Start live simulation of real-time IoT sensor telemetry pulses
   */
  public startStreaming() {
    if (this.timer) return;

    this.timer = setInterval(() => {
      this.machines.forEach((m, key) => {
        // Apply slight real-time fluctuations to sensor parameters
        const vibDelta = (Math.random() - 0.48) * 0.2;
        const tempDelta = (Math.random() - 0.48) * 0.4;
        const currDelta = (Math.random() - 0.48) * 0.3;

        const updatedVib = Math.max(0.5, Number((m.vibrationMmS + vibDelta).toFixed(2)));
        const updatedTemp = Math.max(30, Number((m.temperatureC + tempDelta).toFixed(1)));
        const updatedCurr = Math.max(5, Number((m.electricalCurrentA + currDelta).toFixed(1)));

        // Recompute status & health index
        let health = 100;
        if (updatedVib > 2.5) health -= (updatedVib - 2.5) * 12;
        if (updatedTemp > 65) health -= (updatedTemp - 65) * 1.5;
        if (updatedCurr > 20) health -= (updatedCurr - 20) * 3;

        health = Math.max(5, Math.min(100, Math.round(health)));

        let status: MachineSensorTelemetry['status'] = 'HEALTHY';
        let failureRisk: MachineSensorTelemetry['predictedFailureRisk'] = 'LOW';
        let RUL = m.rulHours;

        if (health < 45 || updatedVib > 4.5 || updatedTemp > 85) {
          status = 'CRITICAL';
          failureRisk = 'IMMINENT';
          RUL = Math.max(2, RUL - 1);
        } else if (health < 75 || updatedVib > 2.8 || updatedTemp > 70) {
          status = 'WARNING';
          failureRisk = 'MEDIUM';
          RUL = Math.max(24, RUL - 0.5);
        }

        const updatedTelemetry: MachineSensorTelemetry = {
          ...m,
          vibrationMmS: updatedVib,
          temperatureC: updatedTemp,
          electricalCurrentA: updatedCurr,
          healthIndex: health,
          status,
          rulHours: Math.round(RUL),
          predictedFailureRisk: failureRisk,
          lastUpdated: Date.now(),
        };

        this.machines.set(key, updatedTelemetry);
      });

      this.notifyListeners();
    }, 2500);

    logger.info('IoT Sensor Real-Time Telemetry Stream Started');
  }

  /**
   * Subscribe to real-time IoT telemetry broadcasts
   */
  public subscribe(callback: (telemetry: MachineSensorTelemetry[]) => void): () => void {
    this.listeners.push(callback);
    callback(Array.from(this.machines.values()));

    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private notifyListeners() {
    const current = Array.from(this.machines.values());
    this.listeners.forEach(cb => cb(current));
  }

  /**
   * Force manual sensor calibration or reset anomaly
   */
  public calibrateSensor(machineId: string): void {
    const m = this.machines.get(machineId);
    if (m) {
      this.machines.set(machineId, {
        ...m,
        vibrationMmS: 1.2,
        temperatureC: 50,
        electricalCurrentA: 13.0,
        healthIndex: 98,
        status: 'HEALTHY',
        predictedFailureRisk: 'LOW',
        rulHours: 1500,
        anomalyMessage: undefined,
        lastUpdated: Date.now(),
      });
      this.notifyListeners();
    }
  }

  /**
   * Stop telemetry stream
   */
  public stopStreaming() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}

export const IotSensorEngine = new IotSensorStreamEngine();
