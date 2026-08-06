import React, { useState, useEffect } from 'react';
import { GlassCard } from '@/shared/components/GlassCard';
import { Activity, Thermometer, Zap, AlertTriangle, ShieldCheck, Cpu, RefreshCw, Wrench, ArrowUpRight, Radio, HardDrive, CheckCircle2 } from 'lucide-react';
import { IotSensorEngine, MachineSensorTelemetry } from '@/core/iot/IotSensorEngine';
import { usePerformanceMonitor } from '@/core/monitoring/usePerformanceMonitor';
import { motion, AnimatePresence } from 'framer-motion';

export function IotMachineHealthDashboard() {
  usePerformanceMonitor('IotMachineHealthDashboard');
  const [telemetryList, setTelemetryList] = useState<MachineSensorTelemetry[]>([]);
  const [selectedMachine, setSelectedMachine] = useState<MachineSensorTelemetry | null>(null);
  const [calibratingId, setCalibratingId] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = IotSensorEngine.subscribe((data) => {
      setTelemetryList(data);
      if (!selectedMachine && data.length > 0) {
        setSelectedMachine(data[0]);
      } else if (selectedMachine) {
        const updated = data.find(m => m.machineId === selectedMachine.machineId);
        if (updated) setSelectedMachine(updated);
      }
    });

    return () => unsubscribe();
  }, [selectedMachine]);

  const handleCalibrate = (machineId: string) => {
    setCalibratingId(machineId);
    setTimeout(() => {
      IotSensorEngine.calibrateSensor(machineId);
      setCalibratingId(null);
      setActionNotice('تمت إعادة ضبط ومعايرة الحساسات بنجاح (Sensors Calibrated)');
      setTimeout(() => setActionNotice(null), 3000);
    }, 600);
  };

  const criticalCount = telemetryList.filter(m => m.status === 'CRITICAL').length;
  const warningCount = telemetryList.filter(m => m.status === 'WARNING').length;
  const healthyCount = telemetryList.filter(m => m.status === 'HEALTHY').length;

  return (
    <div className="flex flex-col h-full w-full space-y-6 overflow-y-auto p-4 md:p-6 custom-scrollbar text-white">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center gap-1.5">
              <Radio className="w-3 h-3 animate-pulse text-cyan-400" />
              Live MQTT / Industrial IoT Stream
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20">
              Predictive AI RUL Active
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white mt-2 flex items-center gap-3">
            <Activity className="w-7 h-7 text-cyan-400" />
            مراقبة صحة الآلات والإنترنت الصناعي (IoT & Machine Health)
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            مراقبة لحظية للاهتزازات، الحرارة، الضغط، والتحليل التنبؤي لفرص الأعطال (Predictive Failure Analysis).
          </p>
        </div>

        {/* Global KPI Summary Pills */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="px-3.5 py-2 rounded-2xl bg-black/40 border border-white/10 flex items-center gap-2.5 shrink-0">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <div className="flex flex-col">
              <span className="text-[9px] uppercase font-bold text-slate-400">سليمة (Healthy)</span>
              <span className="text-sm font-black text-emerald-400 font-mono">{healthyCount}</span>
            </div>
          </div>

          <div className="px-3.5 py-2 rounded-2xl bg-black/40 border border-white/10 flex items-center gap-2.5 shrink-0">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <div className="flex flex-col">
              <span className="text-[9px] uppercase font-bold text-slate-400">تحذير (Warning)</span>
              <span className="text-sm font-black text-amber-400 font-mono">{warningCount}</span>
            </div>
          </div>

          <div className="px-3.5 py-2 rounded-2xl bg-black/40 border border-white/10 flex items-center gap-2.5 shrink-0">
            <Activity className="w-4 h-4 text-rose-400" />
            <div className="flex flex-col">
              <span className="text-[9px] uppercase font-bold text-slate-400">حرجة (Critical)</span>
              <span className="text-sm font-black text-rose-400 font-mono">{criticalCount}</span>
            </div>
          </div>
        </div>
      </div>

      {actionNotice && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4" /> {actionNotice}
        </motion.div>
      )}

      {/* Main Grid: Machine List & Live Telemetry Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Machine Cards Selection Grid (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <h2 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" /> الآلات المتصلة بالحساسات (Connected Machinery)
          </h2>

          <div className="space-y-3">
            {telemetryList.map((m) => {
              const isSelected = selectedMachine?.machineId === m.machineId;

              return (
                <GlassCard
                  key={m.machineId}
                  onClick={() => setSelectedMachine(m)}
                  className={`p-4 cursor-pointer transition-all border ${
                    isSelected
                      ? 'border-cyan-500/50 bg-cyan-500/5 shadow-lg shadow-cyan-500/10'
                      : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-cyan-400">{m.code}</span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold ${
                          m.status === 'HEALTHY' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          m.status === 'WARNING' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                          'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          {m.status}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-white mt-1 line-clamp-1">{m.machineName}</h3>
                      <p className="text-[11px] text-slate-400">{m.section}</p>
                    </div>

                    {/* Health Index Badge */}
                    <div className="flex flex-col items-end">
                      <span className={`text-xl font-black font-mono ${
                        m.healthIndex >= 80 ? 'text-emerald-400' :
                        m.healthIndex >= 50 ? 'text-amber-400' : 'text-rose-400'
                      }`}>
                        {m.healthIndex}%
                      </span>
                      <span className="text-[9px] text-slate-500">Health Index</span>
                    </div>
                  </div>

                  {/* Quick Telemetry Bar */}
                  <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-white/5 text-[11px] font-mono">
                    <div className="flex items-center gap-1 text-slate-300">
                      <Activity className="w-3 h-3 text-cyan-400" />
                      <span>{m.vibrationMmS} mm/s</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-300">
                      <Thermometer className="w-3 h-3 text-amber-400" />
                      <span>{m.temperatureC}°C</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-300 justify-end">
                      <Zap className="w-3 h-3 text-indigo-400" />
                      <span>{m.electricalCurrentA}A</span>
                    </div>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        </div>

        {/* Selected Machine Telemetry Inspector (7 cols) */}
        <div className="lg:col-span-7">
          {selectedMachine ? (
            <GlassCard className="p-6 space-y-6">
              {/* Machine Inspector Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-cyan-400">{selectedMachine.code}</span>
                    <span className="text-xs text-slate-400">• {selectedMachine.section}</span>
                  </div>
                  <h2 className="text-lg font-black text-white mt-1">{selectedMachine.machineName}</h2>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCalibrate(selectedMachine.machineId)}
                    disabled={calibratingId === selectedMachine.machineId}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${calibratingId === selectedMachine.machineId ? 'animate-spin' : ''}`} />
                    معايرة الحساسات (Calibrate)
                  </button>
                </div>
              </div>

              {/* Sensor Telemetry Gauges (4 Grid) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {/* Vibration Gauge */}
                <div className="bg-black/40 border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>الاهتزاز (Vibration)</span>
                    <Activity className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="mt-2">
                    <div className="text-2xl font-black font-mono text-cyan-400">{selectedMachine.vibrationMmS}</div>
                    <span className="text-[10px] text-slate-500">mm/s RMS</span>
                  </div>
                  <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mt-3">
                    <div
                      className="bg-cyan-400 h-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (selectedMachine.vibrationMmS / 6) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Temperature Gauge */}
                <div className="bg-black/40 border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>الحرارة (Temp)</span>
                    <Thermometer className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="mt-2">
                    <div className="text-2xl font-black font-mono text-amber-400">{selectedMachine.temperatureC}°C</div>
                    <span className="text-[10px] text-slate-500">Max Limit: 95°C</span>
                  </div>
                  <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mt-3">
                    <div
                      className="bg-amber-400 h-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (selectedMachine.temperatureC / 100) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Electric Current Gauge */}
                <div className="bg-black/40 border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>التيار (Load Current)</span>
                    <Zap className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div className="mt-2">
                    <div className="text-2xl font-black font-mono text-indigo-400">{selectedMachine.electricalCurrentA}A</div>
                    <span className="text-[10px] text-slate-500">Amperes</span>
                  </div>
                  <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mt-3">
                    <div
                      className="bg-indigo-400 h-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (selectedMachine.electricalCurrentA / 30) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* RUL Predictive Failure Gauge */}
                <div className="bg-black/40 border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>العمر المتبقي (RUL)</span>
                    <HardDrive className="w-4 h-4 text-fuchsia-400" />
                  </div>
                  <div className="mt-2">
                    <div className="text-2xl font-black font-mono text-fuchsia-400">{selectedMachine.rulHours}h</div>
                    <span className="text-[10px] text-slate-500">Est. Hours to Failure</span>
                  </div>
                  <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mt-3">
                    <div
                      className="bg-fuchsia-400 h-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (selectedMachine.rulHours / 1500) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Anomaly & AI Predictive Failure Analysis Box */}
              {selectedMachine.anomalyMessage && (
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
                      <AlertTriangle className="w-4 h-4" />
                      تنبيه التنبؤ بالأعطال (AI Predictive Failure Risk: {selectedMachine.predictedFailureRisk})
                    </div>
                    {selectedMachine.recommendedPdrCode && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        قطعة موصى بها: {selectedMachine.recommendedPdrCode}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {selectedMachine.anomalyMessage}
                  </p>
                </div>
              )}

              {/* Simulated Spectrum Live Wave Visualizer */}
              <div className="space-y-2">
                <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                  طيف الاهتزاز المباشر (Live Vibration FFT Spectrum Pulse)
                </span>
                <div className="bg-black/60 border border-white/10 rounded-2xl p-4 h-24 flex items-end justify-between gap-1">
                  {Array.from({ length: 32 }).map((_, idx) => {
                    const height = Math.min(100, Math.max(15, (selectedMachine.vibrationMmS * 15) + Math.sin(idx + Date.now() / 200) * 20));
                    return (
                      <div
                        key={idx}
                        className="w-full bg-cyan-400/80 rounded-t transition-all duration-300 hover:bg-cyan-300"
                        style={{ height: `${height}%` }}
                      />
                    );
                  })}
                </div>
              </div>
            </GlassCard>
          ) : (
            <GlassCard className="p-8 text-center text-slate-400 text-xs">
              اختر آلة من القائمة لمشاهدة التحليل اللحظي والحراري.
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  );
}
