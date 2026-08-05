import { describe, it, expect } from 'vitest';
import { IotSensorEngine } from '../iot/IotSensorEngine';

describe('IoT Sensor Engine Unit Tests', () => {
  it('should initialize telemetry stream and broadcast machine states', () => {
    return new Promise<void>((resolve) => {
      let unsubscribe: (() => void) | null = null;
      unsubscribe = IotSensorEngine.subscribe((data) => {
        expect(data).toBeDefined();
        expect(data.length).toBeGreaterThan(0);
        expect(data[0].machineId).toBeTruthy();
        expect(data[0].vibrationMmS).toBeGreaterThan(0);
        if (unsubscribe) unsubscribe();
        resolve();
      });
    });
  });

  it('should calibrate machine sensors back to healthy state', () => {
    return new Promise<void>((resolve) => {
      let callCount = 0;
      let unsubscribe: (() => void) | null = null;

      unsubscribe = IotSensorEngine.subscribe((data) => {
        callCount++;
        if (callCount === 1) {
          setTimeout(() => {
            IotSensorEngine.calibrateSensor('m-03');
          }, 10);
        } else if (callCount >= 2) {
          const calibratedMachine = data.find(m => m.machineId === 'm-03');
          expect(calibratedMachine).toBeDefined();
          expect(calibratedMachine?.status).toBe('HEALTHY');
          expect(calibratedMachine?.healthIndex).toBeGreaterThanOrEqual(95);
          expect(calibratedMachine?.vibrationMmS).toBe(1.2);
          if (unsubscribe) unsubscribe();
          resolve();
        }
      });
    });
  });
});
