import { useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  Zap,
  Bell,
  ShieldCheck,
  RefreshCw,
  Database,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type TaskStatus = "idle" | "pending" | "active" | "done";

interface Task {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  enabled: boolean;
  status: TaskStatus;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const INITIAL_TASKS: Task[] = [
  {
    id: "sync",
    label: "Sync Data Sources",
    description: "Pull latest records from all connected endpoints",
    icon: RefreshCw,
    enabled: false,
    status: "idle",
  },
  {
    id: "notify",
    label: "Send Notifications",
    description: "Dispatch pending alerts to subscribed users",
    icon: Bell,
    enabled: false,
    status: "idle",
  },
  {
    id: "backup",
    label: "Backup Database",
    description: "Create a versioned snapshot of the primary store",
    icon: Database,
    enabled: false,
    status: "idle",
  },
  {
    id: "audit",
    label: "Run Security Audit",
    description: "Scan permissions and flag anomalies for review",
    icon: ShieldCheck,
    enabled: false,
    status: "idle",
  },
];

const STEP_DELAY = 900;   // ms between cursor arriving and toggling
const TRAVEL_DURATION = 0.55; // seconds for cursor travel animation

// ─── Cursor dot ───────────────────────────────────────────────────────────────

interface AgentCursorProps {
  x: number;
  y: number;
  visible: boolean;
  clicking: boolean;
}

function AgentCursor({ x, y, visible, clicking }: AgentCursorProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="agent-cursor"
          className="pointer-events-none fixed z-50"
          initial={{ opacity: 0, scale: 0.4 }}
          animate={{
            opacity: 1,
            scale: clicking ? 1.35 : 1,
            x,
            y,
          }}
          exit={{ opacity: 0, scale: 0.4 }}
          transition={{
            opacity: { duration: 0.25 },
            scale: { type: "spring", stiffness: 500, damping: 28 },
            x: { duration: TRAVEL_DURATION, ease: [0.4, 0, 0.2, 1] },
            y: { duration: TRAVEL_DURATION, ease: [0.4, 0, 0.2, 1] },
          }}
          style={{ top: 0, left: 0 }}
        >
          {/* Outer ring pulse */}
          {clicking && (
            <motion.span
              className="absolute -inset-3 rounded-full bg-fuego-500/20"
              initial={{ scale: 0.6, opacity: 0.8 }}
              animate={{ scale: 2.2, opacity: 0 }}
              transition={{ duration: 0.55, ease: "easeOut" }}
            />
          )}
          {/* Core dot */}
          <span className="block h-4 w-4 rounded-full bg-fuego-500 shadow-[0_0_0_3px_rgba(255,98,0,0.25)]" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Toggle switch ────────────────────────────────────────────────────────────

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (val: boolean) => void;
  disabled?: boolean;
  id: string;
}

function ToggleSwitch({ checked, onChange, disabled, id }: ToggleSwitchProps) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label="Toggle task"
      id={`toggle-${id}`}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full",
        "border-2 border-transparent outline-none transition-colors duration-300",
        "focus-visible:ring-2 focus-visible:ring-fuego-500 focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-fuego-500" : "bg-border",
      )}
    >
      <motion.span
        layout
        className={cn(
          "pointer-events-none inline-block h-4 w-4 rounded-full bg-white",
          "shadow-[0_1px_3px_rgba(0,0,0,0.18)]",
        )}
        animate={{ x: checked ? 20 : 2 }}
        transition={{ type: "spring", stiffness: 500, damping: 32 }}
      />
    </button>
  );
}

// ─── Task card ────────────────────────────────────────────────────────────────

interface TaskCardProps {
  task: Task;
  index: number;
  onToggle: (id: string, val: boolean) => void;
  running: boolean;
}

function TaskCard({ task, index, onToggle, running }: TaskCardProps) {
  const Icon = task.icon;
  const isDone = task.status === "done";
  const isActive = task.status === "active";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className={cn(
        "group relative flex items-center gap-4 rounded-xl border bg-card px-5 py-4",
        "transition-all duration-300",
        isActive && "border-fuego-500/60 shadow-[0_0_0_3px_rgba(255,98,0,0.10)]",
        isDone && "border-fuego-500/30 bg-fuego-50/40",
        !isActive && !isDone && "border-border",
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors duration-300",
          isDone ? "bg-fuego-500/15 text-fuego-600" : "bg-secondary text-muted-foreground",
          isActive && "bg-fuego-500/10 text-fuego-500",
        )}
      >
        <Icon className="h-4.5 w-4.5" strokeWidth={1.75} />
      </div>

      {/* Text */}
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-sm font-semibold leading-tight transition-colors duration-300",
            isDone ? "text-fuego-700" : "text-foreground",
          )}
        >
          {task.label}
        </p>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
          {task.description}
        </p>
      </div>

      {/* Status badge */}
      <AnimatePresence mode="wait">
        {isDone && (
          <motion.span
            key="done-badge"
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            transition={{ type: "spring", stiffness: 500, damping: 28 }}
            className="mr-2 flex items-center gap-1 text-xs font-medium text-fuego-600"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Done
          </motion.span>
        )}
        {isActive && (
          <motion.span
            key="active-badge"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mr-2 flex items-center gap-1 text-xs font-medium text-fuego-500"
          >
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-fuego-500" />
            Running
          </motion.span>
        )}
      </AnimatePresence>

      {/* Toggle */}
      <div id={`toggle-wrap-${task.id}`}>
        <ToggleSwitch
          id={task.id}
          checked={task.enabled}
          onChange={(val) => onToggle(task.id, val)}
          disabled={running}
        />
      </div>
    </motion.div>
  );
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({ value, total }: { value: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((value / total) * 100);
  return (
    <div className="flex items-center gap-3">
      <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-border">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-fuego-500"
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        />
      </div>
      <span className="w-8 text-right text-xs tabular-nums text-muted-foreground">
        {pct}%
      </span>
    </div>
  );
}

// ─── Main dashboard ───────────────────────────────────────────────────────────

type RunState = "idle" | "running" | "complete";

export default function TaskAutomationDashboard() {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [runState, setRunState] = useState<RunState>("idle");

  // Cursor state — absolute page coords fed directly to AgentCursor
  const [cursor, setCursor] = useState({ x: 0, y: 0 });
  const [cursorVisible, setCursorVisible] = useState(false);
  const [cursorClicking, setCursorClicking] = useState(false);

  // Refs to the Execute button — toggle wrappers are found via getElementById
  const executeButtonRef = useRef<HTMLButtonElement>(null);

  const completedCount = tasks.filter((t) => t.status === "done").length;
  const isRunning = runState === "running";

  // ── helpers ──────────────────────────────────────────────────────────────
  const getCenterOf = useCallback((el: HTMLElement | null): { x: number; y: number } => {
    if (!el) return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const r = el.getBoundingClientRect();
    // Offset so the dot's center lands on the element's center
    return { x: r.left + r.width / 2 - 8, y: r.top + r.height / 2 - 8 };
  }, []);

  const sleep = useCallback((ms: number) => new Promise<void>((res) => setTimeout(res, ms)), []);

  const moveTo = useCallback(
    async (el: HTMLElement | null) => {
      const pos = getCenterOf(el);
      setCursor(pos);
      // wait for the travel animation to finish before returning
      await sleep(TRAVEL_DURATION * 1000 + 80);
    },
    [getCenterOf, sleep],
  );

  const click = useCallback(async () => {
    setCursorClicking(true);
    await sleep(260);
    setCursorClicking(false);
    await sleep(120);
  }, [sleep]);

  // ── update a single task field ────────────────────────────────────────────
  const patchTask = useCallback((id: string, patch: Partial<Task>) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }, []);

  // ── manual toggle (user clicks) ───────────────────────────────────────────
  const handleToggle = useCallback(
    (id: string, val: boolean) => {
      if (isRunning) return;
      patchTask(id, { enabled: val });
    },
    [isRunning, patchTask],
  );

  // ── Execute sequence ──────────────────────────────────────────────────────
  const handleExecute = useCallback(async () => {
    if (isRunning) return;

    // Reset tasks back to off/idle
    setTasks(INITIAL_TASKS.map((t) => ({ ...t, enabled: false, status: "idle" as TaskStatus })));
    setRunState("running");

    // Spawn cursor at the Execute button
    const btnPos = getCenterOf(executeButtonRef.current);
    setCursor(btnPos);
    setCursorVisible(true);
    await sleep(300);

    // Walk through each task toggle
    for (const task of INITIAL_TASKS) {
      const toggleEl = document.getElementById(`toggle-wrap-${task.id}`);

      // Mark active while cursor travels
      patchTask(task.id, { status: "active" });

      await moveTo(toggleEl);
      await sleep(STEP_DELAY);

      // Simulate click: toggle on
      await click();
      patchTask(task.id, { enabled: true, status: "done" });
      await sleep(320);
    }

    // Return cursor to Execute button
    await moveTo(executeButtonRef.current);
    await sleep(300);
    setCursorVisible(false);
    setRunState("complete");
  }, [isRunning, getCenterOf, sleep, moveTo, click, patchTask]);

  // ── reset ─────────────────────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    setTasks(INITIAL_TASKS.map((t) => ({ ...t, enabled: false, status: "idle" as TaskStatus })));
    setRunState("idle");
    setCursorVisible(false);
  }, []);

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Portal-like fixed cursor — rendered outside layout flow */}
      <AgentCursor
        x={cursor.x}
        y={cursor.y}
        visible={cursorVisible}
        clicking={cursorClicking}
      />

      <div className="flex min-h-dvh flex-col bg-background text-foreground">
        {/* Header */}
        <header className="border-b border-border/60">
          <div className="mx-auto flex w-full max-w-2xl items-center justify-between px-6 py-5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-fuego-500">
                <Zap className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
              </div>
              <span className="font-display text-base font-semibold tracking-tight">
                Execute
              </span>
            </div>
            <span className="text-xs text-muted-foreground">
              Task Automation · {INITIAL_TASKS.length} tasks
            </span>
          </div>
        </header>

        {/* Body */}
        <main className="mx-auto w-full max-w-2xl flex-1 px-6 pb-24 pt-10">

          {/* Heading */}
          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold tracking-tight">
              Here You Do It
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Hand the agent your cursor. It carries out the work, then returns home.
            </p>
          </div>

          {/* Task cards */}
          <div className="flex flex-col gap-3">
            {tasks.map((task, i) => (
              <TaskCard
                key={task.id}
                task={task}
                index={i}
                onToggle={handleToggle}
                running={isRunning}
              />
            ))}
          </div>

          {/* Progress */}
          <AnimatePresence>
            {(isRunning || runState === "complete") && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.3 }}
                className="mt-6"
              >
                <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Progress</span>
                  <span>{completedCount} / {INITIAL_TASKS.length} tasks</span>
                </div>
                <ProgressBar value={completedCount} total={INITIAL_TASKS.length} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Completion banner */}
          <AnimatePresence>
            {runState === "complete" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 12 }}
                transition={{ type: "spring", stiffness: 380, damping: 28 }}
                className={cn(
                  "mt-6 flex items-center gap-3 rounded-xl border border-fuego-500/30",
                  "bg-fuego-50/60 px-5 py-4",
                )}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-fuego-500">
                  <CheckCircle2 className="h-4.5 w-4.5 text-white" strokeWidth={2.5} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-fuego-800">All tasks complete</p>
                  <p className="text-xs text-fuego-600/80">
                    The agent carried out the work and returned home.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Execute / Reset button */}
          <div className="mt-8 flex gap-3">
            <button
              ref={executeButtonRef}
              onClick={handleExecute}
              disabled={isRunning || runState === "complete"}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg px-5 py-2.5",
                "text-sm font-semibold text-white shadow-sm",
                "bg-thermal transition-all duration-200",
                "hover:-translate-y-0.5 hover:brightness-105",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuego-500 focus-visible:ring-offset-2",
                "disabled:pointer-events-none disabled:opacity-40",
              )}
            >
              <Zap className="h-4 w-4" strokeWidth={2.5} />
              {isRunning ? "Running…" : "Execute"}
            </button>

            {runState !== "idle" && !isRunning && (
              <motion.button
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={handleReset}
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2.5",
                  "text-sm font-medium text-muted-foreground",
                  "transition-colors hover:border-foreground/30 hover:text-foreground",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuego-500 focus-visible:ring-offset-2",
                )}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Reset
              </motion.button>
            )}
          </div>

          {/* Hint */}
          {runState === "idle" && (
            <p className="mt-4 text-xs text-muted-foreground">
              Press <span className="font-medium text-foreground">Execute</span> and watch the agent carry out the work.
            </p>
          )}
        </main>
      </div>
    </>
  );
}
