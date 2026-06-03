import React, { useState, useEffect } from "react";
import { Moon, Utensils, Dumbbell, BookOpen, Clock, Camera, Loader2, Check, X, Star } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface CheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  todayMealsCount: number;
  onAddSleep: (record: { sleepTime: string; wakeTime: string; quality: number; note: string }) => void;
  onAddDiet: (record: { period: string; text: string; note: string }) => void;
  onAddWorkout: (record: { type: string; duration: number }) => void;
  onAddStudy: (record: { content: string; duration: number }) => void;
  isAnalyzingImage: boolean;
  setIsAnalyzingImage: (val: boolean) => void;
}

export default function CheckInModal({
  isOpen,
  onClose,
  todayMealsCount,
  onAddSleep,
  onAddDiet,
  onAddWorkout,
  onAddStudy,
  isAnalyzingImage,
  setIsAnalyzingImage,
}: CheckInModalProps) {
  const [activeCheckTab, setActiveCheckTab] = useState<"sleep" | "diet" | "workout" | "study">("sleep");

  // Sleep fields
  const [sleepTime, setSleepTime] = useState("23:00");
  const [wakeTime, setWakeTime] = useState("07:30");
  const [sleepQuality, setSleepQuality] = useState(5);
  const [sleepNote, setSleepNote] = useState("");

  // Diet fields
  const [mealNumber, setMealNumber] = useState(todayMealsCount + 1);
  const [dietText, setDietText] = useState("");
  const [dietNote, setDietNote] = useState("");
  const [apiSuccessInfo, setApiSuccessInfo] = useState<string | null>(null);

  // Sync meal number if todayMealsCount changes
  useEffect(() => {
    setMealNumber(todayMealsCount + 1);
  }, [todayMealsCount, isOpen]);

  // Workout fields
  const [workoutType, setWorkoutType] = useState("");
  const [workoutDuration, setWorkoutDuration] = useState<number | "">("");

  // Study fields
  const [studyContent, setStudyContent] = useState("");
  const [studyDuration, setStudyDuration] = useState<number | "">("");

  const [errorText, setErrorText] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Process camera photo & call Gemini API
  const resizeAndBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 256;
          const MAX_HEIGHT = 256;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", 0.5));
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  };

  const handleDietPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzingImage(true);
    setErrorText("");
    setApiSuccessInfo(null);

    try {
      const base64Data = await resizeAndBase64(file);
      const workerUrl = localStorage.getItem("min_worker_api_url") || "";
      const token = localStorage.getItem("min_cf_token") || "";
      const sessionRaw = localStorage.getItem("min_user_session");
      let provider = "SiliconFlow";
      if (sessionRaw) {
        try {
          const s = JSON.parse(sessionRaw);
          provider = s.apiProvider || "SiliconFlow";
        } catch (e) {}
      }

      const apiEndpoint = workerUrl ? `${workerUrl.replace(/\/$/, "")}/api/analyze-diet-image` : "/api/analyze-diet-image";
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      headers["X-AI-Provider"] = provider;

      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers,
        body: JSON.stringify({ image: base64Data, mimeType: "image/jpeg" }),
      });

      if (!response.ok) {
        throw new Error("AI 无法识别当前图片，请确保格式正确");
      }

      const data = await response.json();
      if (data.text) {
        setDietText(data.text);
        if (data.note) {
          setDietNote(data.note);
        }
        setApiSuccessInfo("✨ AI 成功识别餐盘并填充数据");
      } else {
        throw new Error("模型未能返回清晰餐饮名称，请手动输入");
      }
    } catch (err: any) {
      console.error(err);
      setErrorText(err.message || "无法连接智能识别，请直接键入食物细节。");
    } finally {
      setIsAnalyzingImage(false);
    }
  };

  // Submits
  const handleSleepSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddSleep({
      sleepTime,
      wakeTime,
      quality: sleepQuality,
      note: sleepNote.trim(),
    });
    triggerSuccess("作息打卡记录成功！");
  };

  const handleDietSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dietText.trim()) return;
    onAddDiet({
      period: `第 ${mealNumber} 顿`,
      text: dietText.trim(),
      note: dietNote.trim(),
    });
    triggerSuccess("饮食餐次打卡成功！已准备下一顿。");
    setDietText("");
    setDietNote("");
    setApiSuccessInfo(null);
  };

  const handleWorkoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workoutType.trim() || !workoutDuration) return;
    onAddWorkout({
      type: workoutType.trim(),
      duration: Number(workoutDuration),
    });
    triggerSuccess("运动健能打卡成功！");
    setWorkoutType("");
    setWorkoutDuration("");
  };

  const handleStudySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studyContent.trim() || !studyDuration) return;
    onAddStudy({
      content: studyContent.trim(),
      duration: Number(studyDuration),
    });
    triggerSuccess("终身学习打卡成功！");
    setStudyContent("");
    setStudyDuration("");
  };

  const triggerSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => {
      setSuccessMsg("");
      onClose();
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dim backdrop */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={onClose} />

      <div className="relative bg-white border border-slate-205 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh]">
        
        {/* Header bar */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 select-none">
          <div className="flex items-center gap-2">
            <span className="text-lg">⚡</span>
            <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">每日自律打卡台</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer">
            <X size={16} />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-4 border-b border-slate-100 bg-white p-1 gap-1 select-none text-center">
          <button
            onClick={() => { setActiveCheckTab("sleep"); setErrorText(""); }}
            className={`py-2 text-[11px] rounded-lg cursor-pointer flex flex-col items-center gap-1 transition-all ${
              activeCheckTab === "sleep" ? "bg-slate-900 text-white font-bold" : "text-slate-500 hover:bg-slate-100"
            }`}
          >
            <Moon size={14} />
            <span>作息打卡</span>
          </button>

          <button
            onClick={() => { setActiveCheckTab("diet"); setErrorText(""); }}
            className={`py-2 text-[11px] rounded-lg cursor-pointer flex flex-col items-center gap-1 transition-all ${
              activeCheckTab === "diet" ? "bg-slate-900 text-white font-bold" : "text-slate-500 hover:bg-slate-100"
            }`}
          >
            <Utensils size={14} />
            <span>饮食打卡</span>
          </button>

          <button
            onClick={() => { setActiveCheckTab("workout"); setErrorText(""); }}
            className={`py-2 text-[11px] rounded-lg cursor-pointer flex flex-col items-center gap-1 transition-all ${
              activeCheckTab === "workout" ? "bg-slate-900 text-white font-bold" : "text-slate-500 hover:bg-slate-100"
            }`}
          >
            <Dumbbell size={14} />
            <span>运动打卡</span>
          </button>

          <button
            onClick={() => { setActiveCheckTab("study"); setErrorText(""); }}
            className={`py-2 text-[11px] rounded-lg cursor-pointer flex flex-col items-center gap-1 transition-all ${
              activeCheckTab === "study" ? "bg-slate-900 text-white font-bold" : "text-slate-500 hover:bg-slate-100"
            }`}
          >
            <BookOpen size={14} />
            <span>学习打卡</span>
          </button>
        </div>

        {/* Body Form */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          
          <AnimatePresence mode="wait">
            {successMsg ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="py-12 flex flex-col items-center justify-center text-center space-y-3"
              >
                <div className="h-12 w-12 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xl font-bold animate-bounce shadow">
                  ✓
                </div>
                <p className="text-xs font-bold text-slate-800">{successMsg}</p>
                <p className="text-[10px] text-slate-400">正在合拢打卡台并保存...</p>
              </motion.div>
            ) : (
              <motion.div
                key={activeCheckTab}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.1 }}
              >
                {/* 1. Sleep Form */}
                {activeCheckTab === "sleep" && (
                  <form onSubmit={handleSleepSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] text-slate-500 font-bold">上床入睡点</label>
                        <input
                          type="time"
                          required
                          value={sleepTime}
                          onChange={(e) => setSleepTime(e.target.value)}
                          className="w-full text-xs font-semibold border border-slate-205 rounded-lg p-2.5 bg-slate-50 text-slate-800 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] text-slate-500 font-bold">清晨晨醒点</label>
                        <input
                          type="time"
                          required
                          value={wakeTime}
                          onChange={(e) => setWakeTime(e.target.value)}
                          className="w-full text-xs font-semibold border border-slate-205 rounded-lg p-2.5 bg-slate-50 text-slate-800 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5 select-none">
                      <label className="text-[11px] text-slate-500 font-bold">睡眠主观评分</label>
                      <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 p-2 rounded-lg justify-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setSleepQuality(star)}
                            className="p-1 hover:scale-110 transition-transform cursor-pointer text-slate-350"
                          >
                            <Star
                              size={22}
                              className={star <= sleepQuality ? "fill-amber-450 stroke-amber-500" : "stroke-slate-300"}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] text-slate-500 font-bold">夜梦小记 / 觉察反馈</label>
                      <input
                        type="text"
                        placeholder="例如：睡前没有看手机，睡眠很深沉..."
                        value={sleepNote}
                        onChange={(e) => setSleepNote(e.target.value)}
                        className="w-full text-xs border border-slate-205 rounded-lg p-2.5 bg-slate-50 text-slate-800 focus:outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-slate-900 hover:bg-slate-950 text-white font-bold py-2.5 rounded-lg text-xs tracking-wide transition-all shadow cursor-pointer active:scale-[0.99]"
                    >
                      提交作息打卡记录
                    </button>
                  </form>
                )}

                {/* 2. Diet Form */}
                {activeCheckTab === "diet" && (
                  <form onSubmit={handleDietSubmit} className="space-y-4">
                    <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">📌 餐次：今日第 {mealNumber} 顿</span>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => setMealNumber(Math.max(1, mealNumber - 1))}
                          className="px-2 py-0.5 text-[10px] font-bold bg-white border rounded text-slate-600 hover:bg-slate-100 cursor-pointer"
                        >
                          -
                        </button>
                        <button
                          type="button"
                          onClick={() => setMealNumber(mealNumber + 1)}
                          className="px-2 py-0.5 text-[10px] font-bold bg-white border rounded text-slate-600 hover:bg-slate-100 cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Camera snapshot upload / drag option */}
                    <div className="border border-dashed border-slate-200 rounded-xl p-3 text-center bg-slate-50/50 relative">
                      {isAnalyzingImage ? (
                        <div className="py-2.5 flex flex-col items-center gap-1.5">
                          <Loader2 size={20} className="text-slate-905 animate-spin" />
                          <span className="text-[10px] font-bold text-slate-600 animate-pulse">
                            Gemini 视觉神经网络正在扫描餐盘成分...
                          </span>
                        </div>
                      ) : (
                        <div className="py-2 flex flex-col items-center gap-1 select-none">
                          <Camera size={18} className="text-slate-400" />
                          <p className="text-[10.5px] font-semibold text-slate-700">📸 拍照/上传食物图片触发智能识别</p>
                          <p className="text-[8.5px] text-slate-400">我们将自动识别菜名和膳食信息填入下方</p>
                        </div>
                      )}
                      
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleDietPhotoUpload}
                        disabled={isAnalyzingImage}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                    </div>

                    {apiSuccessInfo && (
                      <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-lg text-[10.5px] text-emerald-800 flex items-center gap-1">
                        <Check size={12} className="stroke-[3]" />
                        <span>{apiSuccessInfo}</span>
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="text-[11px] text-slate-500 font-bold">食物具体名称与份量 <span className="text-rose-500">*</span></label>
                      <textarea
                        required
                        rows={2}
                        placeholder="例如：生煎鸡胸肉120克，炒西兰花一碗，紫米饭一小碗..."
                        value={dietText}
                        onChange={(e) => setDietText(e.target.value)}
                        className="w-full text-xs border border-slate-205 rounded-lg p-2.5 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] text-slate-500 font-bold">餐饮备注或油盐控糖评价</label>
                      <input
                        type="text"
                        placeholder="例如：油放得少，膳食蛋白质充沛"
                        value={dietNote}
                        onChange={(e) => setDietNote(e.target.value)}
                        className="w-full text-xs border border-slate-205 rounded-lg p-2.5 focus:outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-slate-900 hover:bg-slate-950 text-white font-bold py-2.5 rounded-lg text-xs tracking-wide transition-all shadow cursor-pointer active:scale-[0.99]"
                    >
                      提交本次饮食打卡 (保存第 {mealNumber} 顿)
                    </button>
                  </form>
                )}

                {/* 3. Workout Form */}
                {activeCheckTab === "workout" && (
                  <form onSubmit={handleWorkoutSubmit} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[11px] text-slate-500 font-bold">运动项目 / 主题 <span className="text-rose-500">*</span></label>
                      <input
                        type="text"
                        required
                        placeholder="例如：户外有氧慢跑、哑铃无氧上肢训练、瑜伽..."
                        value={workoutType}
                        onChange={(e) => setWorkoutType(e.target.value)}
                        className="w-full text-xs border border-slate-205 rounded-lg p-2.5 Focus:outline-none bg-slate-50 text-slate-800"
                      />
                      
                      {/* Popular tags */}
                      <div className="flex flex-wrap gap-1.5 pt-1.5 select-none">
                        {["有氧慢跑5K", "哑铃力量训练", "波比跳室内HIIT", "腹肌核心撕裂者", "猫式拉伸瑜伽"].map(tag => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => setWorkoutType(tag)}
                            className="px-2 py-1 text-[9.5px] border border-slate-200 rounded-full hover:bg-slate-50 text-slate-600 cursor-pointer transition-colors"
                          >
                            + {tag}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] text-slate-500 font-bold">运动持续时长 (单位：分钟) <span className="text-rose-500">*</span></label>
                      <div className="relative">
                        <input
                          type="number"
                          required
                          min={1}
                          placeholder="例如：30"
                          value={workoutDuration}
                          onChange={(e) => setWorkoutDuration(e.target.value ? Number(e.target.value) : "")}
                          className="w-full text-xs border border-slate-205 rounded-lg p-2.5 pr-10 focus:outline-none"
                        />
                        <span className="absolute right-3.5 top-2.5 text-xs text-slate-400 font-bold select-none">分钟</span>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-slate-900 hover:bg-slate-950 text-white font-bold py-2.5 rounded-lg text-xs tracking-wide transition-all shadow cursor-pointer active:scale-[0.99]"
                    >
                      提交本次运动打卡
                    </button>
                  </form>
                )}

                {/* 4. Study Form */}
                {activeCheckTab === "study" && (
                  <form onSubmit={handleStudySubmit} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[11px] text-slate-500 font-bold">学习研究内容 <span className="text-rose-500">*</span></label>
                      <input
                        type="text"
                        required
                        placeholder="例如：阅读《明朝那些事》、复习人工智能微调课程..."
                        value={studyContent}
                        onChange={(e) => setStudyContent(e.target.value)}
                        className="w-full text-xs border border-slate-205 rounded-lg p-2.5 Focus:outline-none bg-slate-50 text-slate-800"
                      />

                      {/* Popular presets */}
                      <div className="flex flex-wrap gap-1.5 pt-1.5 select-none">
                        {["深度自习专业书", "刷LeetCode基础算法", "英文原版书精听", "手账和博客复盘", "量子力学入门讲座"].map(tag => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => setStudyContent(tag)}
                            className="px-2 py-1 text-[9.5px] border border-slate-200 rounded-full hover:bg-slate-50 text-slate-600 cursor-pointer transition-colors"
                          >
                            + {tag}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] text-slate-500 font-bold">专注学习修行时长 (单位：分钟) <span className="text-rose-500">*</span></label>
                      <div className="relative">
                        <input
                          type="number"
                          required
                          min={1}
                          placeholder="例如：45"
                          value={studyDuration}
                          onChange={(e) => setStudyDuration(e.target.value ? Number(e.target.value) : "")}
                          className="w-full text-xs border border-slate-205 rounded-lg p-2.5 pr-10 focus:outline-none"
                        />
                        <span className="absolute right-3.5 top-2.5 text-xs text-slate-400 font-bold select-none">分钟</span>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-slate-900 hover:bg-slate-950 text-white font-bold py-2.5 rounded-lg text-xs tracking-wide transition-all shadow cursor-pointer active:scale-[0.99]"
                    >
                      提交今日学习打卡
                    </button>
                  </form>
                )}

                {errorText && (
                  <p className="text-[10px] text-rose-500 font-semibold text-center mt-2">{errorText}</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
