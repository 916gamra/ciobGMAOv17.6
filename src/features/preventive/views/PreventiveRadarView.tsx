import React, { useState, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  db,
  Machine,
  Technician,
  Sector,
  TaskExecution,
  PreventiveTask,
  MachineBlueprint,
} from "@/core/db";
import { motion, AnimatePresence } from "motion/react";
import {
  Calendar as CalendarIcon,
  LayoutGrid,
  List as ListIcon,
  Search,
  AlertTriangle,
  ChevronRight,
  X,
  User,
  MapPin,
  ClipboardCheck,
  Wrench,
  Component,
  Plus,
  Trash2,
  Clock,
  Droplet,
  Zap,
  Wind,
  Cpu,
  Radar
} from "lucide-react";
import { PageHeader } from "@/shared/components/PageHeader";
import { HeaderBentoCard } from "@/shared/components/HeaderBentoCard";
import { useTranslation } from "react-i18next";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
  isSameDay,
  startOfWeek,
  endOfWeek,
  differenceInDays,
} from "date-fns";
import { GlassCard } from "@/shared/components/GlassCard";
import { EMPTY_ARRAY, cn } from "@/shared/utils";
import { useAuthStore } from "@/app/store/useAuthStore";
import { isUserAdmin } from "@/core/permissions";
import { useAuditTrail } from "@/features/system/hooks/useAuditTrail";
import { toast } from "sonner";

type ViewMode = "CALENDAR" | "GRID" | "LIST" | "BULK_BOARD";

const ACTION_VERBS = [
  { id: 'ACT-01', name: 'Control & Inspection', type: 'PREV' },
  { id: 'ACT-02', name: 'Cleaning & Lubrication', type: 'PREV' },
  { id: 'ACT-03', name: 'Part Replacement', type: 'CORR' },
  { id: 'ACT-04', name: 'Calibration & Adjustment', type: 'PREV' },
  { id: 'ACT-05', name: 'Repair / Fix', type: 'CORR' },
];

export function PreventiveRadarView() {
  const { t } = useTranslation();
  const { currentUser } = useAuthStore();
  const { logEvent } = useAuditTrail();
  const isAdmin = isUserAdmin(currentUser);
  const [viewMode, setViewMode] = useState<ViewMode>("CALENDAR");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTech, setSelectedTech] = useState<string>("ALL");
  const [selectedSector, setSelectedSector] = useState<string>("ALL");

  // Consolidated DB Data
  const radarData = useLiveQuery(async () => {
    const [
      machines,
      technicians,
      sectors,
      executions,
      preventiveTasks,
      blueprints,
      inventory,
      pdrBlueprints,
      partMappings,
      pdrTemplates
    ] = await Promise.all([
      db.machines.toArray(),
      db.technicians.toArray(),
      db.sectors.toArray(),
      db.taskExecutions.toArray(),
      db.preventiveTasks.toArray(),
      db.machineBlueprints.toArray(),
      db.inventory.toArray(),
      db.pdrBlueprints.toArray(),
      db.machinePartMappings.toArray(),
      db.pdrTemplates ? db.pdrTemplates.toArray() : Promise.resolve([])
    ]);
    return {
      machines,
      technicians,
      sectors,
      executions,
      preventiveTasks,
      blueprints,
      inventory,
      pdrBlueprints,
      partMappings,
      pdrTemplates
    };
  }, []);

  const machines = radarData?.machines ?? EMPTY_ARRAY;
  const technicians = radarData?.technicians ?? EMPTY_ARRAY;
  const sectors = radarData?.sectors ?? EMPTY_ARRAY;
  const executions = radarData?.executions ?? EMPTY_ARRAY;
  const preventiveTasks = radarData?.preventiveTasks ?? EMPTY_ARRAY;
  const blueprints = radarData?.blueprints ?? EMPTY_ARRAY;
  const inventory = radarData?.inventory ?? EMPTY_ARRAY;
  const pdrBlueprints = radarData?.pdrBlueprints ?? EMPTY_ARRAY;
  const partMappings = radarData?.partMappings ?? EMPTY_ARRAY;
  const pdrTemplates = radarData?.pdrTemplates ?? EMPTY_ARRAY;

  // Modals state
  const [closingExecutionId, setClosingExecutionId] = useState<string | null>(
    null,
  );
  const [closingDuration, setClosingDuration] = useState(15);
  const [closingNotes, setClosingNotes] = useState("");
  const [closingComponentCondition, setClosingComponentCondition] = useState<
    "EXCELLENT" | "WATCHFUL" | "CRITICAL"
  >("EXCELLENT");

  // Bulk Board States
  const [selectedExecutionsForBulk, setSelectedExecutionsForBulk] = useState<string[]>([]);
  const [bulkDuration, setBulkDuration] = useState(15);
  const [bulkNotes, setBulkNotes] = useState("");
  const [bulkComponentCondition, setBulkComponentCondition] = useState<'EXCELLENT' | 'WATCHFUL' | 'CRITICAL'>('EXCELLENT');

  const [printingMachineId, setPrintingMachineId] = useState<string | null>(
    null,
  );

  // Unified Intelligent Service Entry (DNA Flow) States
  const [isServiceEntryModalOpen, setIsServiceEntryModalOpen] = useState(false);
  const [serviceMachineId, setServiceMachineId] = useState("");
  const [serviceComponentId, setServiceComponentId] = useState("");
  const [serviceActionId, setServiceActionId] = useState("");
  const [serviceType, setServiceType] = useState<"PREV" | "CORR">("PREV");
  const [serviceNotes, setServiceNotes] = useState("");
  const [serviceDuration, setServiceDuration] = useState(30);
  const [serviceTechnicianId, setServiceTechnicianId] = useState("");
  // Array of { blueprintId: string, quantity: number }
  const [serviceConsumedParts, setServiceConsumedParts] = useState<{ blueprintId: string; quantity: number }[]>([]);

  // Monthly logic
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);

  const daysInMonth = useMemo(() => {
    const start = startOfWeek(monthStart, { weekStartsOn: 1 });
    const end = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [monthStart, monthEnd]);

  // Aggregate Data
  const enrichedMachines = useMemo(() => {
    return machines
      .map((m) => {
        const tech = technicians.find((t) => t.id === m.technicianId);
        const sector = sectors.find((s) => s.id === m.sectorId);
        
        const blueprint = blueprints.find((b) => b.id === m.blueprintId);
        const composingTemplateIds = blueprint?.partTemplateIds || [];
        const composingFamilyIds = pdrTemplates.filter(t => composingTemplateIds.includes(t.id)).map(t => t.familyId);
        
        const mTasks = preventiveTasks.filter(task => {
          if (task.pdrTemplateId) return composingTemplateIds.includes(task.pdrTemplateId);
          if (task.pdrFamilyId) return composingFamilyIds.includes(task.pdrFamilyId);
          return false;
        });

        // 30-Day Rule Logic
        const machineExecs = executions.filter(
          (ex) => ex.machineId === m.id && ex.status === "COMPLETED",
        );
        let daysSinceLast = 0;
        if (machineExecs.length > 0) {
          const lastDate = Math.max(
            ...machineExecs.map((e) =>
              new Date(e.executedAt || e.scheduledDate).getTime(),
            ),
          );
          daysSinceLast = differenceInDays(currentDate, new Date(lastDate));
        } else {
          // If never executed, we could use creation date or just flag it if tasks exist.
          // We'll treat it as 999 days to trigger the alarm if tasks are present.
          daysSinceLast = mTasks.length > 0 ? 999 : 0;
        }

        const scheduledThisMonth = executions.filter(
          (ex) =>
            ex.machineId === m.id &&
            isSameMonth(new Date(ex.scheduledDate), currentDate),
        );

        // Overdue Executions computation
        const overdueExecsList = executions.filter(
          (ex) =>
            ex.machineId === m.id &&
            ex.status === "PENDING" &&
            new Date(ex.scheduledDate) < new Date(),
        );

        // Derive overdue families
        const overdueFamilies = overdueExecsList
          .map((ex) => {
            const taskDef = preventiveTasks.find((t) => t.id === ex.taskId);
            return taskDef?.pdrFamilyId; // MEC, ELE, HYD, PNU, ELN
          })
          .filter(Boolean);
        const primaryOverdueFamily =
          overdueFamilies.length > 0 ? overdueFamilies[0] : null;

        // Health and Readiness Index calculation
        let healthScore = 100;
        if (!m.technicianId || !m.sectorId || !m.blueprintId) {
          healthScore -= 40;
        }
        healthScore -= overdueExecsList.length * 15;
        healthScore = Math.max(0, Math.min(100, healthScore));

        // Awareness Logic
        let awarenessLevel: "RED" | "GOLD" | "CYAN" | "GREEN" = "GREEN";
        let awarenessMessage = "";

        if (!m.technicianId || !m.sectorId || !m.blueprintId) {
          awarenessLevel = "RED";
          awarenessMessage = "MISSING PILLARS (TECH/SECTOR/BP)";
        } else if (
          mTasks.length > 0 &&
          (daysSinceLast >= 30 || overdueExecsList.length > 0)
        ) {
          awarenessLevel = "RED";
          awarenessMessage = `CRITICAL: ${daysSinceLast === 999 ? "NEVER COMPLETED" : `${daysSinceLast} DAYS OVERDUE`}`;
        } else if (mTasks.length > 0 && daysSinceLast >= 25) {
          awarenessLevel = "GOLD";
          awarenessMessage = `WARNING: approaching limit (${daysSinceLast} days)`;
        } else if (mTasks.length === 0) {
          awarenessLevel = "CYAN";
          awarenessMessage = "NO PREVENTIVE TASKS ASSIGNED";
        }

        return {
          ...m,
          technician: tech,
          sector: sector,
          taskCount: mTasks.length,
          awarenessLevel,
          awarenessMessage,
          scheduledExecutions: scheduledThisMonth,
          blueprintName: blueprint ? blueprint.reference : "Unlinked",
          healthScore,
          primaryOverdueFamily,
          overdueCount: overdueExecsList.length,
        };
      })
      .filter((m) => {
        const matchSearch = m.referenceCode
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
        const matchTech =
          selectedTech === "ALL" || m.technicianId === selectedTech;
        const matchSector =
          selectedSector === "ALL" || m.sectorId === selectedSector;
        return matchSearch && matchTech && matchSector;
      });
  }, [
    machines,
    technicians,
    sectors,
    executions,
    currentDate,
    searchTerm,
    selectedTech,
    selectedSector,
    blueprints,
    preventiveTasks,
  ]);

  const stats = useMemo(() => {
    const totalMachines = enrichedMachines.length;
    const criticalMachines = enrichedMachines.filter(m => m.awarenessLevel === "RED").length;
    const pendingCount = executions.filter(ex => ex.status === "PENDING" && ex.serviceType === "PREV").length;
    const completedCount = executions.filter(ex => ex.status === "COMPLETED" && ex.serviceType === "PREV").length;
    
    return { totalMachines, criticalMachines, pendingCount, completedCount };
  }, [enrichedMachines, executions]);

  // Calendar Day Click
  const handleDayClick = (day: Date) => {
    setSelectedDay(day);
  };

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const handleCompleteTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!closingExecutionId) return;

    try {
      const execution = await db.taskExecutions.get(closingExecutionId);
      const updatePayload: any = {
        status: "COMPLETED" as const,
        executedAt: new Date().toISOString(),
        durationMinutes: closingDuration,
        notes: closingNotes,
        componentCondition: closingComponentCondition,
      };

      if (isAdmin && currentUser) {
        updatePayload.overriddenByAdmin = true;
        updatePayload.adminUserId = currentUser.id;
        updatePayload.adminUserName = currentUser.name;
        if (!execution?.doneBy) {
          // Default to assigning the execution completion reference to the admin's name/ID
          updatePayload.doneBy = String(currentUser.id);
        }
      }

      await db.taskExecutions.update(closingExecutionId, updatePayload);

      if (isAdmin && currentUser) {
        await logEvent({
          userId: currentUser.id,
          userName: currentUser.name,
          action: "OVERRIDE_CLOSE_TASK",
          entityType: "PREVENTIVE_TASK_EXECUTION",
          entityId: closingExecutionId,
          details: `Sovereign Admin Override: Mark task closed. Notes: ${closingNotes}`,
          severity: "WARNING",
        });
        toast.info(
          "Sovereign Override: Task closed as System Admin with audit-trail logging.",
        );
      } else {
        toast.success("Preventive task successfully marked as completed.");
      }
    } catch (err: any) {
      toast.error("Failed to complete task", { description: err.message });
    }

    setClosingExecutionId(null);
    setClosingNotes("");
    setClosingDuration(15);
    setClosingComponentCondition("EXCELLENT");
  };

  const handleBulkCompleteTasks = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedExecutionsForBulk.length === 0) {
      toast.error("Please select at least one task for bulk completion.");
      return;
    }

    try {
      await db.transaction("rw", [db.taskExecutions, db.auditLogs], async () => {
        for (const execId of selectedExecutionsForBulk) {
          const execution = await db.taskExecutions.get(execId);
          const updatePayload: any = {
            status: "COMPLETED" as const,
            executedAt: new Date().toISOString(),
            durationMinutes: bulkDuration,
            notes:
              bulkNotes ||
              "Batch closed to support operational pulsiness (Bulk Completion)",
            componentCondition: bulkComponentCondition,
          };

          if (isAdmin && currentUser) {
            updatePayload.overriddenByAdmin = true;
            updatePayload.adminUserId = currentUser.id;
            updatePayload.adminUserName = currentUser.name;
            if (!execution?.doneBy) {
              updatePayload.doneBy = String(currentUser.id);
            }
          }

          await db.taskExecutions.update(execId, updatePayload);

          if (isAdmin && currentUser) {
            await db.auditLogs.add({
              id: crypto.randomUUID(),
              userId: currentUser.id,
              userName: currentUser.name,
              action: "BULK_OVERRIDE_CLOSE_TASK",
              entityType: "PREVENTIVE_TASK_EXECUTION",
              entityId: execId,
              details: `Sovereign Admin Batch Override: Mark task closed. Notes: ${bulkNotes}. Condition: ${bulkComponentCondition}`,
              severity: "WARNING",
              timestamp: new Date().toISOString(),
            });
          }
        }
      });

      toast.success(
        `Successfully completed and closed ${selectedExecutionsForBulk.length} preventive tasks at once!`,
      );
      setSelectedExecutionsForBulk([]);
      setBulkNotes("");
      setBulkDuration(15);
      setBulkComponentCondition("EXCELLENT");
    } catch (err: any) {
      toast.error("Failed to complete tasks in bulk", { description: err.message });
    }
  };

  const handlePrintWorkOrder = (machineId: string) => {
    setPrintingMachineId(machineId);
    setTimeout(() => {
      window.print();
      // We don't hide it immediately so print registers it, print dialog is blocking.
      // In some browsers timeout runs after print dialog closes.
      setPrintingMachineId(null);
    }, 500);
  };

  // 1. Auto calculate service type (Sovereign Awareness)
  React.useEffect(() => {
    if (!serviceActionId) return;
    const actionObj = ACTION_VERBS.find(a => a.id === serviceActionId);
    if (actionObj) {
      const nameLower = actionObj.name.toLowerCase();
      if (
        nameLower.includes("rep") || 
        nameLower.includes("fix") || 
        nameLower.includes("depann") || 
        nameLower.includes("panne") ||
        nameLower.includes("rempla") ||
        actionObj.type === "CORR"
      ) {
        setServiceType("CORR");
      } else if (
        nameLower.includes("lubr") || 
        nameLower.includes("nettoy") || 
        nameLower.includes("contr") || 
        nameLower.includes("clean") ||
        actionObj.type === "PREV"
      ) {
        setServiceType("PREV");
      } else {
        setServiceType(actionObj.type === "CORR" ? "CORR" : "PREV");
      }
    }
  }, [serviceActionId, ACTION_VERBS]);

  // 2. Pre-populate default spare parts on component selection
  React.useEffect(() => {
    if (!serviceComponentId) {
      setServiceConsumedParts([]);
      return;
    }
    const compObj = pdrTemplates.find(c => c.id === serviceComponentId);
    if (compObj) {
      const relevantBps = pdrBlueprints.filter(bp => bp.templateId === compObj.id);
      setServiceConsumedParts(relevantBps.map(bp => ({
        blueprintId: bp.id,
        quantity: 0
      })));
    } else {
      setServiceConsumedParts([]);
    }
  }, [serviceComponentId, pdrTemplates, pdrBlueprints]);

  // 3. Register Unified Intelligent Service
  const handleRegisterUnifiedService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceMachineId || !serviceActionId) {
      toast.error("Required fields missing: Machine & Action Verb");
      return;
    }

    try {
      const machineObj = machines.find((m) => m.id === serviceMachineId);
      const actionObj = ACTION_VERBS.find((a) => a.id === serviceActionId);
      const componentObj = pdrTemplates.find((c) => c.id === serviceComponentId);

      if (!machineObj || !actionObj) {
        toast.error("Machine or Action verb details are invalid.");
        return;
      }

      // Pre-check stock levels
      for (const item of serviceConsumedParts) {
        if (item.quantity <= 0) continue;
        const stockRecord = inventory.find((inv) => inv.blueprintId === item.blueprintId);
        const currentQty = stockRecord?.quantityCurrent || 0;
        if (currentQty < item.quantity) {
          const bpItem = pdrBlueprints.find((b) => b.id === item.blueprintId);
          toast.error(`Stock shortage for part "${bpItem?.reference || "Unknown"}" — Current: ${currentQty}, Required: ${item.quantity}`);
          return;
        }
      }

      // Atomically decrement stock, write movements, insert log
      await db.transaction("rw", [db.inventory, db.movements, db.taskExecutions], async () => {
        // Decrement physical stock items & insert movements
        for (const item of serviceConsumedParts) {
          if (item.quantity <= 0) continue;
          const stockRecord = inventory.find((inv) => inv.blueprintId === item.blueprintId);
          if (stockRecord) {
            await db.inventory.update(stockRecord.id, {
              quantityCurrent: Math.max(0, stockRecord.quantityCurrent - item.quantity),
              updatedAt: new Date().toISOString()
            });

            await db.movements.add({
              id: crypto.randomUUID(),
              stockId: stockRecord.id,
              type: "OUT",
              quantity: item.quantity,
              performedBy: currentUser?.name || "Technician",
              notes: `Consumed on Machine: [${machineObj.referenceCode}] for Action: [${actionObj.name}]`,
              timestamp: new Date().toISOString()
            });
          }
        }

        // Add task execution database record
        const executionLog = {
          id: crypto.randomUUID(),
          machineId: serviceMachineId,
          taskId: "VIRTUAL_SERVICE_ENTRY",
          status: "COMPLETED" as const,
          scheduledDate: new Date().toISOString().split("T")[0],
          executedAt: new Date().toISOString(),
          doneBy: serviceTechnicianId || String(currentUser?.id || "GUEST"),
          durationMinutes: serviceDuration,
          notes: `[Unified Entry: ${serviceType}] ${actionObj.name} of component Organ "${componentObj?.name || "Body Block"}". ${serviceNotes}`,
          componentCondition: serviceType === "CORR" ? ("WATCHFUL" as const) : ("EXCELLENT" as const),
          componentId: serviceComponentId || undefined,
          actionId: serviceActionId,
          serviceType: serviceType
        };
        await db.taskExecutions.add(executionLog);
      });

      // Audit log
      await logEvent({
        userId: currentUser?.id || "GUEST",
        userName: currentUser?.name || "Technician",
        action: "EXECUTE",
        entityType: "UNIFIED_SERVICE_LOG",
        entityId: serviceMachineId,
        details: `Recorded live surgery: ${actionObj.name} on ${machineObj.referenceCode} for component [${componentObj?.name || "General Body"}]. ${serviceConsumedParts.filter(p=>p.quantity>0).length} parts consumed.`,
        severity: serviceType === "CORR" ? "INFO" : "INFO"
      });

      toast.success("Industrial Surgery Successfully Registered!", {
        description: `Logged "${actionObj.name}" on machine ${machineObj.referenceCode}.`
      });

      // Reset states
      setIsServiceEntryModalOpen(false);
      setServiceMachineId("");
      setServiceComponentId("");
      setServiceActionId("");
      setServiceType("PREV");
      setServiceNotes("");
      setServiceDuration(30);
      setServiceTechnicianId("");
      setServiceConsumedParts([]);
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to commit service log: " + err.message);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0f] p-6 text-slate-200 relative overflow-hidden custom-scrollbar">
      {/* Page Header */}
      <PageHeader
        title={t("preventive.radar.title", "Preventive Maintenance Radar")}
        subtitle={t("preventive.radar.subtitle", "Real-time health telemetry of factory assets and scheduled preventive maintenance operations")}
        icon={<Radar className="w-7 h-7 text-emerald-400" />}
        badgeColor="emerald"
        badgeText={t("preventive.badge", "Preventive Maintenance")}
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <HeaderBentoCard
            title={t("preventive.radar.totalMachines", "Total Machinery")}
            subtitle="TOTAL EQUIPMENT"
            value={stats.totalMachines}
            icon={<Radar className="w-3.5 h-3.5" />}
            color="emerald"
          />
          <HeaderBentoCard
            title={t("preventive.radar.criticalAlerts", "Critical Alerts")}
            subtitle="CRITICAL ALERTS"
            value={stats.criticalMachines}
            icon={<AlertTriangle className="w-3.5 h-3.5" />}
            color="rose"
          />
          <HeaderBentoCard
            title={t("preventive.radar.pendingTasks", "Pending Tasks")}
            subtitle="PENDING TASKS"
            value={stats.pendingCount}
            icon={<Clock className="w-3.5 h-3.5" />}
            color="amber"
          />
          <HeaderBentoCard
            title={t("preventive.radar.completedPrev", "Completed Interventions")}
            subtitle="COMPLETED PREV"
            value={stats.completedCount}
            icon={<ClipboardCheck className="w-3.5 h-3.5" />}
            color="cyan"
          />
        </div>
      </PageHeader>

      {/* Control Cockpit Card */}
      <div className="mb-6 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Filters and Search Bar */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Search Input */}
          <div className="flex items-center bg-[#0a0a0f]/40 rounded-xl px-3 py-1.5 border border-white/5 focus-within:border-emerald-500/30 transition-all w-full md:w-auto">
            <Search className="w-4 h-4 text-slate-400 shrink-0 mr-2" />
            <input
              type="text"
              placeholder={t("preventive.radar.search", "Search machinery...")}
              className="bg-transparent border-none outline-none text-xs text-white placeholder-slate-500 font-medium w-full md:w-36"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Sector Filter */}
          <div className="relative w-full md:w-auto">
            <select
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              className="w-full md:w-auto bg-[#0a0a0f]/40 border border-white/5 rounded-xl py-1.5 px-3 text-xs text-slate-300 focus:outline-none focus:border-emerald-500/50 appearance-none min-w-[110px]"
            >
              <option value="ALL" className="bg-[#0a0a0f]">{t("preventive.radar.allSectors", "All Production Sectors")}</option>
              {sectors.map((s) => (
                <option key={s.id} value={s.id} className="bg-[#0a0a0f]">
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Technician Filter */}
          <div className="relative w-full md:w-auto">
            <select
              value={selectedTech}
              onChange={(e) => setSelectedTech(e.target.value)}
              className="w-full md:w-auto bg-[#0a0a0f]/40 border border-white/5 rounded-xl py-1.5 px-3 text-xs text-slate-300 focus:outline-none focus:border-emerald-500/50 appearance-none min-w-[110px]"
            >
              <option value="ALL" className="bg-[#0a0a0f]">{t("preventive.radar.allTechs", "All Technicians")}</option>
              {technicians.map((t) => (
                <option key={t.id} value={t.id} className="bg-[#0a0a0f]">
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Button & View Switcher */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          {/* Primary Action Button - Surgery Log: High contrast white button */}
          <button
            onClick={() => {
              setServiceMachineId("");
              setServiceComponentId("");
              setServiceActionId("");
              setServiceType("PREV");
              setServiceNotes("");
              setServiceDuration(30);
              setServiceTechnicianId("");
              setServiceConsumedParts([]);
              setIsServiceEntryModalOpen(true);
            }}
            className="w-full md:w-auto bg-white text-slate-950 hover:bg-[#e2e8f0] font-extrabold rounded-xl px-4 py-2.5 text-xs shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <Wrench className="w-4 h-4 text-slate-950" />
            <span>{t("preventive.radar.surgeryLog", "سجل التدخلات الجراحية")}</span>
          </button>

          {/* View Mode Switcher */}
          <div className="flex bg-[#0a0a0f]/40 rounded-xl border border-white/5 p-1 w-full md:w-auto justify-between md:justify-start">
            <button
              onClick={() => setViewMode("CALENDAR")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5",
                viewMode === "CALENDAR"
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "text-slate-400 hover:text-white"
              )}
              title="Calendar Overload View"
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>{t("preventive.radar.calendar", "التقويم")}</span>
            </button>
            <button
              onClick={() => setViewMode("GRID")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5",
                viewMode === "GRID"
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "text-slate-400 hover:text-white"
              )}
              title="Tactical Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>{t("preventive.radar.grid", "الشبكة")}</span>
            </button>
            <button
              onClick={() => setViewMode("LIST")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5",
                viewMode === "LIST"
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "text-slate-400 hover:text-white"
              )}
              title="Execution Registry"
            >
              <ListIcon className="w-3.5 h-3.5" />
              <span>{t("preventive.radar.list", "القائمة")}</span>
            </button>
            <button
              onClick={() => setViewMode("BULK_BOARD")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5",
                viewMode === "BULK_BOARD"
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "text-slate-400 hover:text-white"
              )}
              title="Bulk Dispatcher Board"
            >
              <ClipboardCheck className="w-3.5 h-3.5" />
              <span>{t("preventive.radar.bulkBoard", "المكتب")}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {viewMode === "CALENDAR" && (
            <motion.div
              key="CALENDAR"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full flex flex-col bg-[#0a0a0f]/90 rounded-3xl border border-white/10 p-6 backdrop-blur-xl shadow-2xl custom-scrollbar overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white tracking-wider">
                  {format(currentDate, "MMMM yyyy")}
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={prevMonth}
                    className="px-4 py-2 rounded-xl border border-white/10 hover:bg-white/5 transition-colors text-xs font-bold text-slate-300"
                  >
                    Prev
                  </button>
                  <button
                    onClick={() => setCurrentDate(new Date())}
                    className="px-4 py-2 rounded-xl border border-white/10 hover:bg-white/5 transition-colors text-xs font-bold text-emerald-400"
                  >
                    Today
                  </button>
                  <button
                    onClick={nextMonth}
                    className="px-4 py-2 rounded-xl border border-white/10 hover:bg-white/5 transition-colors text-xs font-bold text-slate-300"
                  >
                    Next
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-4 mb-4">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                  <div
                    key={d}
                    className="text-center text-xs font-bold text-slate-500 uppercase tracking-widest"
                  >
                    {d}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-4 flex-1">
                {daysInMonth.map((day, idx) => {
                  const isCurrentMonth = isSameMonth(day, currentDate);
                  const isSelected = selectedDay && isSameDay(day, selectedDay);
                  const isTodayDate = isToday(day);

                  // Find machines that have executions scheduled on this day
                  const machinesForDay = enrichedMachines.filter((m) =>
                    m.scheduledExecutions.some((ex) =>
                      isSameDay(new Date(ex.scheduledDate), day),
                    ),
                  );

                  const overload = machinesForDay.length > 2; // Arbitrary logic: > 2 machines = overload

                  return (
                    <div
                      key={day.toISOString()}
                      onClick={() => handleDayClick(day)}
                      className={`
                         relative flex flex-col p-3 rounded-2xl border transition-all cursor-pointer min-h-[100px]
                         ${!isCurrentMonth ? "opacity-30" : "opacity-100"}
                         ${isSelected ? "bg-emerald-500/10 border-emerald-500/50" : "bg-white/[0.02] border-white/5 hover:border-white/10 hover:bg-white/[0.04]"}
                       `}
                    >
                      <span
                        className={`text-sm font-bold ${isTodayDate ? "text-emerald-400" : "text-slate-400"}`}
                      >
                        {format(day, "d")}
                      </span>

                      {machinesForDay.length > 0 && (
                        <div className="mt-auto flex flex-col gap-1">
                          <div
                            className={`h-1.5 w-full rounded-full ${overload ? "bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.3)]" : "bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]"}`}
                          />
                          <span className="text-[10px] font-mono text-slate-400 text-center">
                            {machinesForDay.length} Mchs
                          </span>
                        </div>
                      )}
                      {overload && (
                        <div className="absolute top-3 right-3 text-amber-400">
                          <AlertTriangle className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {viewMode === "GRID" && (
            <motion.div
              key="GRID"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full custom-scrollbar overflow-y-auto"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {enrichedMachines.map((m) => {
                  const hasOverdue = m.healthScore < 100;
                  const glowColor =
                    !hasOverdue
                      ? "emerald"
                      : m.primaryOverdueFamily === "ELE"
                        ? "yellow"
                        : m.primaryOverdueFamily === "MEC"
                          ? "amber"
                          : m.primaryOverdueFamily === "HYD"
                            ? "blue"
                            : m.primaryOverdueFamily === "PNU"
                              ? "cyan"
                              : m.primaryOverdueFamily === "ELN"
                                ? "purple"
                                : "red";

                  const glowClass =
                    glowColor === "emerald"
                      ? "border-l-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.08)] hover:border-emerald-500/40"
                      : glowColor === "yellow"
                        ? "border-l-yellow-400 border-r border-r-yellow-500/10 shadow-[0_0_25px_rgba(234,179,8,0.25)] hover:border-yellow-400/40"
                        : glowColor === "amber"
                          ? "border-l-amber-500 shadow-[0_0_25px_rgba(245,158,11,0.25)] hover:border-amber-500/40"
                          : glowColor === "blue"
                            ? "border-l-blue-500 shadow-[0_0_25px_rgba(59,130,246,0.25)] hover:border-blue-500/40"
                            : glowColor === "cyan"
                              ? "border-l-cyan-500 shadow-[0_0_25px_rgba(6,182,212,0.25)] hover:border-cyan-500/40"
                              : glowColor === "purple"
                                ? "border-l-purple-500 shadow-[0_0_25px_rgba(168,85,247,0.25)] hover:border-purple-500/40"
                                : "border-l-red-500 shadow-[0_0_25px_rgba(239,68,68,0.25)] hover:border-red-500/40";

                  const badgeColorClass =
                    glowColor === "emerald"
                      ? "text-emerald-400 bg-emerald-400/10 border-emerald-500/20"
                      : glowColor === "yellow"
                        ? "text-yellow-400 bg-yellow-400/10 border-yellow-400/20"
                        : glowColor === "amber"
                          ? "text-amber-400 bg-amber-400/10 border-amber-500/20"
                          : glowColor === "blue"
                            ? "text-blue-400 bg-blue-400/10 border-blue-500/20"
                            : glowColor === "cyan"
                              ? "text-cyan-400 bg-cyan-400/10 border-cyan-500/20"
                              : glowColor === "purple"
                                ? "text-purple-400 bg-purple-400/10 border-purple-500/20"
                                : "text-red-400 bg-red-400/10 border-red-500/20";

                  return (
                    <GlassCard
                      key={m.id}
                      className={`p-6 border-l-4 flex flex-col transition-all duration-300 ${glowClass}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="text-xl font-bold text-white tracking-widest font-mono">
                            {m.referenceCode}
                          </h3>
                          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mt-0.5">
                            {m.blueprintName}
                          </p>
                        </div>
                        {m.awarenessLevel !== "GREEN" && (
                          <div
                            className={`flex items-center gap-1 text-[10px] font-bold tracking-widest px-2 py-1 rounded ${badgeColorClass}`}
                          >
                            <AlertTriangle className="w-3 h-3 shrink-0" />{" "}
                            {m.awarenessLevel === "RED" ? "CRITICAL" : "ATTENTION"}
                          </div>
                        )}
                      </div>

                      {/* Health & Readiness Index widget */}
                      <div className="my-5 p-4 rounded-2xl bg-[#0a0a0f]/30 border border-white/5 relative overflow-hidden">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Health & Readiness Index
                          </span>
                          <span
                            className={`text-xs font-mono font-black ${hasOverdue ? "text-amber-400" : "text-emerald-400"}`}
                          >
                            {m.healthScore}%
                          </span>
                        </div>
                        <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r ${
                              m.healthScore === 100
                                ? "from-emerald-500 to-emerald-400"
                                : m.healthScore >= 70
                                  ? "from-amber-400 to-amber-500 animate-pulse"
                                  : "from-red-500 to-red-600 animate-pulse"
                            }`}
                            style={{ width: `${m.healthScore}%` }}
                          />
                        </div>
                        <div className="flex justify-between items-center mt-2.5">
                          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">
                            {m.healthScore === 100
                              ? "✓ 100% Emerald Perfect"
                              : `⚠ ${m.overdueCount} Overdue plans`}
                          </span>
                          {hasOverdue && m.primaryOverdueFamily && (
                            <span
                              className={`text-[9px] font-mono font-black tracking-wider px-1.5 py-0.5 rounded uppercase border ${badgeColorClass}`}
                            >
                              Sector: {m.primaryOverdueFamily}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="mt-auto grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
                        <div className="flex items-center gap-2 text-slate-400 text-[11px] font-medium">
                          <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />{" "}
                          <span className="truncate">{m.technician?.name || "Unassigned"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-400 text-[11px] font-medium">
                          <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />{" "}
                          <span className="truncate">{m.sector?.name || "No Sector"}</span>
                        </div>
                      </div>
                    </GlassCard>
                  );
                })}
                {enrichedMachines.length === 0 && (
                  <div className="col-span-full py-20 text-center text-slate-500">
                    No machines match your criteria.
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {viewMode === "LIST" && (
            <motion.div
              key="LIST"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full bg-[#0a0a0f]/90 rounded-3xl border border-white/10 backdrop-blur-xl shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="overflow-x-auto flex-1 custom-scrollbar">
                <table className="w-full text-left" dir="ltr">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/[0.02]">
                      <th className="px-6 py-4 font-bold text-slate-400 text-xs tracking-wider uppercase">
                        Status
                      </th>
                      <th className="px-6 py-4 font-bold text-slate-400 text-xs tracking-wider uppercase">
                        Machine Info
                      </th>
                      <th className="px-6 py-4 font-bold text-slate-400 text-xs tracking-wider uppercase">
                        Technician
                      </th>
                      <th className="px-6 py-4 font-bold text-slate-400 text-xs tracking-wider uppercase">
                        Sector
                      </th>
                      <th className="px-6 py-4 font-bold text-slate-400 text-xs tracking-wider uppercase">
                        PM Tasks
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {enrichedMachines.map((row) => (
                      <tr
                        key={row.id}
                        className="hover:bg-white/[0.02] transition-colors group"
                      >
                        <td className="px-6 py-4">
                          <span
                            className={`w-3 h-3 rounded-full inline-block ${
                              row.awarenessLevel === "RED"
                                ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]"
                                : row.awarenessLevel === "GOLD"
                                  ? "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.8)]"
                                  : row.awarenessLevel === "CYAN"
                                    ? "bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.8)]"
                                    : "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]"
                            }`}
                            title={row.awarenessMessage}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-white tracking-widest">
                            {row.referenceCode}
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            {row.blueprintName}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-300 font-medium text-sm">
                          {row.technician?.name || "-"}
                        </td>
                        <td className="px-6 py-4 text-slate-300 font-medium text-sm">
                          {row.sector?.name || "-"}
                        </td>
                        <td className="px-6 py-4 font-mono text-emerald-400 text-sm">
                          {row.taskCount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {viewMode === "BULK_BOARD" && (
            <motion.div
              key="BULK_BOARD"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full flex flex-col lg:flex-row gap-6 custom-scrollbar overflow-y-auto"
            >
              {/* Left Side: Tasks Registry */}
              <div className="flex-1 bg-[#0a0a0f]/90 rounded-3xl border border-white/10 backdrop-blur-xl shadow-2xl p-6 flex flex-col overflow-hidden">
                <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <ClipboardCheck className="text-emerald-400 w-5 h-5" />
                      Pending Tasks Completion Board
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Select the tasks you wish to close in bulk to save time and build the maintenance database.
                    </p>
                  </div>

                  {/* Select All utility */}
                  {executions.filter((ex) => ex.status === "PENDING").length > 0 && (
                    <button
                      onClick={() => {
                        const allPendingIds = executions
                          .filter((ex) => ex.status === "PENDING")
                          .map((ex) => ex.id);
                        if (
                          selectedExecutionsForBulk.length === allPendingIds.length
                        ) {
                          setSelectedExecutionsForBulk([]);
                        } else {
                          setSelectedExecutionsForBulk(allPendingIds);
                        }
                      }}
                      className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-xs font-bold text-slate-300 transition-colors"
                    >
                      {selectedExecutionsForBulk.length ===
                      executions.filter((ex) => ex.status === "PENDING").length
                        ? "إلغاء تحديد الكل"
                        : "تحديد الكل الشاغر"}
                    </button>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar max-h-[500px]">
                  {(() => {
                    const pendingList = executions
                      .filter((ex) => ex.status === "PENDING")
                      .map((ex) => {
                        const m = machines.find((mach) => mach.id === ex.machineId);
                        const t = preventiveTasks.find((pt) => pt.id === ex.taskId);
                        return { ex, m, t };
                      })
                      .filter((item) => {
                        if (!item.m) return false;
                        const matchSearch =
                          item.m.referenceCode
                            .toLowerCase()
                            .includes(searchTerm.toLowerCase()) ||
                          (item.t?.title || "")
                            .toLowerCase()
                            .includes(searchTerm.toLowerCase());
                        const matchTech =
                          selectedTech === "ALL" ||
                          item.m.technicianId === selectedTech;
                        const matchSector =
                          selectedSector === "ALL" ||
                          item.m.sectorId === selectedSector;
                        return matchSearch && matchTech && matchSector;
                      });

                    if (pendingList.length === 0) {
                      return (
                        <div className="text-center py-24 text-slate-500 text-sm flex flex-col items-center gap-4">
                          <ClipboardCheck className="w-16 h-16 opacity-10 animate-pulse" />
                          لا توجد مهام وقائية معلقة تطابق الفلاتر المحددة حالياً.
                        </div>
                      );
                    }

                    return pendingList.map(({ ex, m, t }) => {
                      const isChecked = selectedExecutionsForBulk.includes(ex.id);
                      return (
                        <div
                          key={ex.id}
                          onClick={() => {
                            if (isChecked) {
                              setSelectedExecutionsForBulk(
                                selectedExecutionsForBulk.filter((id) => id !== ex.id),
                              );
                            } else {
                              setSelectedExecutionsForBulk([
                                ...selectedExecutionsForBulk,
                                ex.id,
                              ]);
                            }
                          }}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group ${
                            isChecked
                              ? "bg-emerald-500/10 border-emerald-500/30"
                              : "bg-white/[0.02] border-white/5 hover:bg-white/[0.04] hover:border-white/10"
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                                isChecked
                                  ? "bg-emerald-500 border-emerald-500 text-black"
                                  : "border-white/20 group-hover:border-white/40"
                              }`}
                            >
                              {isChecked && <span className="text-xs font-black">✓</span>}
                            </div>

                            <div>
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded font-mono font-bold text-xs text-indigo-400 tracking-wider">
                                  {m?.referenceCode}
                                </span>
                                {t?.pdrFamilyId && (
                                  <span className="px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono font-bold text-[9px] rounded">
                                    {t.pdrFamilyId}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm font-semibold text-white mt-1 pr-4">
                                {t?.title}
                              </p>
                            </div>
                          </div>

                          <div className="text-left font-mono text-xs text-slate-500">
                            Scheduled:{" "}
                            {format(new Date(ex.scheduledDate), "yyyy-MM-dd")}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* Right Side: Command Deck */}
              <div className="w-full lg:w-[380px] bg-[#0a0a0f]/90 rounded-3xl border border-white/10 backdrop-blur-xl shadow-2xl p-6 flex flex-col justify-between self-start">
                <div>
                  <div className="border-b border-white/5 pb-4 mb-6">
                    <h4 className="text-sm font-black text-white uppercase tracking-widest">
                      Parameter Controller Panel
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                      تخصيص بارامترات الإنجاز الجماعي الموحد للمهام المختارة.
                    </p>
                  </div>

                  <form onSubmit={handleBulkCompleteTasks} className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                        Selected Tasks Count
                      </label>
                      <div className="bg-[#0a0a0f]/40 border border-white/5 rounded-xl px-4 py-3 text-emerald-400 font-mono text-lg font-black flex justify-between items-center bg-opacity-80">
                        <span>{selectedExecutionsForBulk.length} Tasks</span>
                        <span className="text-[10px] text-slate-500 tracking-widest font-sans uppercase">
                          Armed to Dispatch
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs text-slate-400">
                        مدة العمل الموحدة (دقائق)
                      </label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={bulkDuration}
                        onChange={(e) => setBulkDuration(Number(e.target.value))}
                        className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs text-slate-400">
                        حالة المكونات البدنية المشتركة
                      </label>
                      <select
                        value={bulkComponentCondition}
                        onChange={(e) =>
                          setBulkComponentCondition(
                            e.target.value as "EXCELLENT" | "WATCHFUL" | "CRITICAL",
                          )
                        }
                        className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl px-2.5 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors bg-opacity-95"
                      >
                        <option value="EXCELLENT">🟩 ممتاز (Excellent)</option>
                        <option value="WATCHFUL">🟨 ملاءمة مستقرة (Watchful)</option>
                        <option value="CRITICAL">🟥 يستوجب صيانة عاجلة (Critical)</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs text-slate-400">
                        مذكرة إغلاق جماعية / تفاصيل فنية
                      </label>
                      <textarea
                        required
                        placeholder="مثال: تم الإنجاز الجماعي الدوري والتأكد من تزييت وتشغيل الأجزاء بكفاءة..."
                        value={bulkNotes}
                        onChange={(e) => setBulkNotes(e.target.value)}
                        className="w-full h-24 bg-[#0a0a0f] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors resize-none mb-2"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={selectedExecutionsForBulk.length === 0}
                      className={`w-full py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${
                        selectedExecutionsForBulk.length === 0
                          ? "bg-white/5 text-slate-500 border border-white/5 cursor-not-allowed"
                          : "bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                      }`}
                    >
                      إرسال وتفعيل الإنجاز الجماعي
                    </button>
                  </form>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Side Drawer for Selected Day (Teleportation Portal) */}
      <AnimatePresence>
        {selectedDay && viewMode === "CALENDAR" && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#0a0a0f]/60 backdrop-blur-sm z-40"
              onClick={() => setSelectedDay(null)}
            />
            <motion.div
              initial={{ x: "100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute top-0 right-0 bottom-0 w-full max-w-md bg-[#0a0a0f] border-l border-emerald-500/20 z-50 flex flex-col shadow-2xl"
              dir="rtl"
            >
              <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#0a0a0f]">
                <div className="flex flex-col gap-1">
                  <h2 className="text-2xl font-bold text-white tracking-tight">
                    {format(selectedDay, "dd MMMM yyyy")}
                  </h2>
                  <p className="text-xs text-emerald-400 font-bold tracking-widest font-mono">
                    SCHEDULED MACHINES
                  </p>
                </div>
                <button
                  onClick={() => setSelectedDay(null)}
                  className="p-2 hover:bg-white/5 rounded-full text-slate-400 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                {(() => {
                  const dailyMachines = enrichedMachines.filter((m) =>
                    m.scheduledExecutions.some((ex) =>
                      isSameDay(new Date(ex.scheduledDate), selectedDay),
                    ),
                  );
                  if (dailyMachines.length === 0) {
                    return (
                      <div className="text-center py-12 text-slate-500 text-sm flex flex-col items-center gap-4">
                        <CalendarIcon className="w-12 h-12 opacity-20" />
                        لا توجد آلات مبرمجة في هذا اليوم
                      </div>
                    );
                  }
                  return dailyMachines.map((m) => {
                    const dailyExecs = m.scheduledExecutions.filter((ex) =>
                      isSameDay(new Date(ex.scheduledDate), selectedDay),
                    );
                    return (
                      <div
                        key={m.id}
                        className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 hover:border-emerald-500/30 transition-all group"
                      >
                        <div
                          className="flex justify-between items-start mb-4 text-left"
                          dir="ltr"
                        >
                          <div>
                            <h3 className="text-lg font-bold text-white tracking-wider">
                              {m.referenceCode}
                            </h3>
                            <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest">
                              {m.technician?.name || "Unassigned"}
                            </p>
                          </div>
                          <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                        </div>

                        <div
                          className="space-y-3 mt-4 border-t border-white/5 pt-4 text-left"
                          dir="ltr"
                        >
                          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                            Tasks to perform:
                          </h4>
                          {dailyExecs.map((ex) => {
                            const taskDef = preventiveTasks.find(
                              (t) => t.id === ex.taskId,
                            );

                            // Check Stock Awareness
                            let stockStatus = null;
                            if (taskDef?.pdrTemplateId) {
                              const mappedBpIds = partMappings
                                .filter((pm) => pm.machineId === m.id)
                                .map((pm) => pm.blueprintId);
                              const mappedBpForTask = pdrBlueprints.find(
                                (bp) =>
                                  mappedBpIds.includes(bp.id) &&
                                  bp.templateId === taskDef.pdrTemplateId,
                              );
                              if (mappedBpForTask) {
                                const stock = inventory.find(
                                  (inv) =>
                                    inv.blueprintId === mappedBpForTask.id,
                                );
                                stockStatus = {
                                  available: (stock?.quantityCurrent || 0) > 0,
                                  location:
                                    stock?.locationDetails || "Unknown Bin",
                                };
                              }
                            }

                            return (
                              <div
                                key={ex.id}
                                className="bg-[#0a0a0f]/40 rounded-lg p-3 text-xs border border-white/5 flex flex-col gap-2"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-slate-300 font-medium">
                                    {taskDef?.title || "Unknown Task"}
                                  </span>
                                  {ex.status === "PENDING" ? (
                                    <button
                                      onClick={() =>
                                        setClosingExecutionId(ex.id)
                                      }
                                      className="text-[10px] px-2 py-1 rounded font-bold tracking-widest uppercase bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-black transition-colors"
                                    >
                                      Close Task
                                    </button>
                                  ) : (
                                    <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-emerald-400/10 text-emerald-400">
                                      {ex.status}
                                    </span>
                                  )}
                                </div>
                                {stockStatus && (
                                  <div
                                    className={`text-[10px] font-mono tracking-widest ${stockStatus.available ? "text-emerald-400/70" : "text-red-400/70"}`}
                                  >
                                    {stockStatus.available
                                      ? `✓ IN STOCK (Loc: ${stockStatus.location})`
                                      : "✗ OUT OF STOCK (Order required)"}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        <div className="flex gap-2 mt-6">
                          <button
                            onClick={() => handlePrintWorkOrder(m.id)}
                            className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-all font-bold text-xs uppercase tracking-widest border border-white/10 flex justify-center items-center gap-2"
                          >
                            Print Task Card
                          </button>
                          <button
                            onClick={() => {
                              const { openTab } =
                                require("@/app/store").useTabStore.getState();
                              openTab({
                                id: `machine-detail:${m.id}`,
                                portalId: "FACTORY",
                                title: `Asset: ${m.referenceCode}`,
                                component: `machine-detail:${m.id}`,
                              });
                            }}
                            className="flex-1 py-2.5 bg-emerald-500/10 hover:bg-emerald-500 hover:text-black text-emerald-400 rounded-xl transition-all font-bold text-xs uppercase tracking-widest border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)] flex justify-center items-center gap-2"
                          >
                            القفز لملف الآلة{" "}
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Task Closing Modal */}
      <AnimatePresence>
        {closingExecutionId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#0a0a0f]/80 backdrop-blur-md z-[60] flex items-center justify-center p-4"
            onClick={() => setClosingExecutionId(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0a0a0f] border border-emerald-500/30 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden"
              dir="rtl"
            >
              <div className="h-1 bg-emerald-500 w-full" />
              <div className="p-8">
                <h2 className="text-2xl font-bold text-white mb-2">
                  إغلاق المهمة الوقائية
                </h2>
                <p className="text-sm text-slate-400 mb-8">
                  يرجى تسجيل تفاصيل الإنجاز لبناء قاعدة البيانات.
                </p>

                <form onSubmit={handleCompleteTask} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-xs text-slate-400">
                      الوقت المستغرق (بالدقائق)
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={closingDuration}
                      onChange={(e) =>
                        setClosingDuration(Number(e.target.value))
                      }
                      className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-slate-400">
                      حالة المكون البدنية (Component Condition)
                    </label>
                    <select
                      value={closingComponentCondition}
                      onChange={(e) =>
                        setClosingComponentCondition(
                          e.target.value as "EXCELLENT" | "WATCHFUL" | "CRITICAL",
                        )
                      }
                      className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl px-2.5 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors bg-opacity-95"
                    >
                      <option value="EXCELLENT" className="bg-[#0a0a0f]">🟩 ممتاز (Excellent)</option>
                      <option value="WATCHFUL" className="bg-[#0a0a0f]">🟨 يستحق المراقبة (Watchful)</option>
                      <option value="CRITICAL" className="bg-[#0a0a0f]">🟥 حرج / بحاجة صيانة وتغيير فوري (Critical)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-slate-400">
                      حالة القطع المستبدلة / ملاحظات
                    </label>
                    <textarea
                      required
                      placeholder="مثال: الفلتر القديم كان مسدوداً بالكامل..."
                      value={closingNotes}
                      onChange={(e) => setClosingNotes(e.target.value)}
                      className="w-full h-24 bg-[#0a0a0f] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors resize-none"
                    />
                  </div>
                  <div className="flex gap-3 pt-4" dir="ltr">
                    <button
                      type="button"
                      onClick={() => setClosingExecutionId(null)}
                      className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all font-bold text-xs uppercase tracking-widest border border-white/10"
                    >
                      إلغاء
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 text-black rounded-xl transition-all font-bold text-xs uppercase tracking-widest shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                    >
                      تم الإنجاز
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Unified Intelligent Service Entry (Chamber of Surgery) Modal */}
      <AnimatePresence>
        {isServiceEntryModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsServiceEntryModalOpen(false)}
              className="absolute inset-0 bg-[#0a0a0f]/85 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-2xl bg-[#0d0e15] border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                     <Wrench className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white uppercase tracking-wider">Chamber of Surgery</h3>
                    <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-mono">Unified BDR Intelligent Service Entry</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsServiceEntryModalOpen(false)}
                  className="p-2 rounded-lg bg-white/5 border border-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleRegisterUnifiedService} className="space-y-6">
                {/* Step 1: Select Machine (The Body) */}
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-2">1. Select Target Machinery (The Body)</label>
                  <select
                    required
                    value={serviceMachineId}
                    onChange={(e) => setServiceMachineId(e.target.value)}
                    className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
                  >
                    <option value="">-- Choose Physical Asset --</option>
                    {machines.map(m => {
                      const sect = sectors.find(s => s.id === m.sectorId);
                      return (
                        <option key={m.id} value={m.id}>
                          {m.referenceCode} - {m.serialNumber} ({sect?.name || "No Sector"})
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Step 2 & 3 Side by Side Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Step 2: Select Part Template */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-2">2. Affected Part Category</label>
                    <select
                      value={serviceComponentId}
                      onChange={(e) => setServiceComponentId(e.target.value)}
                      className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
                    >
                      <option value="">-- General / Non-Part Specific --</option>
                      {pdrTemplates.map(comp => (
                        <option key={comp.id} value={comp.id}>
                          [{comp.familyId}] {comp.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Step 3: Select Action Verb */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-2">3. Executed Operation (The Surgery)</label>
                    <select
                      required
                      value={serviceActionId}
                      onChange={(e) => setServiceActionId(e.target.value)}
                      className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
                    >
                      <option value="">-- Select Master Action --</option>
                      {ACTION_VERBS.map(act => (
                        <option key={act.id} value={act.id}>
                          {act.name} ([{act.type}])
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* System Awareness Nature & Tech Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white/[0.01] p-4 rounded-2xl border border-white/5">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 tracking-wider mb-2">System Diagnostic Awareness Flag</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setServiceType("PREV")}
                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold uppercase transition-all flex items-center justify-center gap-1.5 ${
                          serviceType === "PREV" 
                            ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400" 
                            : "bg-[#0a0a0f]/30 border border-transparent text-slate-500 hover:text-slate-300"
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        Preventive Care
                      </button>
                      <button
                        type="button"
                        onClick={() => setServiceType("CORR")}
                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold uppercase transition-all flex items-center justify-center gap-1.5 ${
                          serviceType === "CORR" 
                            ? "bg-red-500/10 border border-red-500/30 text-red-400" 
                            : "bg-[#0a0a0f]/30 border border-transparent text-slate-500 hover:text-slate-300"
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-red-400" />
                        Corrective Surgery
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 tracking-wider mb-2">Assigned Service Tech / Operator</label>
                    <select
                      value={serviceTechnicianId}
                      onChange={(e) => setServiceTechnicianId(e.target.value)}
                      className="w-full bg-[#0a0a0f] border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:outline-none"
                    >
                      <option value="">-- Set Executed By --</option>
                      {technicians.map(tech => (
                        <option key={tech.id} value={tech.id}>
                          {tech.name} ({tech.id.slice(0, 6)})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Step 4: Associated DNA Spares Panel */}
                {serviceComponentId && (
                  <div className="border border-white/5 rounded-2xl p-4 md:p-5 bg-[#0a0a0f]/40">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wide flex items-center gap-2">
                        <Component className="w-4 h-4 text-cyan-400" /> DNA Sibling Spare Parts consumption (PDR)
                      </h4>
                      <span className="text-[10px] text-slate-500 uppercase font-mono tracking-widest font-bold">Auto Pre-populated</span>
                    </div>

                    {serviceConsumedParts.length === 0 ? (
                      <p className="text-[11px] text-slate-500 italic text-center py-4">No specific spare part items connected to the standard template definitions of this component.</p>
                    ) : (
                      <div className="space-y-3">
                        {serviceConsumedParts.map((item, index) => {
                          const bpItem = pdrBlueprints.find(b => b.id === item.blueprintId);
                          const templateItem = pdrTemplates.find(t => t.id === bpItem?.templateId);
                          const stockRecord = inventory.find(inv => inv.blueprintId === item.blueprintId);
                          const availableQty = stockRecord?.quantityCurrent || 0;

                          return (
                            <div key={item.blueprintId} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3 rounded-xl bg-white/[0.01] border border-white/5 hover:border-white/10 transition-all">
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-slate-200 truncate">{templateItem?.name || "Spare Part"}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-[9px] font-mono font-bold text-cyan-400 px-1 rounded bg-cyan-950/20">{bpItem?.reference || "General"}</span>
                                  <span className="text-[10px] text-slate-500 font-sans">Bin: {stockRecord?.locationDetails || "Unspecified"}</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-3 shrink-0">
                                <span className="text-[10px] font-mono text-slate-500 uppercase">
                                  Stock: <strong className={availableQty > 0 ? "text-slate-300" : "text-red-500 font-black"}>{availableQty}</strong> Available
                                </span>

                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = [...serviceConsumedParts];
                                      updated[index].quantity = Math.max(0, updated[index].quantity - 1);
                                      setServiceConsumedParts(updated);
                                    }}
                                    className="w-7 h-7 rounded bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 font-bold text-xs"
                                  >
                                    -
                                  </button>
                                  <input
                                    type="number"
                                    min="0"
                                    max={availableQty}
                                    value={item.quantity}
                                    onChange={(e) => {
                                      const updated = [...serviceConsumedParts];
                                      const val = Math.min(availableQty, Math.max(0, Number(e.target.value)));
                                      updated[index].quantity = val;
                                      setServiceConsumedParts(updated);
                                    }}
                                    className="w-12 bg-[#0a0a0f] border border-white/10 rounded text-center text-xs text-white py-1 focus:outline-none"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = [...serviceConsumedParts];
                                      updated[index].quantity = Math.min(availableQty, updated[index].quantity + 1);
                                      setServiceConsumedParts(updated);
                                    }}
                                    className="w-7 h-7 rounded bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 font-bold text-xs"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Additional Specific Spec Inputs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-2">Duration Extent (Minutes)</label>
                    <div className="relative">
                      <Clock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-600" />
                      <input
                        type="number"
                        min="1"
                        required
                        value={serviceDuration}
                        onChange={(e) => setServiceDuration(Number(e.target.value))}
                        className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white text-sm focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-2">Surgical Notes & Observations</label>
                    <textarea
                      required
                      placeholder="Detail exact actions taken during surgery..."
                      value={serviceNotes}
                      onChange={(e) => setServiceNotes(e.target.value)}
                      rows={1}
                      className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none resize-none font-sans"
                    />
                  </div>
                </div>

                {/* Submit / Cancel Buttons */}
                <div className="flex gap-3 pt-4 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setIsServiceEntryModalOpen(false)}
                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all font-bold text-xs uppercase tracking-widest border border-white/10"
                  >
                    Abort Care
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl transition-all font-bold text-xs uppercase tracking-widest shadow-[0_4px_15px_rgba(139,92,246,0.3)]"
                  >
                    Complete Service Log
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Hidden Print Wrapper */}
      {printingMachineId && (
        <div
          className="hidden print:block fixed inset-0 bg-white z-[100] p-8 text-black"
          dir="ltr"
        >
          <div className="border-[3px] border-black p-8 max-w-4xl mx-auto">
            <div className="flex justify-between items-start mb-8 border-b-2 border-black pb-6">
              <div>
                <h1 className="text-4xl font-black mb-2 opacity-90">
                  BDR NEXUS
                </h1>
                <p className="text-sm font-bold tracking-widest text-slate-600 uppercase">
                  Preventive Work Order Card
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-slate-500">
                  DATE: {format(new Date(), "dd MMM yyyy")}
                </p>
              </div>
            </div>

            {(() => {
              const pm = enrichedMachines.find(
                (m) => m.id === printingMachineId,
              );
              if (!pm) return null;

              return (
                <>
                  <div className="grid grid-cols-2 gap-8 mb-8">
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
                        Asset Code
                      </p>
                      <p className="text-3xl font-black">{pm.referenceCode}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
                        Blueprint Model
                      </p>
                      <p className="text-xl font-bold">{pm.blueprintName}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
                        Technician
                      </p>
                      <p className="text-lg font-bold">
                        {pm.technician?.name || "Unassigned"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
                        Sector
                      </p>
                      <p className="text-lg font-bold">
                        {pm.sector?.name || "Unassigned"}
                      </p>
                    </div>
                  </div>

                  <div className="mb-8">
                    <h2 className="text-xl font-black uppercase tracking-widest border-b-2 border-black pb-2 mb-4">
                      Required Tasks & Parts
                    </h2>
                    <div className="space-y-4">
                      {pm.scheduledExecutions
                        .filter((ex) => ex.status === "PENDING")
                        .map((ex) => {
                          const taskDef = preventiveTasks.find(
                            (t) => t.id === ex.taskId,
                          );
                          let stockStatus = null;
                          if (taskDef?.pdrTemplateId) {
                            const mappedBpIds = partMappings
                              .filter((p) => p.machineId === pm.id)
                              .map((p) => p.blueprintId);
                            const mappedBpForTask = pdrBlueprints.find(
                              (bp) =>
                                mappedBpIds.includes(bp.id) &&
                                bp.templateId === taskDef.pdrTemplateId,
                            );
                            if (mappedBpForTask) {
                              const stock = inventory.find(
                                (inv) => inv.blueprintId === mappedBpForTask.id,
                              );
                              stockStatus = {
                                available: (stock?.quantityCurrent || 0) > 0,
                                location:
                                  stock?.locationDetails || "Unknown Bin",
                              };
                            }
                          }

                          return (
                            <div
                              key={ex.id}
                              className="border-2 border-slate-200 p-4 rounded-lg flex items-start gap-4"
                            >
                              <div className="w-6 h-6 border-2 border-black rounded" />
                              <div className="flex-1">
                                <p className="font-bold text-lg leading-none mb-2">
                                  {taskDef?.title || "Unknown Task"}
                                </p>
                                {stockStatus && (
                                  <p className="text-sm font-bold text-slate-600">
                                    Req. Part Status:{" "}
                                    {stockStatus.available
                                      ? `✓ In Stock (Loc: ${stockStatus.location})`
                                      : "✗ Out of Stock"}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>

                  <div className="mt-12 pt-8 border-t-2 border-black grid grid-cols-2 gap-8">
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">
                        Technician Signature
                      </p>
                      <div className="h-16 border-b-2 border-dotted border-slate-400" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">
                        Time Spent (Mins)
                      </p>
                      <div className="h-16 border-b-2 border-dotted border-slate-400" />
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
