export interface SleepRecord {
  id: string;
  date: string; // YYYY-MM-DD
  sleepTime: string; // "23:00"
  wakeTime: string; // "07:30"
  duration: number; // calculated hours
  quality: number; // 1 to 5 stars
  note?: string;
}

export type MealPeriod = "早餐" | "午餐" | "晚餐" | "加餐";

export interface MealItem {
  id: string;
  date: string; // YYYY-MM-DD
  period: MealPeriod;
  text: string; // e.g., "燕麦粥 + 2个煮鸡蛋"
  note?: string;
}

export interface DietAdvice {
  calories: number;
  carb: string;
  protein: string;
  fat: string;
  score: number;
  analysis: string;
  advice: string;
}

export interface WorkoutRecord {
  id: string;
  date: string; // YYYY-MM-DD
  type: string; // e.g., "有氧跑步" / "高强度力量训练"
  duration: number; // minutes
  calories: number; // kcal
  intensity: "低" | "中" | "高";
  planName?: string;
}

export interface WorkoutPlan {
  target: string;
  totalDuration: string;
  warmup: string;
  mainExercises: {
    name: string;
    sets: string;
    rest: string;
    description: string;
  }[];
  cooldown: string;
  safetyNotes: string;
}

export interface SkillChallenge {
  id: string;
  title: string;
  category: string;
  estimatedTime: string;
  difficulty: "新手" | "进阶" | "专家" | string;
  description: string;
  steps: string[];
  rewardMindset: string;
  status: "进行中" | "已完成" | "已放弃";
  registeredDate: string;
  completedDate?: string;
}

export interface ReadingNote {
  id: string;
  date: string;
  title: string;
  author?: string;
  pagesRead?: number;
  totalPages?: number;
  notes: string;
}

export interface LearningMilestone {
  phase: string;
  title: string;
  timeRange: string;
  content: string;
  recommendedResources: string[];
  completed?: boolean;
}

export interface LearningPath {
  id: string;
  subject: string;
  overview: string;
  estimatedDays: string;
  totalDays?: number;
  milestonesCount?: number;
  milestones: LearningMilestone[];
  active: boolean;
  date: string;
}

export interface MustDoTask {
  id: string;
  period: "today" | "week" | "month";
  text: string;
  time?: string; // e.g. "08:30" or "⏰ 全天"
  completed: boolean;
  createdAt: string; // ISO Date YYYY-MM-DD
}

export interface StudyRecord {
  id: string;
  date: string; // YYYY-MM-DD
  content: string; // 学习内容
  duration: number; // minutes
}

export interface UserSession {
  username: string;
  name: string;
  id: string;
  avatarUrl: string;
  isLoggedIn: boolean;
  apiProvider: string;
  apiKey: string;
}

export interface WagerBinding {
  id: string;
  userA: string;
  userB: string;
  target: string;
  duration: "week" | "month" | "halfYear" | "year";
  totalDays: number;
  startDate: string;
  depositTotal: number;
  depositRemaining: number;
  streakDays: number;
  status: "active" | "completed";
  rageModeRemainingDays: number;
  rageModeTargetDays: number;
  missedDaysCount: number;
  history: Record<string, {
    userA: boolean;
    userB: boolean;
    processed: boolean;
  }>;
  lastSyncDate: string;
  userANickname?: string;
  userBNickname?: string;
  todayCheckedInA?: boolean;
  todayCheckedInB?: boolean;
}

export interface WagerInvite {
  id: string;
  from: string;
  target: string;
  duration: "week" | "month" | "halfYear" | "year";
  deposit: number;
  createdAt: string;
}

export interface WaterRecord {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // "14:30"
  amount: number; // ml
}


