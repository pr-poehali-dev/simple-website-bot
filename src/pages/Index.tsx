import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Icon from "@/components/ui/icon";

type Priority = "high" | "medium" | "low";
type Category = "work" | "personal" | "health" | "finance";

interface Task {
  id: number;
  title: string;
  time: string;
  date: string;
  category: Category;
  priority: Priority;
  done: boolean;
}

const CATEGORIES: Record<Category, { label: string; color: string; bg: string }> = {
  work: { label: "Работа", color: "text-blue-400", bg: "bg-blue-400/10" },
  personal: { label: "Личное", color: "text-purple-400", bg: "bg-purple-400/10" },
  health: { label: "Здоровье", color: "text-emerald-400", bg: "bg-emerald-400/10" },
  finance: { label: "Финансы", color: "text-amber-400", bg: "bg-amber-400/10" },
};

const PRIORITIES: Record<Priority, { label: string; color: string; dot: string }> = {
  high: { label: "Высокий", color: "text-red-400", dot: "bg-red-400" },
  medium: { label: "Средний", color: "text-amber-400", dot: "bg-amber-400" },
  low: { label: "Низкий", color: "text-slate-400", dot: "bg-slate-400" },
};

const INITIAL_TASKS: Task[] = [
  { id: 1, title: "Встреча с командой", time: "10:00", date: "Сегодня", category: "work", priority: "high", done: false },
  { id: 2, title: "Оплатить аренду", time: "18:00", date: "Сегодня", category: "finance", priority: "high", done: false },
  { id: 3, title: "Спортзал", time: "19:30", date: "Сегодня", category: "health", priority: "medium", done: true },
  { id: 4, title: "Позвонить родителям", time: "20:00", date: "Завтра", category: "personal", priority: "low", done: false },
  { id: 5, title: "Отчёт за квартал", time: "09:00", date: "Завтра", category: "work", priority: "high", done: false },
  { id: 6, title: "Записать к врачу", time: "12:00", date: "Завтра", category: "health", priority: "medium", done: false },
];

const COMMANDS = [
  { cmd: "/add", desc: "Добавить напоминание" },
  { cmd: "/list", desc: "Список задач" },
  { cmd: "/done", desc: "Отметить выполненным" },
  { cmd: "/del", desc: "Удалить задачу" },
];

export default function Index() {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [activeCategory, setActiveCategory] = useState<Category | "all">("all");
  const [activePriority, setActivePriority] = useState<Priority | "all">("all");

  const filtered = tasks.filter((t) => {
    const catOk = activeCategory === "all" || t.category === activeCategory;
    const prOk = activePriority === "all" || t.priority === activePriority;
    return catOk && prOk;
  });

  const stats = {
    total: tasks.length,
    done: tasks.filter((t) => t.done).length,
    today: tasks.filter((t) => t.date === "Сегодня").length,
    high: tasks.filter((t) => t.priority === "high" && !t.done).length,
  };

  const toggle = (id: number) =>
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));

  return (
    <div className="min-h-screen bg-background font-sans">
      {/* Header */}
      <header className="border-b border-border/50 px-6 py-4 flex items-center justify-between animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center">
            <Icon name="Bell" size={18} className="text-primary" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-foreground">RemindBot</h1>
            <p className="text-xs text-muted-foreground">Умные напоминания в Telegram</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-muted-foreground">Бот активен</span>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 animate-fade-in">
          {[
            { label: "Всего задач", value: stats.total, icon: "List", color: "text-primary" },
            { label: "Выполнено", value: stats.done, icon: "CheckCircle2", color: "text-emerald-400" },
            { label: "На сегодня", value: stats.today, icon: "Calendar", color: "text-purple-400" },
            { label: "Срочных", value: stats.high, icon: "AlertCircle", color: "text-red-400" },
          ].map((s, i) => (
            <Card
              key={i}
              className="bg-card border-border/50 p-4 flex flex-col gap-2 hover:border-border transition-colors"
            >
              <Icon name={s.icon} size={18} className={s.color} />
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </Card>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Tasks list */}
          <div className="md:col-span-2 space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={activeCategory === "all" ? "default" : "ghost"}
                className="h-7 text-xs"
                onClick={() => setActiveCategory("all")}
              >
                Все
              </Button>
              {(Object.entries(CATEGORIES) as [Category, typeof CATEGORIES[Category]][]).map(([key, val]) => (
                <Button
                  key={key}
                  size="sm"
                  variant={activeCategory === key ? "default" : "ghost"}
                  className={`h-7 text-xs ${activeCategory === key ? "" : val.color}`}
                  onClick={() => setActiveCategory(key)}
                >
                  {val.label}
                </Button>
              ))}
            </div>

            <div className="flex gap-2">
              {(["all", "high", "medium", "low"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setActivePriority(p)}
                  className={`text-xs px-3 py-1 rounded-full border transition-all ${
                    activePriority === p
                      ? "border-primary text-primary bg-primary/10"
                      : "border-border/40 text-muted-foreground hover:border-border"
                  }`}
                >
                  {p === "all" ? "Все" : PRIORITIES[p].label}
                </button>
              ))}
            </div>

            {/* Task cards */}
            <div className="space-y-2">
              {filtered.map((task, i) => {
                const cat = CATEGORIES[task.category];
                const pri = PRIORITIES[task.priority];
                return (
                  <div
                    key={task.id}
                    className={`group flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer animate-fade-in ${
                      task.done
                        ? "bg-muted/30 border-border/20 opacity-50"
                        : "bg-card border-border/50 hover:border-border"
                    }`}
                    style={{ animationDelay: `${i * 0.05}s` }}
                    onClick={() => toggle(task.id)}
                  >
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        task.done
                          ? "bg-emerald-400 border-emerald-400"
                          : "border-border group-hover:border-primary"
                      }`}
                    >
                      {task.done && <Icon name="Check" size={11} className="text-background" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${task.done ? "line-through text-muted-foreground" : "text-foreground"}`}>
                        {task.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground">{task.date} · {task.time}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cat.color} ${cat.bg}`}>
                        {cat.label}
                      </span>
                      <div className={`w-2 h-2 rounded-full ${pri.dot}`} title={pri.label} />
                    </div>
                  </div>
                );
              })}

              {filtered.length === 0 && (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  Нет задач в этой категории
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Bot commands */}
            <Card className="bg-card border-border/50 p-4 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <Icon name="Terminal" size={15} className="text-muted-foreground" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Команды бота</span>
              </div>
              {COMMANDS.map((c) => (
                <div key={c.cmd} className="flex items-center justify-between gap-2">
                  <code className="text-xs bg-muted/60 px-2 py-1 rounded text-primary font-mono">{c.cmd}</code>
                  <span className="text-xs text-muted-foreground text-right">{c.desc}</span>
                </div>
              ))}
            </Card>

            {/* Progress */}
            <Card className="bg-card border-border/50 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Icon name="TrendingUp" size={15} className="text-muted-foreground" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Прогресс дня</span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Выполнено</span>
                  <span className="text-foreground font-medium">{stats.done} / {stats.today}</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-700"
                    style={{ width: `${stats.today ? (stats.done / stats.today) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2 pt-1">
                {(Object.entries(CATEGORIES) as [Category, typeof CATEGORIES[Category]][]).map(([key, val]) => {
                  const count = tasks.filter((t) => t.category === key).length;
                  return (
                    <div key={key} className="flex items-center justify-between">
                      <span className={`text-xs ${val.color}`}>{val.label}</span>
                      <Badge variant="secondary" className="text-xs h-5 px-2">{count}</Badge>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Telegram CTA */}
            <Card className="bg-gradient-to-br from-primary/20 to-accent/20 border-primary/30 p-4 space-y-3">
              <Icon name="Send" size={18} className="text-primary" />
              <p className="text-sm font-medium text-foreground">Подключите бота в Telegram</p>
              <p className="text-xs text-muted-foreground">Получайте напоминания прямо в мессенджере</p>
              <Button size="sm" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 text-xs">
                <Icon name="ExternalLink" size={13} className="mr-1.5" />
                Открыть в Telegram
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}