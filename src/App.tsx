import React, { useState, useEffect, useRef } from "react";
import {
  SleepRecord,
  MealItem,
  WorkoutRecord,
  StudyRecord,
  MustDoTask,
  UserSession,
  WagerBinding,
  WagerInvite,
  WaterRecord,
  WeightRecord,
} from "./types";
import CheckInModal from "./components/CheckInModal";
import {
  Moon,
  Utensils,
  Dumbbell,
  BookOpen,
  Droplet,
  Scale,
  Award,
  User,
  Settings,
  Plus,
  Trash2,
  Database,
  ArrowDownToLine,
  ArrowUpToLine,
  LogOut,
  RefreshCw,
  Clock,
  Star,
  Key,
  Lock,
  ListTodo,
  Check,
  Eye,
  EyeOff,
  Sparkles,
  Compass,
  Brain
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const MOTTO_LIST = [
  "自律不是束缚，而是通往自由唯一的路径。",
  "你今天的选择，决定了你三年后的模样。",
  "不积跬步，无以至千里；不积小流，无以成江海。",
  "每一个不曾起舞的日子，都是对生命的辜负。",
  "控制自我，方能执掌生命的广角尺度。",
];

const DEFAULT_AVATARS = [
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
  "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80"
];

export default function App() {
  const [activeTab, setActiveTab] = useState<"home" | "mustdo" | "settings" | "ai_studio">("home");
  const [motto, setMotto] = useState("");
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);

  // States loaded from local storage
  const [sleepRecords, setSleepRecords] = useState<SleepRecord[]>(() => {
    const raw = localStorage.getItem("min_sleep_records");
    return raw ? JSON.parse(raw) : [];
  });

  const [mealItems, setMealItems] = useState<MealItem[]>(() => {
    const raw = localStorage.getItem("min_meal_items");
    return raw ? JSON.parse(raw) : [];
  });

  const [workoutRecords, setWorkoutRecords] = useState<WorkoutRecord[]>(() => {
    const raw = localStorage.getItem("min_workout_records");
    return raw ? JSON.parse(raw) : [];
  });

  const [studyRecords, setStudyRecords] = useState<StudyRecord[]>(() => {
    const raw = localStorage.getItem("min_study_records");
    return raw ? JSON.parse(raw) : [];
  });

  const [waterRecords, setWaterRecords] = useState<WaterRecord[]>(() => {
    const raw = localStorage.getItem("min_water_records");
    return raw ? JSON.parse(raw) : [];
  });

  const [weightRecords, setWeightRecords] = useState<WeightRecord[]>(() => {
    const raw = localStorage.getItem("min_weight_records");
    return raw ? JSON.parse(raw) : [];
  });

  const [mustDoTasks, setMustDoTasks] = useState<MustDoTask[]>(() => {
    const raw = localStorage.getItem("min_must_do_tasks");
    return raw ? JSON.parse(raw) : [
      { id: "1", period: "today", text: "今日早起拉伸并喝一杯温水", time: "07:00", completed: false, createdAt: new Date().toISOString().split("T")[0] },
      { id: "2", period: "week", text: "本周至少进行150分钟的有氧运动", time: "🧭 周末前", completed: false, createdAt: new Date().toISOString().split("T")[0] },
      { id: "3", period: "month", text: "本月精读一本专业人文书籍并做输出", time: "📅 月底", completed: false, createdAt: new Date().toISOString().split("T")[0] },
    ];
  });

  // User auth session state
  const [session, setSession] = useState<UserSession>(() => {
    const raw = localStorage.getItem("min_user_session");
    if (raw) return JSON.parse(raw);
    return {
      username: "Guest",
      name: "自律修行旅客",
      id: "SLF-2026-X88",
      avatarUrl: DEFAULT_AVATARS[0],
      isLoggedIn: false,
      apiProvider: "Google AI Studio",
      apiKey: "",
    };
  });

  // Task creation fields in custom "必做时间" Tab
  const [newTaskPeriod, setNewTaskPeriod] = useState<"today" | "week" | "month">("today");
  const [newTaskText, setNewTaskText] = useState("");
  const [newTaskTime, setNewTaskTime] = useState("");

  // Standalone Auth UI screens state
  const [isLoginView, setIsLoginView] = useState(true);
  const [authUsername, setAuthUsername] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authNickname, setAuthNickname] = useState("");
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");

  // Settings view details
  const [settingsName, setSettingsName] = useState(session.name);
  const [settingsAvatar, setSettingsAvatar] = useState(session.avatarUrl);
  const [settingsProvider, setSettingsProvider] = useState(session.apiProvider);
  const [settingsKey, setSettingsKey] = useState(session.apiKey);
  const [showKey, setShowKey] = useState(false);

  // Syncing simulation state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const skipAutoUpload = useRef(false);
  const isInitialMount = useRef(true);

  // Worker and AI states
  const [workerApiUrl, setWorkerApiUrl] = useState(() => localStorage.getItem("min_worker_api_url") || "https://zilv.alunapi.top");
  const [authInviteCode, setAuthInviteCode] = useState("");
  const [aiSubTab, setAiSubTab] = useState<"diet" | "workout" | "challenge" | "learning">("diet");
  
  const [dietAdvice, setDietAdvice] = useState<DietAdvice | null>(() => {
    const raw = localStorage.getItem("min_ai_diet_advice");
    return raw ? JSON.parse(raw) : null;
  });
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlan | null>(() => {
    const raw = localStorage.getItem("min_ai_workout_plan");
    return raw ? JSON.parse(raw) : null;
  });
  const [skillChallenge, setSkillChallenge] = useState<SkillChallenge | null>(() => {
    const raw = localStorage.getItem("min_ai_skill_challenge");
    return raw ? JSON.parse(raw) : null;
  });
  const [learningPath, setLearningPath] = useState<LearningPath | null>(() => {
    const raw = localStorage.getItem("min_ai_learning_path");
    return raw ? JSON.parse(raw) : null;
  });

  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  // Input states for AI Studio features
  const [workoutTarget, setWorkoutTarget] = useState("减脂控重");
  const [workoutLevel, setWorkoutLevel] = useState("初学者");
  const [workoutDuration, setWorkoutDuration] = useState(30);
  const [workoutGender, setWorkoutGender] = useState("男");
  const [workoutAge, setWorkoutAge] = useState(25);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [learnSubject, setLearnSubject] = useState("");
  const [learnDays, setLearnDays] = useState(30);

  // ==================== 自律对赌绑定状态 ====================
  const [bindingInfo, setBindingInfo] = useState<WagerBinding | null>(null);
  const [bondingInvites, setBondingInvites] = useState<WagerInvite[]>([]);
  const [inviteFriendUsername, setInviteFriendUsername] = useState("");
  const [inviteWagerTarget, setInviteWagerTarget] = useState("");
  const [inviteWagerDeposit, setInviteWagerDeposit] = useState("10");
  const [inviteWagerDuration, setInviteWagerDuration] = useState("week");
  const [wagerLoading, setWagerLoading] = useState(false);
  const [wagerError, setWagerError] = useState("");

  const handleFetchWagerStatus = async () => {
    if (!session.isLoggedIn) return;
    try {
      const data = await requestCF("/api/binding/status");
      if (data.hasBinding) {
        setBindingInfo(data);
      } else {
        setBindingInfo(null);
      }
    } catch (err: any) {
      console.error("获取对赌状态失败:", err);
    }
  };

  const handleFetchWagerInvites = async () => {
    if (!session.isLoggedIn) return;
    try {
      const data = await requestCF("/api/binding/invites");
      setBondingInvites(data || []);
    } catch (err: any) {
      console.error("获取对赌邀请失败:", err);
    }
  };

  // 发起对赌邀请
  const handleSendWagerInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteFriendUsername.trim()) {
      setWagerError("请填写好友的账号用户名哦！");
      return;
    }
    setWagerLoading(true);
    setWagerError("");
    try {
      const res = await requestCF("/api/binding/invite", {
        method: "POST",
        body: JSON.stringify({
          friendUsername: inviteFriendUsername.trim(),
          target: inviteWagerTarget.trim() || "每日至少打卡一次",
          duration: inviteWagerDuration,
          deposit: Number(inviteWagerDeposit)
        })
      });
      alert(res.message || "对赌绑定邀请已成功发送！");
      setInviteFriendUsername("");
      setInviteWagerTarget("");
    } catch (err: any) {
      setWagerError(err.message || "发送对赌邀请失败");
      setTimeout(() => setWagerError(""), 4000);
    } finally {
      setWagerLoading(false);
    }
  };

  // 接受对赌邀请
  const handleAcceptWagerInvite = async (inviteId: string) => {
    setWagerLoading(true);
    setWagerError("");
    try {
      const res = await requestCF("/api/binding/accept", {
        method: "POST",
        body: JSON.stringify({ inviteId })
      });
      alert(res.message || "对赌挑战已成功启动，开始监督彼此吧！");
      handleFetchWagerStatus();
      handleFetchWagerInvites();
    } catch (err: any) {
      setWagerError(err.message || "接受对赌邀请失败");
      setTimeout(() => setWagerError(""), 4000);
    } finally {
      setWagerLoading(false);
    }
  };

  // 拒绝对赌邀请
  const handleRejectWagerInvite = async (inviteId: string) => {
    setWagerLoading(true);
    setWagerError("");
    try {
      await requestCF("/api/binding/reject", {
        method: "POST",
        body: JSON.stringify({ inviteId })
      });
      handleFetchWagerInvites();
    } catch (err: any) {
      setWagerError(err.message || "拒绝邀请操作失败");
      setTimeout(() => setWagerError(""), 4000);
    } finally {
      setWagerLoading(false);
    }
  };

  // 开启狂暴模式
  const handleActivateRageMode = async () => {
    setWagerLoading(true);
    setWagerError("");
    try {
      const res = await requestCF("/api/binding/rage-mode", {
        method: "POST"
      });
      alert(res.message || "🔥 狂暴魔鬼模式启动成功！在接下来的挑战中必须全勤打卡哦！");
      handleFetchWagerStatus();
    } catch (err: any) {
      setWagerError(err.message || "启动狂暴模式失败");
      setTimeout(() => setWagerError(""), 4000);
    } finally {
      setWagerLoading(false);
    }
  };

  // 挂载、登录状态变化时轮询
  useEffect(() => {
    if (session.isLoggedIn && workerApiUrl) {
      handleFetchWagerStatus();
      handleFetchWagerInvites();
      
      // 每次进入页面/登录状态建立时，默认静默同步加载云端最新打卡印记
      handleCloudSync(true);

      const interval = setInterval(() => {
        handleFetchWagerStatus();
        handleFetchWagerInvites();
      }, 20000); // 每 20 秒轮询更新

      return () => clearInterval(interval);
    } else {
      setBindingInfo(null);
      setBondingInvites([]);
    }
  }, [session.isLoggedIn, workerApiUrl]);

  // 本地打卡记录变化时触发云端状态核算
  useEffect(() => {
    if (session.isLoggedIn && workerApiUrl) {
      handleFetchWagerStatus();
    }
  }, [sleepRecords, mealItems, workoutRecords, studyRecords, waterRecords]);

  // Sync AI suggestions to localStorage
  useEffect(() => {
    localStorage.setItem("min_ai_diet_advice", JSON.stringify(dietAdvice));
  }, [dietAdvice]);
  useEffect(() => {
    localStorage.setItem("min_ai_workout_plan", JSON.stringify(workoutPlan));
  }, [workoutPlan]);
  useEffect(() => {
    localStorage.setItem("min_ai_skill_challenge", JSON.stringify(skillChallenge));
  }, [skillChallenge]);
  useEffect(() => {
    localStorage.setItem("min_ai_learning_path", JSON.stringify(learningPath));
  }, [learningPath]);

  // Request Cloudflare Helper
  const requestCF = async (path: string, options: RequestInit = {}) => {
    const workerUrl = workerApiUrl || "https://zilv.alunapi.top";
    const token = localStorage.getItem("min_cf_token") || "";
    const apiProvider = session.apiProvider || "SiliconFlow";

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-AI-Provider": apiProvider,
      ...(token ? { "Authorization": `Bearer ${token}` } : {}),
      ...((options.headers as Record<string, string>) || {}),
    };

    const response = await fetch(`${workerUrl.replace(/\/$/, "")}${path}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `请求失败，状态码: ${response.status}`);
    }

    return response.json();
  };

  // AI 智慧阁请求处理
  const handleGetDietAdvice = async () => {
    const todayStr = new Date().toISOString().split("T")[0];
    const todayMeals = mealItems.filter(m => m.date === todayStr);
    if (todayMeals.length === 0) {
      setAiError("⚠️ 今天还没有录入任何餐饮打卡数据哦，请在主页打卡后再来剖析！");
      return;
    }
    setIsAiLoading(true);
    setAiError("");
    try {
      const data = await requestCF("/api/diet-advice", {
        method: "POST",
        body: JSON.stringify({ meals: todayMeals })
      });
      setDietAdvice(data);
    } catch (err: any) {
      setAiError(err.message || "获取饮食分析失败");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleGetWorkoutPlan = async () => {
    setIsAiLoading(true);
    setAiError("");
    try {
      const data = await requestCF("/api/workout-plan", {
        method: "POST",
        body: JSON.stringify({
          target: workoutTarget,
          level: workoutLevel,
          durationMinutes: Number(workoutDuration),
          gender: workoutGender,
          age: Number(workoutAge)
        })
      });
      setWorkoutPlan(data);
    } catch (err: any) {
      setAiError(err.message || "获取运动计划失败");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleGetSkillChallenge = async () => {
    setIsAiLoading(true);
    setAiError("");
    try {
      const completedChallenges = mustDoTasks.filter(t => t.completed).map(t => ({ title: t.text }));
      const data = await requestCF("/api/skill-challenge", {
        method: "POST",
        body: JSON.stringify({
          interests: selectedInterests,
          completedChallenges
        })
      });
      setSkillChallenge(data);
    } catch (err: any) {
      setAiError(err.message || "获取挑战失败");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleClaimChallenge = (challenge: any) => {
    if (!challenge) return;
    const newTask: MustDoTask = {
      id: crypto.randomUUID(),
      period: "today",
      text: `【自律挑战】${challenge.title}：${challenge.description.substring(0, 45)}...`,
      time: `⏱️ ${challenge.estimatedTime}`,
      completed: false,
      createdAt: new Date().toISOString().split("T")[0]
    };
    setMustDoTasks([...mustDoTasks, newTask]);
    alert(`🎉 成功领用挑战！已将【${challenge.title}】存入您的今日必做清单！`);
    setActiveTab("home");
  };

  const handleGetLearningPath = async () => {
    if (!learnSubject.trim()) {
      setAiError("请输入您想深入规划学习的主题（例如：React开发、日语日常口语等）");
      return;
    }
    setIsAiLoading(true);
    setAiError("");
    try {
      const data = await requestCF("/api/learning-path", {
        method: "POST",
        body: JSON.stringify({
          subject: learnSubject.trim(),
          days: Number(learnDays)
        })
      });
      setLearningPath(data);
    } catch (err: any) {
      setAiError(err.message || "生成学习路径失败");
    } finally {
      setIsAiLoading(false);
    }
  };

  // Auto save state back to local storage
  useEffect(() => {
    localStorage.setItem("min_sleep_records", JSON.stringify(sleepRecords));
  }, [sleepRecords]);

  useEffect(() => {
    localStorage.setItem("min_meal_items", JSON.stringify(mealItems));
  }, [mealItems]);

  useEffect(() => {
    localStorage.setItem("min_workout_records", JSON.stringify(workoutRecords));
  }, [workoutRecords]);

  useEffect(() => {
    localStorage.setItem("min_study_records", JSON.stringify(studyRecords));
  }, [studyRecords]);

  useEffect(() => {
    localStorage.setItem("min_water_records", JSON.stringify(waterRecords));
  }, [waterRecords]);

  useEffect(() => {
    localStorage.setItem("min_must_do_tasks", JSON.stringify(mustDoTasks));
  }, [mustDoTasks]);

  useEffect(() => {
    localStorage.setItem("min_user_session", JSON.stringify(session));
  }, [session]);

  useEffect(() => {
    localStorage.setItem("min_weight_records", JSON.stringify(weightRecords));
  }, [weightRecords]);

  // 自动同步打卡数据到云端（已登录且有网络时静默进行）
  useEffect(() => {
    // 避免在刚加载组件时，由于本地 state 还没得到云端合并就发起覆盖上传
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (skipAutoUpload.current) {
      return;
    }

    if (!session.isLoggedIn || !workerApiUrl) return;

    const token = localStorage.getItem("min_cf_token");
    if (!token) return;

    // 延迟 800ms 进行静默上传（Debounce 减震，避免高频操作触发多次上传）
    const delayDebounce = setTimeout(async () => {
      try {
        const minBackup = {
          sleepRecords,
          mealItems,
          workoutRecords,
          studyRecords,
          mustDoTasks,
          waterRecords,
          weightRecords,
        };
        
        await fetch(`${workerApiUrl.replace(/\/$/, "")}/api/sync/upload`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify(minBackup)
        });
        console.log("云端打卡流水自动静默上传备份成功");
      } catch (err) {
        console.error("云端打卡流水自动静默上传备份失败:", err);
      }
    }, 800);

    return () => clearTimeout(delayDebounce);
  }, [sleepRecords, mealItems, workoutRecords, studyRecords, mustDoTasks, waterRecords, weightRecords]);

  // Adjust input elements automatically if session refreshes
  useEffect(() => {
    setSettingsName(session.name);
    setSettingsAvatar(session.avatarUrl);
    setSettingsProvider(session.apiProvider);
    setSettingsKey(session.apiKey);
  }, [session]);

  // Set fresh motto/quotes as page state switches
  useEffect(() => {
    const rand = MOTTO_LIST[Math.floor(Math.random() * MOTTO_LIST.length)];
    setMotto(rand);
  }, [activeTab]);

  // Helpers to append check-ins
  const handleAddSleep = (rec: { sleepTime: string; wakeTime: string; quality: number; note: string }) => {
    const todayStr = new Date().toISOString().split("T")[0];
    const duration = calculateDuration(rec.sleepTime, rec.wakeTime);
    const newRecord: SleepRecord = {
      id: crypto.randomUUID(),
      date: todayStr,
      sleepTime: rec.sleepTime,
      wakeTime: rec.wakeTime,
      duration,
      quality: rec.quality,
      note: rec.note,
    };
    setSleepRecords([newRecord, ...sleepRecords]);
  };

  const handleAddDiet = (rec: { period: string; text: string; note: string }) => {
    const todayStr = new Date().toISOString().split("T")[0];
    const newMeal: MealItem = {
      id: crypto.randomUUID(),
      date: todayStr,
      period: rec.period as any,
      text: rec.text,
      note: rec.note || undefined,
    };
    setMealItems([newMeal, ...mealItems]);
  };

  const handleAddWorkout = (rec: { type: string; duration: number }) => {
    const todayStr = new Date().toISOString().split("T")[0];
    const newRecord: WorkoutRecord = {
      id: crypto.randomUUID(),
      date: todayStr,
      type: rec.type,
      duration: rec.duration,
      calories: Math.round(rec.duration * 6.5),
      intensity: "中",
    };
    setWorkoutRecords([newRecord, ...workoutRecords]);
  };

  const handleAddStudy = (rec: { content: string; duration: number }) => {
    const todayStr = new Date().toISOString().split("T")[0];
    const newRecord: StudyRecord = {
      id: crypto.randomUUID(),
      date: todayStr,
      content: rec.content,
      duration: rec.duration,
    };
    setStudyRecords([newRecord, ...studyRecords]);
  };

  const calculateDuration = (sleep: string, wake: string): number => {
    try {
      const [sh, sm] = sleep.split(":").map(Number);
      const [wh, wm] = wake.split(":").map(Number);
      let diff = (wh * 60 + wm) - (sh * 60 + sm);
      if (diff < 0) diff += 24 * 60;
      return Math.round((diff / 60) * 10) / 10;
    } catch {
      return 8;
    }
  };

  // Must-do list manager
  const handleAddNewTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;

    const formattedTime = newTaskTime.trim() ? newTaskTime.trim() : "⏰ 全天";
    const newTask: MustDoTask = {
      id: crypto.randomUUID(),
      period: newTaskPeriod,
      text: newTaskText.trim(),
      time: formattedTime,
      completed: false,
      createdAt: new Date().toISOString().split("T")[0],
    };

    setMustDoTasks([...mustDoTasks, newTask]);
    setNewTaskText("");
    setNewTaskTime("");
    
    // Auto jump back to Home view to let them view
    setActiveTab("home");
  };

  const handleToggleTask = (id: string) => {
    setMustDoTasks(
      mustDoTasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const handleDeleteTask = (id: string) => {
    setMustDoTasks(mustDoTasks.filter((t) => t.id !== id));
  };

  // Pre-seed some default accounts dynamically (Removed admin pre-seed to prevent abuse)
  useEffect(() => {
    const regUsersRaw = localStorage.getItem("min_registered_users");
    if (!regUsersRaw) {
      localStorage.setItem("min_registered_users", JSON.stringify([]));
    } else {
      // 过滤已经存在的本地 admin 账号，防止滥用
      try {
        const users = JSON.parse(regUsersRaw);
        if (Array.isArray(users)) {
          const filtered = users.filter((u: any) => u.username !== "admin");
          if (filtered.length !== users.length) {
            localStorage.setItem("min_registered_users", JSON.stringify(filtered));
          }
        }
      } catch (e) {}
    }
  }, []);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthSuccess("");

    if (!authUsername.trim() || !authPassword.trim()) {
      setAuthError("请完整输入账号和密码哦！");
      return;
    }

    const normalizedUser = authUsername.trim().toLowerCase();
    if (normalizedUser === "admin") {
      setAuthError("为防止滥用，admin 账号已被禁用。");
      return;
    }
    if (!/^[a-z0-9_]+$/.test(normalizedUser)) {
      setAuthError("账号登录名只能包含英文字母、数字和下划线哦！");
      return;
    }
    const workerUrl = workerApiUrl || "https://zilv.alunapi.top";

    if (workerUrl) {
      // ----------------- CLOUDFLARE WORKER CLOUD AUTH -----------------
      try {
        if (isLoginView) {
          const response = await fetch(`${workerUrl.replace(/\/$/, "")}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: normalizedUser, password: authPassword.trim() }),
          });

          if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || "登录失败，请检查账号密码。");
          }

          const data = await response.json();
          localStorage.setItem("min_cf_token", data.token);

          const newSession = {
            username: data.username,
            name: data.nickname || data.username,
            id: data.id,
            avatarUrl: DEFAULT_AVATARS[0],
            isLoggedIn: true,
            apiProvider: session.apiProvider || "SiliconFlow",
            apiKey: "",
          };
          setSession(newSession);

          // Auto-download cloud data backup immediately after login
          setAuthSuccess("🎉 云端登录成功！正在同步下载自律行囊...");
          try {
            const syncHeaders = {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${data.token}`
            };
            const downloadResp = await fetch(`${workerUrl.replace(/\/$/, "")}/api/sync/download`, {
              method: "GET",
              headers: syncHeaders
            });
            if (downloadResp.ok) {
              const cloudData = await downloadResp.json();
              if (cloudData.sleepRecords) setSleepRecords(cloudData.sleepRecords);
              if (cloudData.mealItems) setMealItems(cloudData.mealItems);
              if (cloudData.workoutRecords) setWorkoutRecords(cloudData.workoutRecords);
              if (cloudData.studyRecords) setStudyRecords(cloudData.studyRecords);
              if (cloudData.mustDoTasks) setMustDoTasks(cloudData.mustDoTasks);
              if (cloudData.waterRecords) setWaterRecords(cloudData.waterRecords);
              if (cloudData.weightRecords) setWeightRecords(cloudData.weightRecords);
            }
          } catch (syncErr) {
            console.error("同步失败:", syncErr);
          }

          setTimeout(() => {
            setAuthSuccess("");
            setActiveTab("home");
          }, 1000);

        } else {
          // Register in Cloud
          if (!authInviteCode.trim()) {
            setAuthError("注册必须要输入邀请激活码哦！");
            return;
          }

          const response = await fetch(`${workerUrl.replace(/\/$/, "")}/api/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              username: normalizedUser,
              password: authPassword.trim(),
              nickname: authNickname.trim() || normalizedUser,
              inviteCode: authInviteCode.trim()
            }),
          });

          if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || "注册失败，请检查邀请码或用户名。");
          }

          setAuthSuccess("✨ 修行账号云端创建成功！已帮您切换至登录卡片。");
          setIsLoginView(true);
          setAuthPassword("");
          setAuthInviteCode("");
        }
      } catch (err: any) {
        setAuthError(err.message || "无法连接至云端自律管家接口，请重试。");
      }
    } else {
      // ----------------- LOCAL OFFLINE AUTH (FALLBACK) -----------------
      const regUsersRaw = localStorage.getItem("min_registered_users") || "[]";
      const regUsers = JSON.parse(regUsersRaw);

      if (isLoginView) {
        const found = regUsers.find(
          (u: any) => u.username === normalizedUser && String(u.password) === authPassword.trim()
        );
        if (found) {
          setSession({
            username: found.username,
            name: found.nickname || found.username,
            id: found.id || `SLF-2026-${Math.floor(100 + Math.random() * 900)}`,
            avatarUrl: found.avatar || DEFAULT_AVATARS[0],
            isLoggedIn: true,
            apiProvider: found.apiProvider || "SiliconFlow",
            apiKey: found.apiKey || "",
          });

          if (found.sleepRecords) setSleepRecords(found.sleepRecords);
          if (found.mealItems) setMealItems(found.mealItems);
          if (found.workoutRecords) setWorkoutRecords(found.workoutRecords);
          if (found.studyRecords) setStudyRecords(found.studyRecords);
          if (found.mustDoTasks) setMustDoTasks(found.mustDoTasks);
          if (found.waterRecords) setWaterRecords(found.waterRecords);
          if (found.weightRecords) setWeightRecords(found.weightRecords);

          setAuthSuccess("🎉 登录验证成功！欢迎进入自律宇宙（本地单机模式）。");
          setTimeout(() => {
            setAuthSuccess("");
            setActiveTab("home");
          }, 1000);
        } else {
          setAuthError("账户名称或密码不匹配，请重试。");
        }
      } else {
        const exists = regUsers.some((u: any) => u.username === normalizedUser);
        if (exists) {
          setAuthError("该用户名已被注册登记，请更换账号名称！");
          return;
        }

        const generatedId = `SLF-2026-${Math.floor(100 + Math.random() * 900)}`;
        const newUser = {
          username: normalizedUser,
          password: authPassword.trim(),
          nickname: authNickname.trim() || normalizedUser,
          id: generatedId,
          avatar: DEFAULT_AVATARS[Math.floor(Math.random() * DEFAULT_AVATARS.length)],
          apiProvider: "SiliconFlow",
          apiKey: "",
          sleepRecords: [],
          mealItems: [],
          workoutRecords: [],
          studyRecords: [],
          mustDoTasks: [
            { id: "s1", period: "today", text: "今日早起拉伸并喝一杯温水", time: "07:00", completed: false, createdAt: new Date().toISOString().split("T")[0] },
            { id: "s2", period: "week", text: "建立自己的长效早起作息方案", time: "🧭 必看", completed: false, createdAt: new Date().toISOString().split("T")[0] }
          ],
        };

        regUsers.push(newUser);
        localStorage.setItem("min_registered_users", JSON.stringify(regUsers));
        setAuthSuccess("✨ 本地账号创建成功！已自动帮您切换至登录卡片。");
        setIsLoginView(true);
        setAuthPassword("");
      }
    }
  };

  // Logouts & clearing session values
  const handleLogout = () => {
    if (session.isLoggedIn) {
      const regUsersRaw = localStorage.getItem("min_registered_users") || "[]";
      const regUsers = JSON.parse(regUsersRaw);
      const updatedUsers = regUsers.map((u: any) => {
        if (u.username === session.username) {
          return {
            ...u,
            nickname: session.name,
            avatar: session.avatarUrl,
            apiProvider: session.apiProvider,
            apiKey: session.apiKey,
            sleepRecords,
            mealItems,
            workoutRecords,
            studyRecords,
            mustDoTasks,
            waterRecords,
            weightRecords,
          };
        }
        return u;
      });
      localStorage.setItem("min_registered_users", JSON.stringify(updatedUsers));
    }

    localStorage.removeItem("min_cf_token");
    setSession({
      username: "Guest",
      name: "自律修行旅客",
      id: "SLF-2026-X88",
      avatarUrl: DEFAULT_AVATARS[0],
      isLoggedIn: false,
      apiProvider: "SiliconFlow",
      apiKey: "",
    });

    setSleepRecords([]);
    setMealItems([]);
    setWorkoutRecords([]);
    setStudyRecords([]);
    setWaterRecords([]);
    setWeightRecords([]);
    setDietAdvice(null);
    setWorkoutPlan(null);
    setSkillChallenge(null);
    setLearningPath(null);
    setActiveTab("home");
  };

  // Profile Save
  const handleSettingsSave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("min_worker_api_url", workerApiUrl.trim());
    const updated = {
      ...session,
      name: settingsName,
      avatarUrl: settingsAvatar,
      apiProvider: settingsProvider,
      apiKey: settingsKey,
    };
    setSession(updated);

    const regUsersRaw = localStorage.getItem("min_registered_users") || "[]";
    const regUsers = JSON.parse(regUsersRaw);
    const updatedUsers = regUsers.map((u: any) => {
      if (u.username === session.username) {
        return {
          ...u,
          nickname: settingsName,
          avatar: settingsAvatar,
          apiProvider: settingsProvider,
          apiKey: settingsKey,
          sleepRecords,
          mealItems,
          workoutRecords,
          studyRecords,
          mustDoTasks,
          waterRecords,
          weightRecords,
        };
      }
      return u;
    });
    localStorage.setItem("min_registered_users", JSON.stringify(updatedUsers));

    // Upload latest settings & profiles to Cloud Server if under Cloud mode
    const token = localStorage.getItem("min_cf_token") || "";
    if (token && workerApiUrl) {
      const minBackup = {
        sleepRecords,
        mealItems,
        workoutRecords,
        studyRecords,
        mustDoTasks,
        waterRecords,
        weightRecords,
      };
      fetch(`${workerApiUrl.replace(/\/$/, "")}/api/sync/upload`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(minBackup)
      }).catch(err => console.error("Auto upload settings sync error:", err));
    }

    setSyncStatus("✅ 个人轮廓和 API 配置已成功在本地和注册库同步更新！");
    setTimeout(() => setSyncStatus(null), 2500);
  };

  // Backup Import & Export handlers
  const handleExportJSON = () => {
    const minBackup = {
      version: "1.3.0",
      exportTime: new Date().toISOString(),
      user: session,
      data: {
        sleepRecords,
        mealItems,
        workoutRecords,
        studyRecords,
        mustDoTasks,
        waterRecords,
        weightRecords,
      }
    };
    const blob = new Blob([JSON.stringify(minBackup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `slf_self_discipline_backup_${session.name}_${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.data) {
          if (parsed.data.sleepRecords) setSleepRecords(parsed.data.sleepRecords);
          if (parsed.data.mealItems) setMealItems(parsed.data.mealItems);
          if (parsed.data.workoutRecords) setWorkoutRecords(parsed.data.workoutRecords);
          if (parsed.data.studyRecords) setStudyRecords(parsed.data.studyRecords);
          if (parsed.data.mustDoTasks) setMustDoTasks(parsed.data.mustDoTasks);
          if (parsed.data.waterRecords) setWaterRecords(parsed.data.waterRecords);
          if (parsed.data.weightRecords) setWeightRecords(parsed.data.weightRecords);
          if (parsed.user) {
            setSession({
              ...parsed.user,
              isLoggedIn: session.isLoggedIn, // preserve session token
            });
          }
          alert("🎉 备份数据载入成功！您的指标、必做清单以及打卡印记均已整合对齐。");
        } else {
          throw new Error("格式无效");
        }
      } catch {
        alert("导入解析失败。请提供系统所生成的标准 JSON 备份文件。");
      }
    };
    reader.readAsText(file);
  };

  // Sync animation simulation
  const handleCloudSync = async (silent = false) => {
    const workerUrl = workerApiUrl || "https://zilv.alunapi.top";
    
    if (!silent) {
      setIsSyncing(true);
      setSyncStatus("正在合流云端自律行囊...");
    }
    
    try {
      const minBackup = {
        sleepRecords,
        mealItems,
        workoutRecords,
        studyRecords,
        mustDoTasks,
        waterRecords,
        weightRecords,
      };
      
      const token = localStorage.getItem("min_cf_token") || "";
      const headers = {
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Bearer ${token}` } : {})
      };
      
      // 1. Upload local data
      const uploadResp = await fetch(`${workerUrl.replace(/\/$/, "")}/api/sync/upload`, {
        method: "POST",
        headers,
        body: JSON.stringify(minBackup)
      });
      
      if (!uploadResp.ok) {
        throw new Error("云端数据上传失败");
      }
      
      // 2. Download cloud data
      const downloadResp = await fetch(`${workerUrl.replace(/\/$/, "")}/api/sync/download`, {
        method: "GET",
        headers
      });
      
      if (downloadResp.ok) {
        const cloudData = await downloadResp.json();
        
        // 标记为跳过，防止更新 State 触发多余的重复上传
        skipAutoUpload.current = true;
        
        if (cloudData.sleepRecords) setSleepRecords(cloudData.sleepRecords);
        if (cloudData.mealItems) setMealItems(cloudData.mealItems);
        if (cloudData.workoutRecords) setWorkoutRecords(cloudData.workoutRecords);
        if (cloudData.studyRecords) setStudyRecords(cloudData.studyRecords);
        if (cloudData.mustDoTasks) setMustDoTasks(cloudData.mustDoTasks);
        if (cloudData.waterRecords) setWaterRecords(cloudData.waterRecords);
        if (cloudData.weightRecords) setWeightRecords(cloudData.weightRecords);
        
        setTimeout(() => {
          skipAutoUpload.current = false;
        }, 150);
      }
      
      if (!silent) {
        setSyncStatus("🌟 同步合流成功！已拉取最新云端打卡印记并本地合并。");
      }
    } catch (err: any) {
      console.error(err);
      if (!silent) {
        setSyncStatus(`❌ 同步失败: ${err.message || "无法连接云端"}`);
      }
    } finally {
      if (!silent) {
        setIsSyncing(false);
        setTimeout(() => setSyncStatus(null), 3500);
      }
    }
  };

  // Helper values
  const getTodayCheckIns = () => {
    const todayStr = new Date().toISOString().split("T")[0];
    const sleeps = sleepRecords.filter((s) => s.date === todayStr);
    const meals = mealItems.filter((m) => m.date === todayStr);
    const workouts = workoutRecords.filter((w) => w.date === todayStr);
    const studies = studyRecords.filter((st) => st.date === todayStr);
    const waters = waterRecords.filter((w) => w.date === todayStr);
    const weights = weightRecords.filter((w) => w.date === todayStr);

    return {
      sleeps,
      meals,
      workouts,
      studies,
      waters,
      weights,
      totalCount: sleeps.length + meals.length + workouts.length + studies.length + waters.length + weights.length,
    };
  };

  const activeCheckIns = getTodayCheckIns();
  const todayStr = new Date().toISOString().split("T")[0];
  const totalIncomplete = mustDoTasks.filter((t) => !t.completed).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans select-none antialiased">
      
      {/* 1. STANDALONE LOGIN/REGISTER PAGE */}
      {!session.isLoggedIn ? (
        <div className="flex-1 flex items-center justify-center p-4 min-h-screen bg-slate-100 select-none">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden p-8 space-y-6">
            
            {/* Header info */}
            <div className="text-center space-y-2">
              <div className="mx-auto h-12 w-12 rounded-2xl bg-slate-950 text-emerald-400 flex items-center justify-center text-2xl font-black shadow-md">
                🏆
              </div>
              <div>
                <h1 className="text-lg font-black tracking-tight text-slate-900">自律修行管家</h1>
                <p className="text-xs text-slate-400 font-medium">请先登录或注册您的修行账号以访问自律数据</p>
              </div>
            </div>

            {/* Cloud Config Accordion */}
            <div className="border border-slate-200 rounded-2xl p-3 bg-slate-50/50 space-y-2 text-left">
              <div className="flex items-center justify-between">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1">
                  <span>☁️ Cloudflare Worker 服务接口</span>
                </label>
                <span className="text-[9px] text-emerald-650 font-extrabold bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-full">
                  {workerApiUrl ? "云端模式" : "单机模式"}
                </span>
              </div>
              <input
                type="text"
                placeholder="https://your-worker.workers.dev (可选)"
                value={workerApiUrl}
                onChange={(e) => {
                  const val = e.target.value;
                  setWorkerApiUrl(val);
                  localStorage.setItem("min_worker_api_url", val.trim());
                }}
                className="w-full text-[11px] border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-slate-500 bg-white font-mono"
              />
              <p className="text-[8.5px] text-slate-400">若配置了云端接口，注册登录与打卡同步均自动走云端 KV 验证。</p>
            </div>

            {/* Form */}
            <form onSubmit={handleAuthSubmit} className="space-y-4 text-left">
              <div className="space-y-1">
                <label className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                  账号登录名 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="请输入您的英文账号（如 alun）"
                  value={authUsername}
                  onChange={(e) => setAuthUsername(e.target.value)}
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                  className="w-full text-xs border border-slate-205 rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-slate-500 bg-slate-50 font-medium text-slate-800"
                />
              </div>

              {!isLoginView && (
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                    自律修行昵称
                  </label>
                  <input
                    type="text"
                    placeholder="例如: 每日拉伸星人"
                    value={authNickname}
                    onChange={(e) => setAuthNickname(e.target.value)}
                    className="w-full text-xs border border-slate-205 rounded-xl p-3 focus:outline-none bg-slate-50 font-medium text-slate-800"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                  密码 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="请输入访问密码"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="w-full text-xs border border-slate-205 rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-slate-500 bg-slate-50 font-semibold"
                />
              </div>

              {!isLoginView && workerApiUrl && (
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                    激活邀请码 <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="请输入专属注册激活邀请码"
                    value={authInviteCode}
                    onChange={(e) => setAuthInviteCode(e.target.value)}
                    className="w-full text-xs border border-slate-205 rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-slate-500 bg-slate-50 font-bold text-slate-800"
                  />
                </div>
              )}

              {authError && (
                <p className="text-[10px] text-rose-500 font-bold text-center bg-rose-50 p-2 rounded-lg leading-relaxed">
                  {authError}
                </p>
              )}
              {authSuccess && (
                <p className="text-[10.5px] text-emerald-800 bg-emerald-50 border border-emerald-100 p-2.5 rounded-xl font-bold text-center">
                  {authSuccess}
                </p>
              )}

              <button
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-950 text-white font-black py-3 rounded-xl tracking-wider text-xs transition-transform active:scale-99 cursor-pointer shadow-md"
              >
                {isLoginView ? "立刻登录" : "立即注册"}
              </button>
            </form>

            <div className="border-t border-slate-100 pt-4 flex flex-col items-center justify-between text-[11px] text-slate-500 space-y-2">
              <button
                type="button"
                onClick={() => {
                  setIsLoginView(!isLoginView);
                  setAuthError("");
                  setAuthSuccess("");
                }}
                className="text-slate-800 font-extrabold hover:underline cursor-pointer"
              >
                {isLoginView ? "🆕 还没有账号？点击创建新账号" : "👈 已经有账号？返回直接登录"}
              </button>
              

            </div>

          </div>
        </div>
      ) : (
        
        /* 2. LOGGED-IN MAIN TAB INTERFACE */
        <>
          {/* Main Top Header */}
          <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-4 py-3 shadow-xs shrink-0 select-none">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              
              <div className="flex items-center gap-2.5">
                <img
                  src={session.avatarUrl}
                  alt="Profile"
                  className="h-9 w-9 rounded-full object-cover border-2 border-slate-800"
                />
                <div>
                  <h1 className="text-xs font-black tracking-tight text-slate-900 flex items-center gap-1.5 leading-none">
                    <span>{session.name} 的修行旅程</span>
                    <span className="text-[8px] bg-emerald-50 text-emerald-700 border border-emerald-100 font-extrabold px-1.5 py-0.5 rounded-full uppercase scale-95 select-none">
                      已登
                    </span>
                  </h1>
                  <span className="text-[9.5px] text-slate-400 font-bold font-mono">
                    ID: {session.id}
                  </span>
                </div>
              </div>

              {/* Quotes */}
              <div className="hidden md:block max-w-sm">
                <p className="text-[10px] text-slate-400 italic text-right truncate">
                  “ {motto} ”
                </p>
              </div>

              <div className="flex items-center gap-1.5 select-none">
                <button
                  onClick={handleCloudSync}
                  className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl cursor-pointer"
                  title="云同步打卡"
                >
                  <RefreshCw size={15} />
                </button>
                <button
                  onClick={handleLogout}
                  className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl cursor-pointer flex items-center gap-1 text-[11px] font-bold"
                  title="退出登录"
                >
                  <LogOut size={14} />
                  <span className="hidden sm:inline">退出</span>
                </button>
              </div>

            </div>
          </header>

          {/* Core Body Container per Tab */}
          <main className="flex-1 overflow-y-auto px-4 py-6 pb-24 text-slate-800">
            <div className="max-w-xl mx-auto">
              
              <AnimatePresence mode="wait">
                
                {/* ==================== TAB 1: 主页 ==================== */}
                {activeTab === "home" && (
                  <motion.div
                    key="home"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.1 }}
                    className="space-y-6"
                  >
                    
                    {/* 1. SINGLE LINE SCROLLING DEED TICKER */}
                    <div className="bg-slate-900 text-slate-205 border border-slate-850 rounded-2xl p-2 px-3 shadow-md flex items-center gap-2.5 overflow-hidden select-none relative h-9 shrink-0">
                      <div className="flex items-center gap-1.5 font-black text-[10px] text-emerald-400 shrink-0 tracking-wider">
                        <ListTodo size={11} className="stroke-[3]" />
                        <span>必做誓愿</span>
                      </div>
                      <div className="h-3 w-[1px] bg-slate-800 shrink-0" />
                      <div className="flex-1 overflow-hidden relative h-full flex items-center text-[11px]">
                        {/* Inline CSS style for infinite marquee */}
                        <style>{`
                          @keyframes marquee_loop {
                            0% { transform: translateX(0); }
                            100% { transform: translateX(-50%); }
                          }
                          .marquee-content {
                            display: flex;
                            align-items: center;
                            gap: 2.5rem;
                            animation: marquee_loop 28s linear infinite;
                            white-space: nowrap;
                          }
                          .marquee-content:hover {
                            animation-play-state: paused;
                          }
                        `}</style>
                        <div className="marquee-content">
                          {mustDoTasks.filter(t => !t.completed).length === 0 ? (
                            <>
                              <span className="text-slate-400 font-medium">✨ 今日已万虑皆清！点击下方“一键打卡”按钮记录最新修行足迹吧 ~</span>
                              <span className="text-slate-400 font-medium">✨ 今日已万虑皆清！点击下方“一键打卡”按钮记录最新修行足迹吧 ~</span>
                            </>
                          ) : (
                            (() => {
                              const list = mustDoTasks.filter(t => !t.completed);
                              const tickerString = list.map(t => `✦ [${t.period === "today" ? "今日" : t.period === "week" ? "每周" : "每月"}] ${t.text} (${t.time || "⏰ 全天"})`).join("      |      ");
                              return (
                                <>
                                  <span className="font-semibold tracking-normal text-emerald-300">{tickerString}</span>
                                  <span className="font-semibold tracking-normal text-emerald-300">{tickerString}</span>
                                </>
                              );
                            })()
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 1.5. 🔥 狂热火花对赌对战卡片 */}
                    <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-900/40 rounded-3xl p-6 shadow-xl relative overflow-hidden text-white">
                      {/* 背景星光粒子装饰 */}
                      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                      <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
                      
                      <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5 relative z-10">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl animate-pulse">🔥</span>
                          <div>
                            <h3 className="text-sm font-black tracking-tight text-white flex items-center gap-1.5">
                              自律火花对赌对战
                            </h3>
                            <p className="text-[10px] text-indigo-200 font-medium">与好友相互绑定，用保证金和魔鬼难度鞭策彼此成长</p>
                          </div>
                        </div>
                        {wagerLoading && (
                          <RefreshCw className="animate-spin text-indigo-400" size={16} />
                        )}
                      </div>

                      {wagerError && (
                        <div className="mb-4 p-3 bg-rose-500/20 border border-rose-500/30 rounded-xl text-xs text-rose-200 font-semibold">
                          ⚠️ {wagerError}
                        </div>
                      )}

                      {!session.isLoggedIn ? (
                        <div className="text-center py-6 relative z-10">
                          <p className="text-xs text-slate-300 font-medium mb-3">您当前处于离线游客状态。请先去“修行阁”登录，即可体验云端对赌绑定功能！</p>
                        </div>
                      ) : !bindingInfo ? (
                        // ================= 未绑定对赌状态 =================
                        <div className="space-y-6 relative z-10">
                          {/* 1. 发送邀请 Form */}
                          <form onSubmit={handleSendWagerInvite} className="space-y-4">
                            <h4 className="text-xs font-black text-indigo-300 flex items-center gap-1">
                              <span>✉️ 发起新的对赌誓愿邀请</span>
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[10px] text-slate-400 font-bold mb-1">对方用户名 (注册账号)</label>
                                <input
                                  type="text"
                                  placeholder="请输入好友的用户名"
                                  value={inviteFriendUsername}
                                  onChange={(e) => setInviteFriendUsername(e.target.value)}
                                  className="w-full bg-slate-800/80 border border-slate-700/50 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] text-slate-400 font-bold mb-1">对赌誓愿目标</label>
                                <input
                                  type="text"
                                  placeholder="例如：每天7点前起床、每天记单词"
                                  value={inviteWagerTarget}
                                  onChange={(e) => setInviteWagerTarget(e.target.value)}
                                  className="w-full bg-slate-800/80 border border-slate-700/50 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[10px] text-slate-400 font-bold mb-1">对赌期限</label>
                                <select
                                  value={inviteWagerDuration}
                                  onChange={(e) => setInviteWagerDuration(e.target.value)}
                                  className="w-full bg-slate-800/80 border border-slate-700/50 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                >
                                  <option value="week">一周挑战 (7天)</option>
                                  <option value="month">一个月挑战 (30天)</option>
                                  <option value="halfYear">半年磨砺 (180天)</option>
                                  <option value="year">一年涅槃 (365天)</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-[10px] text-slate-400 font-bold mb-1">保证金金额</label>
                                <select
                                  value={inviteWagerDeposit}
                                  onChange={(e) => setInviteWagerDeposit(e.target.value)}
                                  className="w-full bg-slate-800/80 border border-slate-700/50 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                >
                                  <option value="10">¥10.00</option>
                                  <option value="20">¥20.00</option>
                                  <option value="50">¥50.00</option>
                                  <option value="100">¥100.00</option>
                                  <option value="200">¥200.00</option>
                                </select>
                              </div>
                            </div>

                            <button
                              type="submit"
                              disabled={wagerLoading}
                              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-black text-xs py-2.5 rounded-xl transition-all active:scale-98 shadow-lg shadow-indigo-900/30 cursor-pointer"
                            >
                              {wagerLoading ? "正在寄送信鸽..." : "🔥 寄出对赌挑战书"}
                            </button>
                          </form>

                          {/* 2. 待处理的邀请 */}
                          {bondingInvites.length > 0 && (
                            <div className="border-t border-white/10 pt-4 space-y-3">
                              <h4 className="text-xs font-black text-emerald-400 flex items-center gap-1.5">
                                <span>📥 收到的对赌绑定挑战信 ({bondingInvites.length})</span>
                              </h4>
                              <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                                {bondingInvites.map((invite) => (
                                  <div key={invite.id} className="bg-white/5 border border-white/10 p-3 rounded-xl flex items-center justify-between gap-4">
                                    <div className="space-y-1">
                                      <p className="text-xs font-bold text-white">
                                        来自 <span className="text-indigo-300 font-extrabold">{invite.from}</span> 的誓约
                                      </p>
                                      <p className="text-[11px] text-slate-300 font-medium">目标：{invite.target}</p>
                                      <p className="text-[10px] text-slate-400 font-semibold">
                                        期限：{invite.duration === "week" ? "1周" : invite.duration === "month" ? "1个月" : invite.duration === "halfYear" ? "半年" : "1年"} | 保证金：<span className="text-emerald-400 font-bold">¥{invite.deposit.toFixed(2)}</span>
                                      </p>
                                    </div>
                                    <div className="flex gap-2 shrink-0">
                                      <button
                                        onClick={() => handleAcceptWagerInvite(invite.id)}
                                        disabled={wagerLoading}
                                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[10px] px-3 py-1.5 rounded-lg transition-all active:scale-95 cursor-pointer"
                                      >
                                        迎战
                                      </button>
                                      <button
                                        onClick={() => handleRejectWagerInvite(invite.id)}
                                        disabled={wagerLoading}
                                        className="bg-white/10 hover:bg-white/20 text-slate-300 font-extrabold text-[10px] px-3 py-1.5 rounded-lg transition-all active:scale-95 cursor-pointer"
                                      >
                                        婉拒
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        // ================= 已绑定对赌状态 =================
                        <div className="space-y-5 relative z-10">
                          {/* 对赌概览头 */}
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white/5 border border-white/10 p-3 rounded-xl">
                            <div>
                              <p className="text-xs text-slate-300">
                                对赌伙伴：
                                <span className="font-extrabold text-white text-xs pl-1">
                                  {bindingInfo.userANickname} (我) 🤝 {bindingInfo.userBNickname} (好友)
                                </span>
                              </p>
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                誓愿目标：<span className="text-indigo-200 font-semibold">{bindingInfo.target}</span>
                              </p>
                            </div>
                            <span className="text-[10px] bg-indigo-900/60 text-indigo-200 font-bold px-2 py-0.5 rounded border border-indigo-800">
                              期限：{bindingInfo.duration === "week" ? "1周" : bindingInfo.duration === "month" ? "1个月" : bindingInfo.duration === "halfYear" ? "半年" : "1年"} ({bindingInfo.totalDays}天)
                            </span>
                          </div>

                          {/* 火花与保证金醒目看板 */}
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gradient-to-br from-orange-500/10 to-rose-500/10 border border-orange-500/20 rounded-2xl p-4 text-center">
                              <span className="text-[10px] text-orange-300 font-black tracking-wider uppercase block mb-1">🔥 狂热火花天数</span>
                              <div className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-400 to-rose-500 tracking-tighter select-none py-1">
                                {bindingInfo.streakDays}
                                <span className="text-xs font-bold text-orange-300 ml-1">天</span>
                              </div>
                            </div>

                            <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-2xl p-4 text-center">
                              <span className="text-[10px] text-emerald-300 font-black tracking-wider uppercase block mb-1">💰 剩余保证金</span>
                              <div className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight py-2">
                                ¥{Number(bindingInfo.depositRemaining).toFixed(2)}
                                <span className="text-[10px] font-bold text-slate-400 block sm:inline sm:ml-1">
                                  / ¥{Number(bindingInfo.depositTotal).toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* 打卡指示器 */}
                          <div className="bg-white/5 border border-white/10 p-3.5 rounded-xl space-y-2.5">
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">今日打卡动态监控</p>
                            <div className="flex items-center justify-around">
                              <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${bindingInfo.todayCheckedInA ? "bg-emerald-500 animate-pulse" : "bg-slate-600"}`} />
                                <span className="text-xs font-bold">{bindingInfo.userANickname} (我)</span>
                                <span className="text-[10px] text-slate-450 font-bold">
                                  ({bindingInfo.todayCheckedInA ? "已完成" : "未完成"})
                                </span>
                              </div>
                              <div className="w-[1px] h-6 bg-white/10" />
                              <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${bindingInfo.todayCheckedInB ? "bg-emerald-500 animate-pulse" : "bg-slate-600"}`} />
                                <span className="text-xs font-bold">{bindingInfo.userBNickname}</span>
                                <span className="text-[10px] text-slate-455 font-bold">
                                  ({bindingInfo.todayCheckedInB ? "已完成" : "未完成"})
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* 狂暴自愈挑战逻辑 */}
                          {bindingInfo.streakDays === 0 && bindingInfo.missedDaysCount > 0 && bindingInfo.rageModeRemainingDays === 0 && (
                            <div className="bg-rose-950/40 border border-rose-900/60 p-4 rounded-2xl space-y-3">
                              <div className="flex gap-2">
                                <span className="text-lg">🚨</span>
                                <div className="space-y-0.5">
                                  <h4 className="text-xs font-black text-rose-300">警报：火花熄灭，保证金正在流失！</h4>
                                  <p className="text-[10.5px] text-slate-300 leading-relaxed">
                                    你们已经有 <span className="text-rose-400 font-black">{bindingInfo.missedDaysCount}</span> 天没有达成同频打卡了！今日已按天数比例扣除保证金。
                                    如果想要挽救，可以申请开启 <b>AI 狂暴魔鬼恢复挑战</b> —— 接下来 <b>{bindingInfo.missedDaysCount * 7} 天内全勤打卡</b>，通关后即可返还在此次中断期间所有被扣除的保证金！
                                  </p>
                                </div>
                              </div>
                              <button
                                onClick={handleActivateRageMode}
                                disabled={wagerLoading}
                                className="w-full bg-rose-600 hover:bg-rose-500 disabled:bg-rose-800 text-white font-black text-xs py-2 rounded-xl transition-all active:scale-98 shadow-md cursor-pointer"
                              >
                                🔥 申请 AI 狂暴魔鬼模式 ({bindingInfo.missedDaysCount * 7}天全勤挑战)
                              </button>
                            </div>
                          )}

                          {bindingInfo.rageModeRemainingDays > 0 && (
                            <div className="bg-amber-950/40 border border-amber-900/60 p-4 rounded-2xl space-y-3">
                              <div className="flex gap-2">
                                <span className="text-lg">👹</span>
                                <div className="space-y-0.5">
                                  <h4 className="text-xs font-black text-amber-300 flex items-center gap-1.5 animate-pulse">
                                    <span>AI 狂暴自律挑战火热行进中！</span>
                                  </h4>
                                  <p className="text-[10.5px] text-slate-300 leading-relaxed">
                                    当前 AI 任务难度已经<b>狂暴提升 1.2 倍</b>，字里行间化身严苛魔鬼教练！
                                    挑战目标天数：<b>{bindingInfo.rageModeTargetDays} 天全勤</b>，剩余 <b>{bindingInfo.rageModeRemainingDays} 天</b>。
                                    <span className="text-rose-300 font-semibold block mt-1">⚠️ 警示：任何一天未按时打卡，魔鬼挑战天数将再次被自动延长 7 天！</span>
                                  </p>
                                </div>
                              </div>
                              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                                <div
                                  className="bg-amber-500 h-full transition-all duration-500"
                                  style={{
                                    width: `${((bindingInfo.rageModeTargetDays - bindingInfo.rageModeRemainingDays) / bindingInfo.rageModeTargetDays) * 100}%`
                                  }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* 2. BIG PROMINENT CIRCULAR CHECK-IN BUTTON IN THE MIDDLE */}
                    <div className="flex flex-col items-center justify-center py-12 select-none bg-radial from-slate-100 to-slate-200/20 rounded-3xl border border-slate-200 p-8 min-h-[320px] shadow-sm">
                      
                      <div className="text-center space-y-1 mb-8">
                        <span className="text-[10px] bg-slate-900 border border-slate-850 text-emerald-400 font-extrabold tracking-widest px-3 py-1 rounded-full uppercase shadow-xs">
                          ⚡ 快捷自律打卡大厅
                        </span>
                        <h3 className="text-sm font-black text-slate-800 tracking-tight pt-1">点击正中印章 · 立证每日清修</h3>
                      </div>

                      {/* Giant pristine interactive circle */}
                      <div className="relative">
                        {/* Ripple pulses */}
                        <div className="absolute inset-0 bg-slate-900/10 rounded-full animate-ping pointer-events-none scale-110" />
                        <div className="absolute -inset-6 bg-emerald-500/5 rounded-full animate-pulse pointer-events-none" />

                        <button
                          onClick={() => setIsCheckInOpen(true)}
                          className="h-36 w-36 rounded-full bg-slate-900 hover:bg-slate-950 text-white font-black flex flex-col items-center justify-center transition-all shadow-2xl hover:scale-105 active:scale-95 cursor-pointer border-4 border-white relative z-10"
                        >
                          <span className="text-3xl animate-bounce">⚡</span>
                          <span className="text-xs font-black tracking-widest mt-1.5 select-none">
                            一键打卡
                          </span>
                        </button>
                      </div>

                      <p className="text-[10.5px] text-slate-450 font-bold tracking-tight mt-8 text-center leading-relaxed">
                        支持：作息起居 🛌 · 膳食备注 🍎 · 运动汗水 🏋️ · 深度专注 📖
                      </p>
                    </div>

                    {/* TODAY'S TIMELINE STREAM */}
                    <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-5">
                      
                      <div className="border-b border-slate-100 pb-2.5 flex items-center justify-between">
                        <h3 className="text-xs font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                          <span>📊 今日修行流水账</span>
                          <span className="text-[9.5px] font-semibold text-slate-400">({new Date().toISOString().split("T")[0]})</span>
                        </h3>
                        <span className="text-[9.5px] font-bold text-slate-500 bg-slate-50 border px-2 py-0.5 rounded">
                          今日累积打卡: {activeCheckIns.totalCount}次
                        </span>
                      </div>

                      {activeCheckIns.totalCount === 0 ? (
                        <div className="py-12 border border-dashed border-slate-150 rounded-xl text-center space-y-1">
                          <Clock size={18} className="mx-auto text-slate-300" />
                          <p className="text-xs text-slate-500 font-bold">今天还没有创建任何打卡印记哦</p>
                          <p className="text-[10px] text-slate-450">点击大圆按钮，登记您今天的首个自律足迹吧！</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          
                          {/* Sleeps */}
                          {activeCheckIns.sleeps.map((record) => (
                            <div key={record.id} className="flex gap-3 bg-slate-50/70 border border-slate-200 p-3 rounded-xl justify-between group">
                              <div className="flex items-start gap-2.5">
                                <div className="bg-slate-900 p-1.5 text-white rounded-lg shrink-0 mt-0.5">
                                  <Moon size={12} />
                                </div>
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-slate-805 text-xs">🛌 作息数据打卡</span>
                                    <span className="text-[9px] bg-slate-200 text-slate-700 px-1 rounded font-bold font-mono">
                                      {record.duration}小时
                                    </span>
                                  </div>
                                  <p className="text-slate-600 font-semibold text-xs py-0.5">
                                    {record.sleepTime} 入睡 &rarr; {record.wakeTime} 晨醒
                                  </p>
                                  {record.note && <p className="text-[10px] text-slate-400 italic">“ {record.note} ”</p>}
                                </div>
                              </div>

                              <div className="flex flex-col items-end justify-between shrink-0">
                                <button
                                  onClick={() => setSleepRecords(sleepRecords.filter(r => r.id !== record.id))}
                                  className="text-[10px] text-slate-300 hover:text-rose-500 transition-colors cursor-pointer"
                                >
                                  删除
                                </button>
                                <div className="flex gap-0.5 text-amber-500 font-bold">
                                  {Array.from({ length: record.quality }).map((_, i) => (
                                    <Star key={i} size={8} className="fill-current" />
                                  ))}
                                </div>
                              </div>
                            </div>
                          ))}

                          {/* Meals */}
                          {activeCheckIns.meals.map((record) => (
                            <div key={record.id} className="flex gap-3 bg-slate-50/70 border border-slate-200 p-3 rounded-xl justify-between group">
                              <div className="flex items-start gap-2.5">
                                <div className="bg-emerald-600 p-1.5 text-white rounded-lg shrink-0 mt-0.5">
                                  <Utensils size={12} />
                                </div>
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-slate-805 text-xs">🍎 饮食营养打卡</span>
                                    <span className="text-[9px] bg-emerald-105 text-emerald-800 px-1.5 rounded font-extrabold uppercase">
                                      {record.period}
                                    </span>
                                  </div>
                                  <p className="text-slate-800 font-bold text-xs pt-1 leading-snug">{record.text}</p>
                                  {record.note && (
                                    <p className="text-[10px] text-slate-450 italic mt-0.5 bg-white border border-slate-100 p-1 px-2 rounded">
                                      备注: {record.note}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <span className="shrink-0">
                                <button
                                  onClick={() => setMealItems(mealItems.filter(m => m.id !== record.id))}
                                  className="text-[10px] text-slate-300 hover:text-rose-500 transition-colors cursor-pointer"
                                >
                                  删除
                                </button>
                              </span>
                            </div>
                          ))}

                          {/* Workouts */}
                          {activeCheckIns.workouts.map((record) => (
                            <div key={record.id} className="flex gap-3 bg-slate-50/70 border border-slate-200 p-3 rounded-xl justify-between group">
                              <div className="flex items-start gap-2.5">
                                <div className="bg-orange-500 p-1.5 text-white rounded-lg shrink-0 mt-0.5">
                                  <Dumbbell size={12} />
                                </div>
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-slate-805 text-xs">🏋️ 运动汗水打卡</span>
                                    <span className="text-[9px] bg-orange-100 text-orange-850 px-1.5 rounded font-bold font-mono">
                                      {record.duration}分钟
                                    </span>
                                  </div>
                                  <p className="text-slate-700 font-bold text-xs">{record.type}</p>
                                  <span className="text-[9px] text-slate-400 font-semibold font-mono">
                                    能量狂飙 ~ {record.calories} kcal
                                  </span>
                                </div>
                              </div>

                              <span className="shrink-0">
                                <button
                                  onClick={() => setWorkoutRecords(workoutRecords.filter(w => w.id !== record.id))}
                                  className="text-[10px] text-slate-300 hover:text-rose-500 transition-colors cursor-pointer"
                                >
                                  删除
                                </button>
                              </span>
                            </div>
                          ))}

                          {/* Study */}
                          {activeCheckIns.studies.map((record) => (
                            <div key={record.id} className="flex gap-3 bg-slate-50/70 border border-slate-200 p-3 rounded-xl justify-between group">
                              <div className="flex items-start gap-2.5">
                                <div className="bg-blue-600 p-1.5 text-white rounded-lg shrink-0 mt-0.5">
                                  <BookOpen size={12} />
                                </div>
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-slate-805 text-xs">📖 终身学习打卡</span>
                                    <span className="text-[9px] bg-blue-100 text-blue-800 px-1.5 rounded font-bold font-mono">
                                      专注 {record.duration}分钟
                                    </span>
                                  </div>
                                  <p className="text-slate-700 font-bold text-xs leading-snug">{record.content}</p>
                                </div>
                              </div>

                              <span className="shrink-0">
                                <button
                                  onClick={() => setStudyRecords(studyRecords.filter(s => s.id !== record.id))}
                                  className="text-[10px] text-slate-300 hover:text-rose-500 transition-colors cursor-pointer"
                                >
                                  删除
                                </button>
                              </span>
                            </div>
                          ))}

                          {/* Waters */}
                          {activeCheckIns.waters.map((record) => (
                            <div key={record.id} className="flex gap-3 bg-slate-50/70 border border-slate-200 p-3 rounded-xl justify-between group">
                              <div className="flex items-start gap-2.5">
                                <div className="bg-sky-500 p-1.5 text-white rounded-lg shrink-0 mt-0.5">
                                  <Droplet size={12} />
                                </div>
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-slate-850 text-xs">🥛 补水喝水打卡</span>
                                    <span className="text-[9px] bg-sky-100 text-sky-850 px-1.5 rounded font-bold font-mono">
                                      {record.amount} ml
                                    </span>
                                  </div>
                                  <p className="text-slate-450 font-semibold text-[10px] pt-0.5">
                                    记录时间：{record.time}
                                  </p>
                                </div>
                              </div>

                              <span className="shrink-0">
                                <button
                                  onClick={() => setWaterRecords(waterRecords.filter(w => w.id !== record.id))}
                                  className="text-[10px] text-slate-300 hover:text-rose-500 transition-colors cursor-pointer"
                                >
                                  删除
                                </button>
                              </span>
                            </div>
                          ))}

                          {/* Weights */}
                          {activeCheckIns.weights.map((record) => (
                            <div key={record.id} className="flex gap-3 bg-slate-50/70 border border-slate-200 p-3 rounded-xl justify-between group">
                              <div className="flex items-start gap-2.5">
                                <div className="bg-amber-500 p-1.5 text-white rounded-lg shrink-0 mt-0.5">
                                  <Scale size={12} />
                                </div>
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-slate-850 text-xs">⚖️ 体重记录</span>
                                    <span className="text-[9px] bg-amber-100 text-amber-850 px-1.5 rounded font-bold font-mono">
                                      {record.weight} kg
                                    </span>
                                  </div>
                                  <p className="text-slate-450 font-semibold text-[10px] pt-0.5">
                                    记录时间：{record.time} {record.note && `(${record.note})`}
                                  </p>
                                </div>
                              </div>

                              <span className="shrink-0">
                                <button
                                  onClick={() => setWeightRecords(weightRecords.filter(w => w.id !== record.id))}
                                  className="text-[10px] text-slate-300 hover:text-rose-500 transition-colors cursor-pointer"
                                >
                                  删除
                                </button>
                              </span>
                            </div>
                          ))}

                        </div>
                      )}
                    </section>

                  </motion.div>
                )}

                {/* ==================== TAB: AI 智慧阁 (AI Engine) ==================== */}
                {activeTab === "ai_studio" && (
                  <motion.div
                    key="ai_studio"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.1 }}
                    className="space-y-6"
                  >
                    {/* Sub tabs inside AI Studio */}
                    <div className="bg-slate-900 text-white rounded-3xl p-1 grid grid-cols-4 gap-1 select-none text-center">
                      {(["diet", "workout", "challenge", "learning"] as const).map((tab) => (
                        <button
                          key={tab}
                          onClick={() => { setAiSubTab(tab); setAiError(""); }}
                          className={`py-2 text-[10.5px] rounded-2xl cursor-pointer flex flex-col items-center gap-1 transition-all ${
                            aiSubTab === tab ? "bg-white text-slate-900 font-extrabold shadow" : "text-slate-400 hover:text-white"
                          }`}
                        >
                          {tab === "diet" && <Utensils size={14} />}
                          {tab === "workout" && <Dumbbell size={14} />}
                          {tab === "challenge" && <Compass size={14} />}
                          {tab === "learning" && <Brain size={14} />}
                          <span>
                            {tab === "diet" && "膳食剖析"}
                            {tab === "workout" && "运动规划"}
                            {tab === "challenge" && "自律挑战"}
                            {tab === "learning" && "学习路径"}
                          </span>
                        </button>
                      ))}
                    </div>

                    {/* AI Loading state placeholder */}
                    {isAiLoading && (
                      <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center flex flex-col items-center justify-center space-y-4 shadow-sm animate-pulse">
                        <div className="h-12 w-12 rounded-full bg-slate-950 text-emerald-400 flex items-center justify-center text-lg font-black animate-spin">
                          🌀
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">自律修行大模型正在深思构想中...</p>
                          <p className="text-[9.5px] text-slate-400 mt-1">这大约需要 5-15 秒，正在分析您的修行流水...</p>
                        </div>
                      </div>
                    )}

                    {/* Show Error card */}
                    {aiError && !isAiLoading && (
                      <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 text-xs text-rose-700 space-y-1">
                        <p className="font-bold flex items-center gap-1">⚠️ 服务运行异常：</p>
                        <p className="leading-relaxed font-semibold">{aiError}</p>
                        <p className="text-[10px] text-rose-500 pt-1">提示：请检查设置页中 Worker 地址与 AI 提供商的 API Key 挂载状态。</p>
                      </div>
                    )}

                    {/* Content panels */}
                    {!isAiLoading && (
                      <>
                        {/* 1. Diet Advice Panel */}
                        {aiSubTab === "diet" && (
                          <div className="space-y-6">
                            {!dietAdvice ? (
                              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5 text-left">
                                <div className="text-center space-y-1">
                                  <h3 className="text-sm font-black text-slate-800">深度剖析今日膳食</h3>
                                  <p className="text-[10.5px] text-slate-400">大模型将对您今日记录的所有餐饮流水进行全盘剖析</p>
                                </div>

                                <div className="border border-slate-100 rounded-xl p-4 bg-slate-50 text-[11px] space-y-2">
                                  <p className="font-bold text-slate-650 border-b pb-1">今日已登记餐点：</p>
                                  {mealItems.filter(m => m.date === todayStr).length === 0 ? (
                                    <p className="text-slate-400 italic">您今天还没有登记任何饮食打卡哦！请先在“主页”打卡。</p>
                                  ) : (
                                    <div className="space-y-1 max-h-32 overflow-y-auto">
                                      {mealItems.filter(m => m.date === todayStr).map((m, idx) => (
                                        <div key={m.id} className="flex gap-2">
                                          <span className="font-bold text-emerald-600">[{m.period}]</span>
                                          <span className="text-slate-700 font-semibold">{m.text}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                <button
                                  onClick={handleGetDietAdvice}
                                  disabled={mealItems.filter(m => m.date === todayStr).length === 0}
                                  className="w-full bg-slate-900 hover:bg-slate-950 text-white font-black py-3 rounded-xl tracking-wider text-xs shadow cursor-pointer transition-all active:scale-99 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                                >
                                  ⚡ 一键深度剖析营养成分
                                </button>
                              </div>
                            ) : (
                              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-md space-y-6 text-left">
                                <div className="flex items-center justify-between border-b pb-3">
                                  <div className="space-y-0.5">
                                    <h4 className="text-xs font-black text-slate-805">今日膳食测评报告</h4>
                                    <p className="text-[9.5px] text-slate-400">由 AI 营养自律导师评估生成</p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-slate-400 font-bold">健康得分</span>
                                    <div className="h-10 w-10 rounded-full bg-emerald-50 text-emerald-700 border-2 border-emerald-505 flex items-center justify-center font-bold text-xs shadow-sm">
                                      {dietAdvice.score}
                                    </div>
                                  </div>
                                </div>

                                {/* Macros */}
                                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                                  <div className="bg-orange-50/50 p-2.5 rounded-xl border border-orange-100/50">
                                    <div className="text-[9px] text-orange-600 font-bold mb-0.5">热量估算</div>
                                    <div className="font-black text-orange-950 truncate">{dietAdvice.calories} kcal</div>
                                  </div>
                                  <div className="bg-sky-50/50 p-2.5 rounded-xl border border-sky-100/50">
                                    <div className="text-[9px] text-sky-650 font-bold mb-0.5">碳水化合物</div>
                                    <div className="font-black text-sky-855 truncate">{dietAdvice.carb}</div>
                                  </div>
                                  <div className="bg-indigo-50/50 p-2.5 rounded-xl border border-indigo-100/50">
                                    <div className="text-[9px] text-indigo-605 font-bold mb-0.5">蛋白质</div>
                                    <div className="font-black text-indigo-855 truncate">{dietAdvice.protein}</div>
                                  </div>
                                  <div className="bg-rose-50/50 p-2.5 rounded-xl border border-rose-100/50">
                                    <div className="text-[9px] text-rose-600 font-bold mb-0.5">脂肪</div>
                                    <div className="font-black text-rose-855 truncate">{dietAdvice.fat}</div>
                                  </div>
                                </div>

                                {/* Texts */}
                                <div className="space-y-4 text-xs leading-relaxed text-slate-700">
                                  <div className="bg-emerald-50/30 p-3.5 rounded-xl border border-emerald-100/40 space-y-1">
                                    <p className="font-bold text-emerald-800">📊 营养点评：</p>
                                    <p className="text-emerald-950 font-semibold leading-relaxed">{dietAdvice.analysis}</p>
                                  </div>
                                  <div className="bg-amber-50/30 p-3.5 rounded-xl border border-amber-100/40 space-y-1">
                                    <p className="font-bold text-amber-850">🍎 饮食改善建议：</p>
                                    <p className="text-amber-950 font-semibold leading-relaxed">{dietAdvice.advice}</p>
                                  </div>
                                </div>

                                <button
                                  onClick={() => setDietAdvice(null)}
                                  className="w-full border border-slate-200 hover:bg-slate-50 text-slate-500 font-bold py-2 rounded-xl text-[11px] transition-colors cursor-pointer text-center"
                                >
                                  🗑️ 重新剖析新流水
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {/* 2. Workout Plan Panel */}
                        {aiSubTab === "workout" && (
                          <div className="space-y-6">
                            {!workoutPlan ? (
                              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4 text-left">
                                <div className="text-center space-y-1 mb-2">
                                  <h3 className="text-sm font-black text-slate-800">智能专属运动路线生成</h3>
                                  <p className="text-[10.5px] text-slate-400">结合您的基础与时间，生成合理的单次路线计划</p>
                                </div>

                                <div className="grid grid-cols-2 gap-3 text-xs text-slate-750">
                                  <div className="space-y-1">
                                    <label className="text-[10px] text-slate-500 font-bold">健身目标</label>
                                    <select
                                      value={workoutTarget}
                                      onChange={(e) => setWorkoutTarget(e.target.value)}
                                      className="w-full border rounded-xl p-2.5 bg-slate-50 focus:outline-none font-semibold text-slate-850"
                                    >
                                      <option value="减脂控重">🏃 减脂控重</option>
                                      <option value="增肌塑形">🏋️ 增肌塑形</option>
                                      <option value="心肺提升">🫁 心肺提升</option>
                                      <option value="拉伸舒缓">🧘 拉伸舒缓</option>
                                      <option value="体态纠正">🧍 体态纠正</option>
                                    </select>
                                  </div>

                                  <div className="space-y-1">
                                    <label className="text-[10px] text-slate-500 font-bold">运动基础</label>
                                    <select
                                      value={workoutLevel}
                                      onChange={(e) => setWorkoutLevel(e.target.value)}
                                      className="w-full border rounded-xl p-2.5 bg-slate-50 focus:outline-none font-semibold text-slate-850"
                                    >
                                      <option value="初学者">🟢 初学者 (零基础)</option>
                                      <option value="中级训练者">🔵 中级 (有一定基础)</option>
                                      <option value="健身发烧友">🔥 专家 (追求高强爆发)</option>
                                    </select>
                                  </div>

                                  <div className="space-y-1">
                                    <label className="text-[10px] text-slate-500 font-bold">预计时长 (分钟)</label>
                                    <input
                                      type="number"
                                      min={10}
                                      max={120}
                                      value={workoutDuration}
                                      onChange={(e) => setWorkoutDuration(Number(e.target.value))}
                                      className="w-full border rounded-xl p-2.5 bg-slate-50 focus:outline-none font-semibold text-slate-850"
                                    />
                                  </div>

                                  <div className="space-y-1">
                                    <label className="text-[10px] text-slate-500 font-bold">性别与年龄</label>
                                    <div className="grid grid-cols-2 gap-1.5">
                                      <select
                                        value={workoutGender}
                                        onChange={(e) => setWorkoutGender(e.target.value)}
                                        className="border rounded-xl p-2.5 bg-slate-50 focus:outline-none font-semibold text-slate-850"
                                      >
                                        <option value="男">男</option>
                                        <option value="女">女</option>
                                      </select>
                                      <input
                                        type="number"
                                        min={12}
                                        max={80}
                                        value={workoutAge}
                                        onChange={(e) => setWorkoutAge(Number(e.target.value))}
                                        className="w-full border rounded-xl p-2.5 bg-slate-50 focus:outline-none font-semibold text-slate-850 text-center"
                                      />
                                    </div>
                                  </div>
                                </div>

                                <button
                                  onClick={handleGetWorkoutPlan}
                                  className="w-full bg-slate-900 hover:bg-slate-950 text-white font-black py-3 rounded-xl tracking-wider text-xs shadow cursor-pointer transition-all active:scale-99"
                                >
                                  🏋️ 一键定制个性化单次计划
                                </button>
                              </div>
                            ) : (
                              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-md text-left space-y-5">
                                <div className="border-b pb-2">
                                  <span className="text-[9.5px] bg-orange-100 text-orange-850 px-2 py-0.5 rounded font-extrabold uppercase">
                                    AI 定制训练路径
                                  </span>
                                  <h3 className="text-sm font-black text-slate-800 mt-1.5">
                                    {workoutPlan.target}计划
                                  </h3>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-center text-xs">
                                  <div className="bg-orange-50/50 p-2.5 rounded-xl border border-orange-100/50">
                                    <div className="text-[9px] text-orange-600 font-bold mb-0.5">预计总时长</div>
                                    <div className="font-black text-orange-950 truncate">{(workoutPlan.totalDurationMinutes || workoutPlan.totalDuration)} 分钟</div>
                                  </div>
                                  <div className="bg-rose-50/50 p-2.5 rounded-xl border border-rose-100/50">
                                    <div className="text-[9px] text-rose-600 font-bold mb-0.5">预计消耗热量</div>
                                    <div className="font-black text-rose-950 truncate">{(workoutPlan.estimatedCalories || 240)} kcal</div>
                                  </div>
                                </div>

                                <div className="space-y-4 text-xs">
                                  {/* Warmup */}
                                  <div className="bg-orange-50/30 border border-orange-100/40 p-3 rounded-xl">
                                    <p className="font-bold text-orange-800 mb-1">🔥 1. 热身运动 (Warm-up)</p>
                                    <p className="text-slate-650 font-semibold leading-relaxed">{workoutPlan.warmup}</p>
                                  </div>

                                  {/* Exercises */}
                                  <div className="space-y-2.5">
                                    <p className="font-bold text-slate-800">⚡ 2. 正式训练 (Main Exercises)</p>
                                    <div className="space-y-2">
                                      {workoutPlan.mainExercises.map((ex, i) => (
                                        <div key={i} className="bg-slate-50 border rounded-xl p-3 flex justify-between items-start gap-4">
                                          <div className="space-y-0.5">
                                            <p className="font-black text-slate-800 text-[11.5px]">{ex.name}</p>
                                            <p className="text-slate-500 font-semibold text-[10.5px]">{ex.description}</p>
                                          </div>
                                          <div className="text-right shrink-0 text-[10.5px]">
                                            <span className="bg-slate-200 text-slate-700 font-extrabold px-2 py-0.5 rounded-md block mb-1">
                                              {ex.sets}
                                            </span>
                                            <span className="text-slate-400 font-bold font-mono">休 {ex.rest}</span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Cooldown */}
                                  <div className="bg-blue-50/20 border border-blue-100/30 p-3 rounded-xl">
                                    <p className="font-bold text-blue-800 mb-1">🧘 3. 拉伸放松 (Cool-down)</p>
                                    <p className="text-slate-650 font-semibold leading-relaxed">{workoutPlan.cooldown}</p>
                                  </div>

                                  {/* Safety */}
                                  <div className="bg-rose-50/20 border border-rose-100/30 p-3 rounded-xl">
                                    <p className="font-bold text-rose-800 mb-1">🛡️ 安全防伤要点</p>
                                    <p className="text-slate-650 font-semibold leading-relaxed">{workoutPlan.safetyNotes}</p>
                                  </div>
                                </div>

                                <button
                                  onClick={() => setWorkoutPlan(null)}
                                  className="w-full border border-slate-200 hover:bg-slate-50 text-slate-500 font-bold py-2 rounded-xl text-[11px] transition-colors cursor-pointer text-center"
                                >
                                  🗑️ 重新制定新计划
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {/* 3. Skill Challenge Panel */}
                        {aiSubTab === "challenge" && (
                          <div className="space-y-6">
                            {!skillChallenge ? (
                              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4 text-left">
                                <div className="text-center space-y-1 mb-2">
                                  <h3 className="text-sm font-black text-slate-800">随机开启修行挑战</h3>
                                  <p className="text-[10.5px] text-slate-400">选择您感兴趣的维度，让 AI 构思一项本周小冒险</p>
                                </div>

                                <div className="space-y-2">
                                  <label className="text-[10.5px] text-slate-500 font-bold uppercase tracking-wider block">自律兴趣标签 (多选)</label>
                                  <div className="flex flex-wrap gap-1.5 select-none">
                                    {["日常自律", "读书写作", "健身塑形", "断舍离", "理财储蓄", "早起早睡", "心理冥想", "动手做饭", "数字戒毒"].map((tag) => {
                                      const active = selectedInterests.includes(tag);
                                      return (
                                        <button
                                          key={tag}
                                          type="button"
                                          onClick={() => {
                                            if (active) {
                                              setSelectedInterests(selectedInterests.filter(t => t !== tag));
                                            } else {
                                              setSelectedInterests([...selectedInterests, tag]);
                                            }
                                          }}
                                          className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-all cursor-pointer ${
                                            active
                                              ? "bg-slate-900 border-slate-900 text-white font-bold"
                                              : "bg-slate-50 border-slate-200 text-slate-650 hover:bg-slate-100"
                                          }`}
                                        >
                                          {active ? `✓ ${tag}` : `+ ${tag}`}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>

                                <button
                                  onClick={handleGetSkillChallenge}
                                  className="w-full bg-slate-900 hover:bg-slate-950 text-white font-black py-3 rounded-xl tracking-wider text-xs shadow cursor-pointer transition-all active:scale-99"
                                >
                                  🧭 探索生成一项随机挑战
                                </button>
                              </div>
                            ) : (
                              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-md text-left space-y-5">
                                <div className="border-b pb-2 flex justify-between items-start gap-4">
                                  <div>
                                    <span className="text-[9px] bg-purple-100 text-purple-800 px-2 py-0.5 rounded font-extrabold uppercase">
                                      {skillChallenge.category}
                                    </span>
                                    <h3 className="text-sm font-black text-slate-805 mt-1.5">
                                      ⚔️ 挑战：{skillChallenge.title}
                                    </h3>
                                  </div>
                                  <div className="text-right shrink-0 text-[10px]">
                                    <span className="bg-slate-100 border text-slate-600 font-extrabold px-1.5 py-0.5 rounded block mb-1">
                                      {skillChallenge.difficulty}
                                    </span>
                                    <span className="text-slate-400 font-bold font-mono">限时 {skillChallenge.estimatedTime}</span>
                                  </div>
                                </div>

                                <div className="space-y-4 text-xs">
                                  <p className="text-slate-600 font-semibold leading-relaxed bg-slate-50 p-3 rounded-xl border border-dashed">
                                    “ {skillChallenge.description} ”
                                  </p>

                                  {/* Steps */}
                                  <div className="space-y-2">
                                    <p className="font-bold text-slate-800">📋 挑战通关行动指南：</p>
                                    <div className="space-y-1.5">
                                      {skillChallenge.steps.map((st: string, i: number) => (
                                        <div key={i} className="flex gap-2 items-start font-semibold text-slate-700">
                                          <span className="h-4 w-4 rounded-full bg-slate-900 text-white text-[9px] flex items-center justify-center font-bold shrink-0 mt-0.5">
                                            {i + 1}
                                          </span>
                                          <span>{st}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Reward mindset */}
                                  <div className="bg-purple-50/20 border border-purple-100/30 p-3.5 rounded-xl">
                                    <p className="font-bold text-purple-800 mb-0.5">💎 心智成长收获：</p>
                                    <p className="text-slate-650 font-semibold leading-relaxed">{skillChallenge.rewardMindset}</p>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                  <button
                                    onClick={() => handleClaimChallenge(skillChallenge)}
                                    className="bg-emerald-650 hover:bg-emerald-700 text-white font-extrabold text-[11px] py-2.5 rounded-xl text-center shadow cursor-pointer transition-all active:scale-99"
                                  >
                                    👑 领用为必做目标
                                  </button>
                                  <button
                                    onClick={() => setSkillChallenge(null)}
                                    className="border border-slate-200 hover:bg-slate-50 text-slate-500 font-bold text-[11px] py-2.5 rounded-xl text-center cursor-pointer transition-colors"
                                  >
                                    重新探索
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* 4. Learning Path Panel */}
                        {aiSubTab === "learning" && (
                          <div className="space-y-6">
                            {!learningPath ? (
                              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4 text-left">
                                <div className="text-center space-y-1 mb-2">
                                  <h3 className="text-sm font-black text-slate-800">终身学习里程碑规划</h3>
                                  <p className="text-[10.5px] text-slate-400">输入想学习的硬核领域，大模型帮您合理分阶</p>
                                </div>

                                <div className="space-y-3 text-xs">
                                  <div className="space-y-1">
                                    <label className="text-[10px] text-slate-505 font-bold">我想精进的知识领域 / 技能</label>
                                    <input
                                      type="text"
                                      placeholder="例如：量子力学基础、Rust后端编程、古典钢琴..."
                                      value={learnSubject}
                                      onChange={(e) => setLearnSubject(e.target.value)}
                                      className="w-full border rounded-xl p-2.5 bg-slate-50 focus:outline-none font-semibold text-slate-805"
                                    />
                                  </div>

                                  <div className="space-y-1">
                                    <label className="text-[10px] text-slate-505 font-bold">建议规划周期 (天数)</label>
                                    <div className="relative">
                                      <input
                                        type="number"
                                        min={7}
                                        max={365}
                                        value={learnDays}
                                        onChange={(e) => setLearnDays(Number(e.target.value))}
                                        className="w-full border rounded-xl p-2.5 bg-slate-50 focus:outline-none font-semibold text-slate-805 pr-12"
                                      />
                                      <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold">天</span>
                                    </div>
                                  </div>
                                </div>

                                <button
                                  onClick={handleGetLearningPath}
                                  className="w-full bg-slate-900 hover:bg-slate-950 text-white font-black py-3 rounded-xl tracking-wider text-xs shadow cursor-pointer transition-all active:scale-99"
                                >
                                  🎓 生成里程碑自学路线
                                </button>
                              </div>
                            ) : (
                              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-md text-left space-y-5">
                                <div className="border-b pb-2">
                                  <span className="text-[9px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-extrabold uppercase">
                                    学习周期: {learningPath.estimatedDays}
                                  </span>
                                  <h3 className="text-sm font-black text-slate-805 mt-1.5">
                                    📖 终身学习路径规划：{learningPath.subject}
                                  </h3>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-center text-xs">
                                  <div className="bg-blue-50/50 p-2.5 rounded-xl border border-blue-100/50">
                                    <div className="text-[9px] text-blue-650 font-bold mb-0.5">规划总天数</div>
                                    <div className="font-black text-blue-950 truncate">{(learningPath.totalDays || 30)} 天</div>
                                  </div>
                                  <div className="bg-indigo-50/50 p-2.5 rounded-xl border border-indigo-100/50">
                                    <div className="text-[9px] text-indigo-605 font-bold mb-0.5">里程碑阶段数</div>
                                    <div className="font-black text-indigo-950 truncate">{(learningPath.milestonesCount || 4)} 阶段</div>
                                  </div>
                                </div>

                                <p className="text-xs text-slate-500 font-medium leading-relaxed bg-blue-50/10 p-3.5 rounded-xl border border-blue-100/20">
                                  {learningPath.overview}
                                </p>

                                {/* Milestones steps */}
                                <div className="space-y-4 relative border-l border-slate-200 pl-4 ml-2">
                                  {learningPath.milestones.map((ml, idx) => (
                                    <div key={idx} className="relative space-y-1.5 pb-2">
                                      {/* Dots */}
                                      <span className="absolute -left-[21.5px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-slate-900 bg-white flex items-center justify-center text-[7px] font-black">
                                        {idx + 1}
                                      </span>

                                      <div className="flex justify-between items-center text-xs">
                                        <p className="font-black text-slate-850">{ml.phase} · {ml.title}</p>
                                        <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-bold font-mono">
                                          {ml.timeRange}
                                        </span>
                                      </div>

                                      <p className="text-[11px] text-slate-600 leading-relaxed font-semibold">
                                        {ml.content}
                                      </p>

                                      <div className="text-[10px] space-y-0.5">
                                        <span className="text-slate-450 font-bold block">📚 推荐研究资料：</span>
                                        <div className="flex flex-wrap gap-1 pt-0.5">
                                          {ml.recommendedResources.map((res, rIdx) => (
                                            <span key={rIdx} className="bg-slate-50 border text-slate-605 px-1.5 py-0.5 rounded text-[9.5px] font-semibold">
                                              {res}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>

                                <button
                                  onClick={() => setLearningPath(null)}
                                  className="w-full border border-slate-200 hover:bg-slate-50 text-slate-500 font-bold py-2 rounded-xl text-[11px] transition-colors cursor-pointer text-center"
                                >
                                  🗑️ 重新规划路线
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </motion.div>
                )}

                {/* ==================== TAB 2: 必做时间 (Goal Builder) ==================== */}
                {activeTab === "mustdo" && (
                  <motion.div
                    key="mustdo"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.1 }}
                    className="space-y-6"
                  >
                    
                    {/* Goal Generator Form */}
                    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-md space-y-5">
                      
                      <div className="pb-2.5 border-b border-indigo-50">
                        <div className="flex items-center gap-2">
                          <Clock size={16} className="text-slate-900" />
                          <h2 className="text-sm font-black text-slate-900 tracking-tight">制定下一个必做目标 & 周期时刻</h2>
                        </div>
                        <p className="text-[10.5px] text-slate-400 mt-1">设置约束条件和每日计划，自律方可随之而生。</p>
                      </div>

                      <form onSubmit={handleAddNewTask} className="space-y-4 text-xs text-slate-800">
                        <div className="space-y-1">
                          <label className="text-[11px] text-slate-500 font-bold">
                            选择承诺周期 <span className="text-rose-500">*</span>
                          </label>
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              { id: "today", label: "📅 今日必做", desc: "追求日清" },
                              { id: "week", label: "🗓️ 本周必做", desc: "周段进修" },
                              { id: "month", label: "📊 本月必做", desc: "高瞻宏观" }
                            ].map((o) => (
                              <button
                                key={o.id}
                                type="button"
                                onClick={() => setNewTaskPeriod(o.id as any)}
                                className={`p-2.5 border rounded-xl cursor-pointer text-center space-y-0.5 transition-all ${
                                  newTaskPeriod === o.id
                                    ? "bg-slate-900 border-slate-900 text-white font-extrabold"
                                    : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"
                                }`}
                              >
                                <div className="font-bold text-[11px]">{o.label}</div>
                                <div className="text-[8.5px] opacity-80">{o.desc}</div>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] text-slate-500 font-bold">
                            承诺誓愿行动细节 <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="例如：早起半小时晨跑2英里、看文献2页并复盘..."
                            value={newTaskText}
                            onChange={(e) => setNewTaskText(e.target.value)}
                            className="w-full border border-slate-205 rounded-xl p-3 bg-slate-50 text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-500"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] text-slate-500 font-bold">
                            必做执行时刻或时限 (选填)
                          </label>
                          <input
                            type="text"
                            placeholder="例如：07:30、22:00、睡前、甚至用时1小时"
                            value={newTaskTime}
                            onChange={(e) => setNewTaskTime(e.target.value)}
                            className="w-full border border-slate-205 rounded-xl p-3 bg-white text-slate-800 focus:outline-none"
                          />
                          <p className="text-[8.5px] text-slate-400 leading-normal">
                            为自律行动锚定准确的强制启动时钟，不留拖延和迟疑。
                          </p>
                        </div>

                        <button
                          type="submit"
                          className="w-full bg-slate-900 hover:bg-slate-950 text-white font-black py-3 rounded-xl tracking-wider text-xs shadow cursor-pointer active:scale-99 transition-transform"
                        >
                          🎉 保存在册并返回主页
                        </button>
                      </form>

                    </div>

                    {/* Manage & Clear Column lists */}
                    <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-2xl space-y-3">
                      <h4 className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">已有承诺管理一览</h4>
                      <div className="space-y-1.5 max-h-56 overflow-y-auto">
                        {mustDoTasks.map((t) => (
                          <div key={t.id} className="bg-white border rounded-lg p-2.5 flex items-center justify-between text-xs font-semibold text-slate-700">
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-slate-800">{t.text}</p>
                              <p className="text-[9px] text-slate-400">
                                周期: {t.period === "today" ? "今日" : t.period === "week" ? "每周" : "本月"} | 约束点: {t.time || "⏰ 全天"}
                              </p>
                            </div>
                            <button
                              onClick={() => handleDeleteTask(t.id)}
                              className="text-slate-350 hover:text-rose-500 p-1 cursor-pointer transition-colors shrink-0"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                  </motion.div>
                )}

                {/* ==================== TAB 3: 设置页 ==================== */}
                {activeTab === "settings" && (
                  <motion.div
                    key="settings"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.1 }}
                    className="space-y-6"
                  >
                    
                    {/* Settings Form Card */}
                    <form onSubmit={handleSettingsSave} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-md space-y-5">
                      
                      <div className="pb-2 bg-white flex flex-col items-center">
                        <div className="relative group">
                          <img
                            src={settingsAvatar}
                            alt="Preview Avatar"
                            className="h-16 w-16 rounded-full object-cover border-2 border-slate-900 group-hover:scale-102 transition-transform shadow-md"
                          />
                        </div>
                        <p className="text-[10px] text-slate-400 font-semibold mt-1">自律头像预览</p>
                        
                        {/* Selector presets */}
                        <div className="flex gap-2.5 mt-2.5 select-none">
                          {DEFAULT_AVATARS.map((av, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setSettingsAvatar(av)}
                              className={`h-7 w-7 rounded-full border-2 overflow-hidden transition-all active:scale-95 cursor-pointer ${
                                settingsAvatar === av ? "border-slate-950 scale-105" : "border-slate-100 hover:border-slate-400"
                              }`}
                            >
                              <img src={av} alt="" className="h-full w-full object-cover" />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3.5 text-xs text-slate-800 text-left">
                        
                        <div className="space-y-1">
                          <label className="text-[11px] text-slate-500 font-bold">我的修行化名</label>
                          <input
                            type="text"
                            required
                            value={settingsName}
                            onChange={(e) => setSettingsName(e.target.value)}
                            className="w-full border border-slate-205 rounded-xl p-2.5 focus:outline-none bg-slate-50 font-bold text-slate-800"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] text-slate-400 font-bold uppercase">账户 ID 徽章</label>
                          <input
                            type="text"
                            disabled
                            value={session.id}
                            className="w-full border border-slate-150 rounded-xl p-2.5 bg-slate-100 font-mono text-slate-400 cursor-not-allowed select-text font-bold"
                          />
                        </div>

                      </div>

                      {/* AI CONFIG */}
                      <div className="border-t border-slate-100 pt-4 space-y-3.5 text-left text-xs">
                        
                        <div className="flex items-center gap-1">
                          <Key size={13} className="text-slate-700" />
                          <h4 className="font-extrabold text-slate-850">智能视觉 API 全球套件</h4>
                        </div>

                        <div className="grid grid-cols-2 gap-3.5">
                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-500 font-bold uppercase">首选 AI 渠道</label>
                            <select
                              value={settingsProvider}
                              onChange={(e) => setSettingsProvider(e.target.value)}
                              className="w-full border border-slate-205 rounded-xl p-2.5 bg-slate-50 focus:outline-none font-semibold text-slate-800"
                            >
                              <option value="SiliconFlow">硅基流动 SiliconFlow</option>
                              <option value="Minimax">Minimax (名之境)</option>
                              <option value="GLM">智谱 GLM</option>
                              <option value="DeepSeek">DeepSeek (深度求索)</option>
                              <option value="Kimi">Kimi (月之暗面)</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-500 font-bold uppercase">Cloudflare Worker 地址</label>
                            <input
                              type="text"
                              placeholder="https://your-worker.workers.dev"
                              value={workerApiUrl}
                              onChange={(e) => setWorkerApiUrl(e.target.value)}
                              className="w-full border border-slate-205 rounded-xl p-2.5 bg-slate-50 font-mono text-xs focus:outline-none text-slate-800"
                            />
                          </div>
                        </div>

                        <p className="text-[9.5px] text-slate-400 leading-normal bg-indigo-50/40 p-2.5 rounded-lg border border-indigo-100/60 font-medium">
                          💡 部署提醒：请将您的 API Keys 安全地使用 Wrangler Secrets 配置挂载在 Cloudflare Worker 上。在此处填入部署地址和首选提供商即可。
                        </p>

                      </div>

                      <div className="space-y-2 pt-2 border-t border-slate-100">
                        <button
                          type="submit"
                          className="w-full bg-slate-900 hover:bg-slate-950 text-white font-bold py-2.5 rounded-xl text-xs tracking-wider transition-colors cursor-pointer shadow-sm"
                        >
                          💾 保存并持久化本页轮廓设置
                        </button>
                      </div>

                    </form>

                    {/* BACKUP EXPORT AND IMPORT */}
                    <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
                      
                      <div className="border-b border-slate-100 pb-2">
                        <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                          <Database size={13} className="text-slate-805" />
                          <span>修行历程防丢备份中心</span>
                        </h4>
                      </div>

                      <div className="grid grid-cols-2 gap-3 select-none">
                        
                        {/* Export JSON */}
                        <button
                          onClick={handleExportJSON}
                          className="p-3 border border-slate-200 hover:bg-slate-50 rounded-xl flex flex-col items-center justify-center text-center space-y-1 text-slate-705 transition-colors cursor-pointer active:scale-[0.99]"
                        >
                          <ArrowDownToLine size={20} className="text-slate-700 animate-bounce" />
                          <span className="text-[11px] font-extrabold text-slate-800">一键导出 JSON</span>
                          <span className="text-[8.5px] text-slate-405">本地安全离线打包</span>
                        </button>

                        {/* Import JSON */}
                        <div className="relative p-3 border border-slate-200 hover:bg-slate-50 rounded-xl flex flex-col items-center justify-center text-center space-y-1 text-slate-705 transition-colors cursor-pointer active:scale-[0.99]">
                          <ArrowUpToLine size={20} className="text-slate-700" />
                          <span className="text-[11px] font-extrabold text-slate-800">同步导入备份</span>
                          <span className="text-[8.5px] text-slate-405">解析还原打卡行囊</span>
                          <input
                            type="file"
                            accept=".json"
                            onChange={handleImportJSON}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                          />
                        </div>

                      </div>

                    </div>

                    {/* iOS Shortcuts configuration panel */}
                    <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
                      
                      <div className="border-b border-slate-100 pb-2 flex items-center justify-between select-none">
                        <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                          <span className="text-sm">📱</span>
                          <span>iOS 苹果健康快捷指令联动</span>
                        </h4>
                        <span className="text-[8px] bg-indigo-50 text-indigo-700 font-extrabold px-2 py-0.5 rounded-full border border-indigo-100 uppercase">
                          快捷接入
                        </span>
                      </div>

                      <div className="space-y-3.5 text-left text-[11px] text-slate-600 leading-normal">
                        <p className="font-semibold text-slate-700">
                          支持通过苹果“快捷指令” App 从苹果健康中一键读取您今日的 <strong className="text-slate-950 font-bold">睡眠、运动、喝水量、体重</strong>，并静默同步导入云端！
                        </p>
                        
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5 font-mono text-[10px]">
                          {/* Endpoint */}
                          <div className="space-y-1">
                            <span className="text-[9.5px] font-bold text-slate-400 block uppercase font-sans">1. 快捷指令请求 URL (POST)</span>
                            <div className="flex items-center gap-2 bg-white border border-slate-200 p-2 rounded-lg justify-between">
                              <span className="truncate select-all text-slate-800 font-bold">
                                {`${workerApiUrl.replace(/\/$/, "")}/api/shortcuts/import`}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(`${workerApiUrl.replace(/\/$/, "")}/api/shortcuts/import`);
                                  alert("📋 快捷指令导入 URL 已成功复制到剪贴板！");
                                }}
                                className="text-[9.5px] text-indigo-600 font-black cursor-pointer shrink-0 hover:underline hover:text-indigo-800"
                              >
                                复制
                              </button>
                            </div>
                          </div>

                          {/* Authorization Token */}
                          <div className="space-y-1">
                            <span className="text-[9.5px] font-bold text-slate-400 block uppercase font-sans">2. 请求头 Authorization 字段</span>
                            <div className="flex items-center gap-2 bg-white border border-slate-200 p-2 rounded-lg justify-between">
                              <span className="truncate select-all text-slate-800 font-bold">
                                {`Bearer ${localStorage.getItem("min_cf_token") || "您尚未在云端登录"}`}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  const token = localStorage.getItem("min_cf_token") || "";
                                  if (!token) {
                                    alert("❌ 无法拷贝：请先在云端完成注册或登录！");
                                    return;
                                  }
                                  navigator.clipboard.writeText(`Bearer ${token}`);
                                  alert("📋 Authorization Bearer 令牌已复制！请直接作为快捷指令 Request Header 填入。");
                                }}
                                className="text-[9.5px] text-indigo-600 font-black cursor-pointer shrink-0 hover:underline hover:text-indigo-800"
                              >
                                复制
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Usage instruction */}
                        <div className="space-y-2 text-[10.5px]">
                          <div className="flex items-start gap-1">
                            <span className="text-xs text-indigo-600 font-bold mt-0.5">&bull;</span>
                            <p><strong>指令配置方法</strong>：在快捷指令“获取 URL 内容”操作中，设置方法为 <strong className="text-slate-900 font-black">POST</strong>，添加 Header <code className="bg-slate-100 p-0.5 rounded font-mono text-[10px]">Authorization</code>，Value 填入复制的 Bearer 令牌。</p>
                          </div>
                          <div className="flex items-start gap-1">
                            <span className="text-xs text-indigo-600 font-bold mt-0.5">&bull;</span>
                            <p><strong>请求体配置 (JSON)</strong>：在请求体中，以 JSON 键值对传递您想导入的数据。例如：
                              <code className="block bg-slate-100 p-2 rounded font-mono text-[9px] mt-1 whitespace-pre">
{`{
  "water": { "amount": 250 },
  "weight": { "weight": 70.5 },
  "workout": { "type": "户外跑步", "duration": 40 },
  "sleep": { "sleepTime": "23:00", "wakeTime": "07:30" }
}`}
                              </code>
                            </p>
                          </div>
                        </div>

                      </div>

                    </div>

                    {/* Log out section */}
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full bg-rose-50 border border-rose-100 text-rose-700 hover:bg-rose-100/70 font-black py-2.5 rounded-xl text-xs transition-colors cursor-pointer text-center"
                    >
                      🚪 卸下行囊，退出登录状态
                    </button>

                  </motion.div>
                )}

                {syncStatus && (
                  <p className="text-[10px] text-emerald-800 bg-emerald-50 border border-emerald-100 p-2.5 rounded-xl font-bold text-center select-none shadow-xs mt-3">
                    {syncStatus}
                  </p>
                )}

              </AnimatePresence>

            </div>
          </main>

          {/* 3. CORE BOTTOM NAVIGATION BAR */}
          <footer className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200/90 shadow-sm shrink-0 select-none pb-safe">
            <div className="max-w-md mx-auto grid grid-cols-4 p-1">
              
              <button
                onClick={() => setActiveTab("home")}
                className={`py-2 text-[10.5px] rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all ${
                  activeTab === "home" ? "bg-slate-900 text-white font-extrabold" : "text-slate-500 hover:bg-slate-50"
                }`}
              >
                <Award size={16} />
                <span className="mt-0.5">主页</span>
              </button>

              <button
                onClick={() => setActiveTab("ai_studio")}
                className={`py-2 text-[10.5px] rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all ${
                  activeTab === "ai_studio" ? "bg-slate-900 text-white font-extrabold" : "text-slate-500 hover:bg-slate-50"
                }`}
              >
                <Sparkles size={16} />
                <span className="mt-0.5">AI 智慧阁</span>
              </button>

              <button
                onClick={() => setActiveTab("mustdo")}
                className={`py-2 text-[10.5px] rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all ${
                  activeTab === "mustdo" ? "bg-slate-900 text-white font-extrabold" : "text-slate-500 hover:bg-slate-50"
                }`}
              >
                <Clock size={16} />
                <span className="mt-0.5">必做时间</span>
              </button>

              <button
                onClick={() => setActiveTab("settings")}
                className={`py-2 text-[10.5px] rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all ${
                  activeTab === "settings" ? "bg-slate-900 text-white font-extrabold" : "text-slate-500 hover:bg-slate-50"
                }`}
              >
                <Settings size={16} />
                <span className="mt-0.5">设置页</span>
              </button>

            </div>
          </footer>
        </>
      )}

      {/* RENDER DYNAMIC MODAL BOX OVERLAY */}
      <CheckInModal
        isOpen={isCheckInOpen}
        onClose={() => setIsCheckInOpen(false)}
        todayMealsCount={mealItems.filter((e) => e.date === todayStr).length}
        onAddSleep={handleAddSleep}
        onAddDiet={handleAddDiet}
        onAddWorkout={handleAddWorkout}
        onAddStudy={handleAddStudy}
        isAnalyzingImage={isAnalyzingImage}
        setIsAnalyzingImage={setIsAnalyzingImage}
      />

    </div>
  );
}
