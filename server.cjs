var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");
var import_dotenv = __toESM(require("dotenv"), 1);
import_dotenv.default.config();
var app = (0, import_express.default)();
var PORT = 3e3;
app.use(import_express.default.json());
var ai = new import_genai.GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build"
    }
  }
});
async function getGeminiJSON(prompt, schema) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        systemInstruction: "You are an expert self-discipline and lifestyle coach. Answer in Chinese (\u7B80\u4F53\u4E2D\u6587). Design inspiring, practical, and highly realistic habits and goals."
      }
    });
    const text = response.text || "{}";
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
}
app.post("/api/diet-advice", async (req, res) => {
  const { meals } = req.body;
  if (!meals || !Array.isArray(meals) || meals.length === 0) {
    return res.status(400).json({ error: "Missing or invalid meals list" });
  }
  const mealSummary = meals.map((m) => `[\u65F6\u6BB5: ${m.period}, \u98DF\u7269: ${m.text}, \u5907\u6CE8: ${m.note || "\u65E0"}]`).join("\n");
  const prompt = `\u5206\u6790\u4EE5\u4E0B\u6211\u4ECA\u5929\u6444\u5165\u7684\u996E\u98DF\uFF0C\u4F30\u7B97\u70ED\u91CF\u3001\u78B3\u6C34\u3001\u86CB\u767D\u8D28\u3001\u8102\u80AA\uFF0C\u7ED9\u51FA\u5065\u5EB7\u8BC4\u5206(0-100)\uFF0C\u5E76\u7ED9\u51FA\u4E2A\u6027\u5316\u7684\u996E\u98DF\u5EFA\u8BAE\u3002
\u5DF2\u6444\u5165\u7684\u9910\u996E\uFF1A
${mealSummary}`;
  const schema = {
    type: import_genai.Type.OBJECT,
    properties: {
      calories: { type: import_genai.Type.INTEGER, description: "\u4ECA\u65E5\u4F30\u7B97\u603B\u70ED\u91CF(kcal)" },
      carb: { type: import_genai.Type.STRING, description: "\u78B3\u6C34\u5316\u5408\u7269\u4F30\u7B97\uFF0C\u4F8B\u5982\uFF1A150g" },
      protein: { type: import_genai.Type.STRING, description: "\u86CB\u767D\u8D28\u4F30\u7B97\uFF0C\u4F8B\u5982\uFF1A75g" },
      fat: { type: import_genai.Type.STRING, description: "\u8102\u80AA\u4F30\u7B97\uFF0C\u4F8B\u5982\uFF1A50g" },
      score: { type: import_genai.Type.INTEGER, description: "\u5065\u5EB7\u5EA6\u8BC4\u5206 (0\u81F3100\u79EF\u5206)" },
      analysis: { type: import_genai.Type.STRING, description: "\u4ECA\u65E5\u81B3\u98DF\u7684\u5168\u9762\u8425\u517B\u70B9\u8BC4\uFF0C\u5305\u62EC\u597D\u7684\u4E00\u9762\u548C\u4E0D\u8DB3\u7684\u4E00\u9762" },
      advice: { type: import_genai.Type.STRING, description: "\u672A\u6765\u7684\u5177\u4F53\u6539\u5584\u5EFA\u8BAE\uFF08\u5982\u4F55\u8C03\u6574\u4E3B\u98DF\u3001\u852C\u83DC\u3001\u8089\u7C7B\u7B49\uFF09" }
    },
    required: ["calories", "carb", "protein", "fat", "score", "analysis", "advice"]
  };
  try {
    const result = await getGeminiJSON(prompt, schema);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "\u83B7\u53D6\u996E\u98DF\u5206\u6790\u5931\u8D25\uFF1A" + error.message });
  }
});
app.post("/api/analyze-diet-image", async (req, res) => {
  const { image, mimeType } = req.body;
  if (!image) {
    return res.status(400).json({ error: "\u56FE\u7247\u6570\u636E\u4E0D\u5B8C\u6574" });
  }
  let base64Data = image;
  if (base64Data.includes(",")) {
    base64Data = base64Data.split(",")[1];
  }
  const prompt = "\u8BF7\u4ED4\u7EC6\u89C2\u5BDF\u548C\u5206\u6790\u8FD9\u5F20\u9910\u996E\u98DF\u7269\u7167\u7247\uFF0C\u8BC6\u522B\u91CC\u9762\u5177\u4F53\u5403\u4E86\u4EC0\u4E48\u3001\u559D\u4E86\u4EC0\u4E48\u3002\u6307\u51FA\u6838\u5FC3\u4E3B\u98DF\u548C\u83DC\u80B4\u3002";
  try {
    const imagePart = {
      inlineData: {
        mimeType: mimeType || "image/jpeg",
        data: base64Data
      }
    };
    const textPart = {
      text: prompt
    };
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [textPart, imagePart],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: import_genai.Type.OBJECT,
          properties: {
            text: { type: import_genai.Type.STRING, description: "\u8BC6\u522B\u5230\u7684\u98DF\u7269/\u9910\u996E\u540D\u79F0\u7EC4\u5408\uFF0C\u7D27\u51D1\u7B80\u7EC3\u3002\u4F8B\uFF1A\u714E\u4E09\u6587\u9C7C\u914D\u85DC\u9EA6\u996D\u4E0E\u70E4\u82A6\u7B0B" },
            period: { type: import_genai.Type.STRING, description: "\u63A8\u8350\u9636\u6BB5\u3002\u53EA\u80FD\u662F\u4EE5\u4E0B\u56DB\u4E2A\u503C\u4E4B\u4E00\uFF1A'\u65E9\u9910', '\u5348\u9910', '\u665A\u9910', '\u52A0\u9910'" },
            note: { type: import_genai.Type.STRING, description: "\u6781\u4E3A\u7B80\u7EC3\u7684\u4F30\u7B97\u5206\u91CF\u4EE5\u53CA\u4E00\u53E5\u8BDD\u5065\u5EB7\u5907\u5FD8\uFF0C\u4F8B\uFF1A\u7EA6450\u5927\u5361\uFF0C\u86CB\u767D\u8D28\u4E30\u5BCC\u3002" }
          },
          required: ["text", "period", "note"]
        },
        systemInstruction: "You are an expert nutritionist. Analyze the food image accurately and return JSON data in Chinese (\u7B80\u4F53\u4E2D\u6587)."
      }
    });
    const result = JSON.parse(response.text || "{}");
    res.json(result);
  } catch (error) {
    console.error("Image analysis error:", error);
    res.status(505).json({ error: "\u56FE\u7247\u667A\u80FD\u5206\u6790\u5931\u8D25\uFF1A" + error.message });
  }
});
app.post("/api/workout-plan", async (req, res) => {
  const { target, level, durationMinutes, gender, age } = req.body;
  const prompt = `\u4E3A\u4E00\u4F4D\u5065\u8EAB\u76EE\u6807\u662F [${target || "\u51CF\u8102\u63A7\u91CD"}]\uFF0C\u8FD0\u52A8\u57FA\u7840\u662F [${level || "\u521D\u5B66\u8005"}]\uFF0C\u9884\u8BA1\u8BAD\u7EC3\u65F6\u957F\u662F [${durationMinutes || 30}\u5206\u949F] \u7684\u7528\u6237\uFF08\u6027\u522B\uFF1A${gender || "\u672A\u6307\u5B9A"}\uFF0C\u5E74\u9F84\uFF1A${age || "25"}\uFF09\uFF0C\u8BBE\u8BA1\u4E00\u4E2A\u9AD8\u6548\u5B89\u5168\u7684\u4E2A\u6027\u5316\u5355\u6B21\u8BAD\u7EC3\u8BA1\u5212\u3002\u8BF7\u5305\u542B\u70ED\u8EAB\u3001\u6B63\u5F0F\u90E8\u5206\u3001\u62C9\u4F38\u653E\u677E\uFF0C\u5E76\u6807\u6CE8\u5177\u4F53\u52A8\u4F5C\u4E0E\u5B89\u5168\u8981\u70B9\u3002`;
  const schema = {
    type: import_genai.Type.OBJECT,
    properties: {
      target: { type: import_genai.Type.STRING },
      totalDuration: { type: import_genai.Type.STRING, description: "\u603B\u9884\u7B97\u65F6\u95F4\uFF0C\u4F8B\u5982: 40\u5206\u949F" },
      warmup: { type: import_genai.Type.STRING, description: "\u70ED\u8EAB\u52A8\u4F5C\u4E0E\u5EFA\u8BAE" },
      mainExercises: {
        type: import_genai.Type.ARRAY,
        items: {
          type: import_genai.Type.OBJECT,
          properties: {
            name: { type: import_genai.Type.STRING, description: "\u8FD0\u52A8\u52A8\u4F5C\u540D\u79F0" },
            sets: { type: import_genai.Type.STRING, description: "\u7EC4\u6570\uFF0C\u6B21\u6570/\u6BCF\u7EC4\uFF0C\u6216\u6301\u7EED\u65F6\u95F4\uFF0C\u4F8B\u5982: 3\u7EC4 x 15\u6B21" },
            rest: { type: import_genai.Type.STRING, description: "\u7EC4\u95F4\u4F11\u606F\u65F6\u95F4\uFF0C\u4F8B\u5982: 60\u79D2" },
            description: { type: import_genai.Type.STRING, description: "\u52A8\u4F5C\u7B80\u8FF0\u548C\u7EC6\u8282\u8981\u70B9" }
          },
          required: ["name", "sets", "rest", "description"]
        },
        description: "\u6B63\u5F0F\u8FD0\u52A8\u5217\u8868"
      },
      cooldown: { type: import_genai.Type.STRING, description: "\u62C9\u4F38\u4E0E\u6574\u7406\u8FD0\u52A8\u6307\u5BFC" },
      safetyNotes: { type: import_genai.Type.STRING, description: "\u4E2A\u6027\u5316\u8FD0\u52A8\u9632\u4F24\u4E0E\u547C\u5438\u3001\u59FF\u6001\u5B89\u5168\u5EFA\u8BAE" }
    },
    required: ["target", "totalDuration", "warmup", "mainExercises", "cooldown", "safetyNotes"]
  };
  try {
    const result = await getGeminiJSON(prompt, schema);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "\u751F\u6210\u8FD0\u52A8\u8BA1\u5212\u5931\u8D25\uFF1A" + error.message });
  }
});
app.post("/api/skill-challenge", async (req, res) => {
  const { interests, completedChallenges } = req.body;
  const interestStr = interests && interests.length > 0 ? interests.join("\u3001") : "\u4EFB\u610F\u751F\u6D3B\u3001\u8DA3\u5473\u6216\u8BA4\u77E5\u6280\u80FD";
  const completedStr = completedChallenges && completedChallenges.length > 0 ? `\u907F\u514D\u63A8\u8350\u4EE5\u4E0B\u5DF2\u5B8C\u6210\u7684\u6311\u6218\uFF1A${completedChallenges.map((c) => c.title).join("\u3001")}` : "";
  const prompt = `\u6839\u636E\u6211\u7684\u5174\u8DA3\u6807\u7B7E [${interestStr}]\uFF0C\u968F\u673A\u63A8\u8350\u4E00\u4E2A\u9002\u5408\u5728\u4ECA\u5929/\u672C\u5468\u5185\u5B8C\u6210\u7684\u65B0\u6280\u80FD\u6216\u597D\u73A9\u7684\u751F\u6D3B\u5192\u9669\u6311\u6218\uFF01\u6311\u6218\u4E0D\u4EC5\u8981\u80FD\u4FDD\u6301\u65B0\u9C9C\u611F\uFF0C\u8FD8\u8981\u5177\u6709\u4E00\u5B9A\u7684\u5B9E\u64CD\u6027\u548C\u81EA\u5F8B\u63D0\u5347\u610F\u4E49\u3002
${completedStr}`;
  const schema = {
    type: import_genai.Type.OBJECT,
    properties: {
      title: { type: import_genai.Type.STRING, description: "\u6311\u6218\u7684\u521B\u610F\u5438\u5F15\u4EBA\u540D\u79F0" },
      category: { type: import_genai.Type.STRING, description: "\u4E8C\u7EA7\u5206\u7C7B\u6807\u7B7E\uFF0C\u4F8B\u5982\uFF1A\u751F\u6D3B\u521B\u9020\u3001\u52A8\u624B\u7814\u7A76\u3001\u8EAB\u5FC3\u5065\u5EB7" },
      estimatedTime: { type: import_genai.Type.STRING, description: "\u9884\u8BA1\u5B8C\u6210\u8017\u65F6" },
      difficulty: { type: import_genai.Type.STRING, description: "\u96BE\u5EA6\u8BC4\u7EA7 (\u65B0\u624B/\u8FDB\u9636/\u4E13\u5BB6)" },
      description: { type: import_genai.Type.STRING, description: "\u7B80\u77ED\u52FE\u52D2\u8FD9\u662F\u4E00\u4E2A\u600E\u6837\u7684\u6311\u6218\uFF0C\u5E26\u6765\u4E86\u4EC0\u4E48\u610F\u4E49" },
      steps: {
        type: import_genai.Type.ARRAY,
        items: { type: import_genai.Type.STRING },
        description: "\u660E\u786E\u5177\u4F53\u7684\u8FBE\u6210\u6307\u5357\u6B65\u9AA4"
      },
      rewardMindset: { type: import_genai.Type.STRING, description: "\u5B8C\u6210\u540E\u7684\u6536\u83B7\uFF08\u4E3A\u4EC0\u4E48\u503C\u5F97\u4E00\u8BD5\uFF0C\u57F9\u517B\u4E86\u4F55\u79CD\u81EA\u5F8B\u6216\u8BA4\u77E5\uFF09" }
    },
    required: ["title", "category", "estimatedTime", "difficulty", "description", "steps", "rewardMindset"]
  };
  try {
    const result = await getGeminiJSON(prompt, schema);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "\u83B7\u53D6\u6311\u6218\u63A8\u8350\u5931\u8D25\uFF1A" + error.message });
  }
});
app.post("/api/learning-path", async (req, res) => {
  const { subject, days } = req.body;
  if (!subject) {
    return res.status(400).json({ error: "Missing learning subject" });
  }
  const prompt = `\u6211\u60F3\u957F\u671F\u7EC8\u8EAB\u5B66\u4E60\u8FD9\u4E00\u9879\u6838\u5FC3\u77E5\u8BC6\u9886\u57DF\uFF1A[${subject}]\u3002
\u8BF7\u4E3A\u6211\u89C4\u5212\u4E00\u4E2A\u957F\u671F\u7684\u91CC\u7A0B\u7891\u5B66\u4E60\u8DEF\u5F84\uFF08\u5206\u671F\u5C55\u5F00\uFF0C\u603B\u5171\u5236\u5B9A 4 \u4E2A\u9636\u6BB5\uFF0C\u603B\u8017\u65F6\u5927\u7EA6 ${days || 30} \u5929\uFF09\u3002\u6BCF\u4E2A\u9636\u6BB5\u5E94\u6709\u660E\u786E\u7684\u9605\u8BFB\u91CD\u70B9\u3001\u6838\u5FC3\u6982\u5FF5\u3001\u9700\u8981\u8BB0\u5F55\u5361\u7247\u7684\u77E5\u8BC6\u8981\u70B9\uFF0C\u4EE5\u53CA\u63A8\u8350\u7684\u5B66\u4E60\u8D44\u6599\u3002`;
  const schema = {
    type: import_genai.Type.OBJECT,
    properties: {
      subject: { type: import_genai.Type.STRING },
      overview: { type: import_genai.Type.STRING, description: "\u8BE5\u5B66\u79D1/\u6280\u80FD\u7684\u957F\u671F\u8BA4\u77E5\u5347\u7EA7\u80CC\u666F\u548C\u81EA\u6211\u6210\u957F\u6FC0\u52B1" },
      estimatedDays: { type: import_genai.Type.STRING, description: "\u5EFA\u8BAE\u7684\u603B\u6267\u884C\u5929\u6570" },
      milestones: {
        type: import_genai.Type.ARRAY,
        items: {
          type: import_genai.Type.OBJECT,
          properties: {
            phase: { type: import_genai.Type.STRING, description: "\u9636\u6BB5\u53F7\uFF0C\u4F8B\u5982\uFF1A\u7B2C\u4E00\u9636\u6BB5" },
            title: { type: import_genai.Type.STRING, description: "\u9636\u6BB5\u7814\u7A76\u4E3B\u9898" },
            timeRange: { type: import_genai.Type.STRING, description: "\u672C\u9636\u6BB5\u65F6\u95F4\u6BB5\uFF08\u4F8B\u5982\uFF1A\u7B2C1-7\u5929\uFF09" },
            content: { type: import_genai.Type.STRING, description: "\u672C\u9636\u6BB5\u7684\u6838\u5FC3\u5B66\u4E60\u4EFB\u52A1\u4E0E\u9700\u8981\u8DE8\u8D8A\u7684\u77E5\u8BC6\u96BE\u70B9" },
            recommendedResources: { type: import_genai.Type.ARRAY, items: { type: import_genai.Type.STRING }, description: "\u63A8\u8350\u9605\u8BFB\u7ECF\u5178\u4E4B\u4F5C\u3001\u4F18\u8D28\u81EA\u5B66\u8DEF\u7EBF\u6216\u7EC3\u4E60\u65B9\u6CD5" }
          },
          required: ["phase", "title", "timeRange", "content", "recommendedResources"]
        },
        description: "\u5236\u5B9A\u76844\u4E2A\u6E10\u8FDB\u91CC\u7A0B\u7891\u9636\u6BB5"
      }
    },
    required: ["subject", "overview", "estimatedDays", "milestones"]
  };
  try {
    const result = await getGeminiJSON(prompt, schema);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "\u89C4\u5212\u5B66\u4E60\u8DEF\u5F84\u5931\u8D25\uFF1A" + error.message });
  }
});
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
