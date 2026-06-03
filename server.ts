import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Helper for sending prompt and getting JSON response
async function getGeminiJSON(prompt: string, schema: any) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        systemInstruction: "You are an expert self-discipline and lifestyle coach. Answer in Chinese (简体中文). Design inspiring, practical, and highly realistic habits and goals.",
      },
    });

    const text = response.text || "{}";
    return JSON.parse(text);
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw error;
  }
}

// 1. Diet advice endpoint
app.post("/api/diet-advice", async (req, res) => {
  const { meals } = req.body;
  if (!meals || !Array.isArray(meals) || meals.length === 0) {
    return res.status(400).json({ error: "Missing or invalid meals list" });
  }

  const mealSummary = meals
    .map((m) => `[时段: ${m.period}, 食物: ${m.text}, 备注: ${m.note || "无"}]`)
    .join("\n");

  const prompt = `分析以下我今天摄入的饮食，估算热量、碳水、蛋白质、脂肪，给出健康评分(0-100)，并给出个性化的饮食建议。
已摄入的餐饮：
${mealSummary}`;

  const schema = {
    type: Type.OBJECT,
    properties: {
      calories: { type: Type.INTEGER, description: "今日估算总热量(kcal)" },
      carb: { type: Type.STRING, description: "碳水化合物估算，例如：150g" },
      protein: { type: Type.STRING, description: "蛋白质估算，例如：75g" },
      fat: { type: Type.STRING, description: "脂肪估算，例如：50g" },
      score: { type: Type.INTEGER, description: "健康度评分 (0至100积分)" },
      analysis: { type: Type.STRING, description: "今日膳食的全面营养点评，包括好的一面和不足的一面" },
      advice: { type: Type.STRING, description: "未来的具体改善建议（如何调整主食、蔬菜、肉类等）" },
    },
    required: ["calories", "carb", "protein", "fat", "score", "analysis", "advice"],
  };

  try {
    const result = await getGeminiJSON(prompt, schema);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: "获取饮食分析失败：" + error.message });
  }
});

// 1.5. Analyze diet image endpoint
app.post("/api/analyze-diet-image", async (req, res) => {
  const { image, mimeType } = req.body;
  if (!image) {
    return res.status(400).json({ error: "图片数据不完整" });
  }

  let base64Data = image;
  if (base64Data.includes(",")) {
    base64Data = base64Data.split(",")[1];
  }

  const prompt = "请仔细观察和分析这张餐饮食物照片，识别里面具体吃了什么、喝了什么。指出核心主食和菜肴。";

  try {
    const imagePart = {
      inlineData: {
        mimeType: mimeType || "image/jpeg",
        data: base64Data,
      },
    };
    const textPart = {
      text: prompt,
    };

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [textPart, imagePart],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING, description: "识别到的食物/餐饮名称组合，紧凑简练。例：煎三文鱼配藜麦饭与烤芦笋" },
            period: { type: Type.STRING, description: "推荐阶段。只能是以下四个值之一：'早餐', '午餐', '晚餐', '加餐'" },
            note: { type: Type.STRING, description: "极为简练的估算分量以及一句话健康备忘，例：约450大卡，蛋白质丰富。" },
          },
          required: ["text", "period", "note"],
        },
        systemInstruction: "You are an expert nutritionist. Analyze the food image accurately and return JSON data in Chinese (简体中文).",
      },
    });

    const result = JSON.parse(response.text || "{}");
    res.json(result);
  } catch (error: any) {
    console.error("Image analysis error:", error);
    res.status(505).json({ error: "图片智能分析失败：" + error.message });
  }
});

// 2. Workout generation endpoint
app.post("/api/workout-plan", async (req, res) => {
  const { target, level, durationMinutes, gender, age } = req.body;

  const prompt = `为一位健身目标是 [${target || "减脂控重"}]，运动基础是 [${level || "初学者"}]，预计训练时长是 [${durationMinutes || 30}分钟] 的用户（性别：${gender || "未指定"}，年龄：${age || "25"}），设计一个高效安全的个性化单次训练计划。请包含热身、正式部分、拉伸放松，并标注具体动作与安全要点。`;

  const schema = {
    type: Type.OBJECT,
    properties: {
      target: { type: Type.STRING },
      totalDuration: { type: Type.STRING, description: "总预算时间，例如: 40分钟" },
      warmup: { type: Type.STRING, description: "热身动作与建议" },
      mainExercises: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "运动动作名称" },
            sets: { type: Type.STRING, description: "组数，次数/每组，或持续时间，例如: 3组 x 15次" },
            rest: { type: Type.STRING, description: "组间休息时间，例如: 60秒" },
            description: { type: Type.STRING, description: "动作简述和细节要点" },
          },
          required: ["name", "sets", "rest", "description"],
        },
        description: "正式运动列表",
      },
      cooldown: { type: Type.STRING, description: "拉伸与整理运动指导" },
      safetyNotes: { type: Type.STRING, description: "个性化运动防伤与呼吸、姿态安全建议" },
    },
    required: ["target", "totalDuration", "warmup", "mainExercises", "cooldown", "safetyNotes"],
  };

  try {
    const result = await getGeminiJSON(prompt, schema);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: "生成运动计划失败：" + error.message });
  }
});

// 3. Random interest-based skill challenge endpoint
app.post("/api/skill-challenge", async (req, res) => {
  const { interests, completedChallenges } = req.body;

  const interestStr = interests && interests.length > 0 ? interests.join("、") : "任意生活、趣味或认知技能";
  const completedStr = completedChallenges && completedChallenges.length > 0 ? `避免推荐以下已完成的挑战：${completedChallenges.map((c: any) => c.title).join("、")}` : "";

  const prompt = `根据我的兴趣标签 [${interestStr}]，随机推荐一个适合在今天/本周内完成的新技能或好玩的生活冒险挑战！挑战不仅要能保持新鲜感，还要具有一定的实操性和自律提升意义。
${completedStr}`;

  const schema = {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: "挑战的创意吸引人名称" },
      category: { type: Type.STRING, description: "二级分类标签，例如：生活创造、动手研究、身心健康" },
      estimatedTime: { type: Type.STRING, description: "预计完成耗时" },
      difficulty: { type: Type.STRING, description: "难度评级 (新手/进阶/专家)" },
      description: { type: Type.STRING, description: "简短勾勒这是一个怎样的挑战，带来了什么意义" },
      steps: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "明确具体的达成指南步骤",
      },
      rewardMindset: { type: Type.STRING, description: "完成后的收获（为什么值得一试，培养了何种自律或认知）" },
    },
    required: ["title", "category", "estimatedTime", "difficulty", "description", "steps", "rewardMindset"],
  };

  try {
    const result = await getGeminiJSON(prompt, schema);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: "获取挑战推荐失败：" + error.message });
  }
});

// 4. Learning path builder
app.post("/api/learning-path", async (req, res) => {
  const { subject, days } = req.body;
  if (!subject) {
    return res.status(400).json({ error: "Missing learning subject" });
  }

  const prompt = `我想长期终身学习这一项核心知识领域：[${subject}]。
请为我规划一个长期的里程碑学习路径（分期展开，总共制定 4 个阶段，总耗时大约 ${days || 30} 天）。每个阶段应有明确的阅读重点、核心概念、需要记录卡片的知识要点，以及推荐的学习资料。`;

  const schema = {
    type: Type.OBJECT,
    properties: {
      subject: { type: Type.STRING },
      overview: { type: Type.STRING, description: "该学科/技能的长期认知升级背景和自我成长激励" },
      estimatedDays: { type: Type.STRING, description: "建议的总执行天数" },
      milestones: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            phase: { type: Type.STRING, description: "阶段号，例如：第一阶段" },
            title: { type: Type.STRING, description: "阶段研究主题" },
            timeRange: { type: Type.STRING, description: "本阶段时间段（例如：第1-7天）" },
            content: { type: Type.STRING, description: "本阶段的核心学习任务与需要跨越的知识难点" },
            recommendedResources: { type: Type.ARRAY, items: { type: Type.STRING }, description: "推荐阅读经典之作、优质自学路线或练习方法" },
          },
          required: ["phase", "title", "timeRange", "content", "recommendedResources"],
        },
        description: "制定的4个渐进里程碑阶段",
      },
    },
    required: ["subject", "overview", "estimatedDays", "milestones"],
  };

  try {
    const result = await getGeminiJSON(prompt, schema);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: "规划学习路径失败：" + error.message });
  }
});

// Setup Vite & Static Assets
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
