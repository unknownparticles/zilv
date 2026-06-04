export interface Env {
  KV: KVNamespace;
  DEFAULT_AI_PROVIDER?: string;
  
  // API Keys
  SILICONFLOW_API_KEY?: string;
  MINIMAX_API_KEY?: string;
  ZHIPU_API_KEY?: string;
  DEEPSEEK_API_KEY?: string;
  KIMI_API_KEY?: string;

  // Models
  MODEL_SILICONFLOW?: string;
  MODEL_SILICONFLOW_VISION?: string;
  MODEL_MINIMAX?: string;
  MODEL_MINIMAX_VISION?: string;
  MODEL_GLM?: string;
  MODEL_GLM_VISION?: string;
  MODEL_DEEPSEEK?: string;
  MODEL_KIMI?: string;
  MODEL_KIMI_VISION?: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-AI-Provider",
};

// SHA-256 helper for passwords
async function sha256(message: string) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

// Check authorization and return username
async function getAuthorizedUser(request: Request, env: Env): Promise<string | null> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.substring(7);
  const username = await env.KV.get(`session:${token}`);
  return username;
}

// Initial default invite codes if none exists
async function getInviteCodes(env: Env) {
  const raw = await env.KV.get("config:invite_codes");
  if (!raw) {
    const defaultCodes = [
      { code: "AISTUDIO2026", maxUses: 10, usedCount: 0 },
      { code: "SELFDISCIPLINE", maxUses: 5, usedCount: 0 },
      { code: "WELCOME", maxUses: 100, usedCount: 0 }
    ];
    await env.KV.put("config:invite_codes", JSON.stringify(defaultCodes));
    return defaultCodes;
  }
  return JSON.parse(raw);
}

// Helper to calculate date string array between two dates (inclusive)
function getDatesInRange(startStr: string, endStr: string): string[] {
  const dates: string[] = [];
  const start = new Date(startStr);
  const end = new Date(endStr);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return [];
  }
  
  const current = new Date(start);
  while (current <= end) {
    dates.push(current.toISOString().split("T")[0]);
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // Handle CORS preflight requests
    if (request.method === "OPTIONS") {
      return new Response(null, { 
        status: 204, 
        headers: corsHeaders 
      });
    }

    try {
      // 1. Auth Routing
      if (path === "/api/auth/register" && request.method === "POST") {
        const { username, password, nickname, inviteCode } = await request.json() as any;

        if (!username || !password || !inviteCode) {
          return new Response(JSON.stringify({ error: "账号、密码和邀请码必填哦！" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        const normalizedUsername = username.trim().toLowerCase();

        // Check if user already exists
        const existingUser = await env.KV.get(`user:${normalizedUsername}`);
        if (existingUser) {
          return new Response(JSON.stringify({ error: "该用户名已被占用，请更换一个。" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        // Validate invite code
        const inviteCodes = await getInviteCodes(env);
        const codeIdx = inviteCodes.findIndex((c: any) => c.code.toUpperCase() === inviteCode.trim().toUpperCase());
        
        if (codeIdx === -1) {
          return new Response(JSON.stringify({ error: "邀请码无效，请检查输入。" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        const codeRecord = inviteCodes[codeIdx];
        if (codeRecord.usedCount >= codeRecord.maxUses) {
          return new Response(JSON.stringify({ error: "该邀请码的使用次数已达上限。" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        // Increment invite code usage
        inviteCodes[codeIdx].usedCount += 1;
        await env.KV.put("config:invite_codes", JSON.stringify(inviteCodes));

        // Save new user
        const passwordHash = await sha256(password);
        const userData = {
          username: normalizedUsername,
          passwordHash,
          nickname: nickname ? nickname.trim() : username,
          bindingId: null,
          createdAt: new Date().toISOString()
        };
        await env.KV.put(`user:${normalizedUsername}`, JSON.stringify(userData));

        return new Response(JSON.stringify({ message: "注册成功，立即登录吧！" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      if (path === "/api/auth/login" && request.method === "POST") {
        const { username, password } = await request.json() as any;

        if (!username || !password) {
          return new Response(JSON.stringify({ error: "请输入账号和密码！" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        const normalizedUsername = username.trim().toLowerCase();
        const userRaw = await env.KV.get(`user:${normalizedUsername}`);
        if (!userRaw) {
          return new Response(JSON.stringify({ error: "账号或密码错误，请重试。" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        const user = JSON.parse(userRaw);
        const inputHash = await sha256(password);

        if (user.passwordHash !== inputHash) {
          return new Response(JSON.stringify({ error: "账号或密码错误，请重试。" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        // Generate session token
        const token = crypto.randomUUID();
        // Expire in 7 days
        await env.KV.put(`session:${token}`, normalizedUsername, { expirationTtl: 7 * 24 * 3600 });

        return new Response(JSON.stringify({
          token,
          username: user.username,
          nickname: user.nickname,
          bindingId: user.bindingId || null,
          id: `SLF-CF-${Math.floor(1000 + Math.random() * 9000)}`
        }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // 2. Data Sync Routing (Authenticated)
      if (path === "/api/sync/upload" && request.method === "POST") {
        const username = await getAuthorizedUser(request, env);
        if (!username) {
          return new Response(JSON.stringify({ error: "未登录或登录已过期，请重新登录。" }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        const body = await request.json();
        await env.KV.put(`data:${username}`, JSON.stringify(body));

        return new Response(JSON.stringify({ message: "数据成功上传备份到云端！" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      if (path === "/api/sync/download" && request.method === "GET") {
        const username = await getAuthorizedUser(request, env);
        if (!username) {
          return new Response(JSON.stringify({ error: "未登录或登录已过期，请重新登录。" }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        const data = await env.KV.get(`data:${username}`);
        return new Response(data || JSON.stringify({}), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // ==========================================
      // 3. User Bonding (Wagering Streak System)
      // ==========================================
      if (path === "/api/binding/invite" && request.method === "POST") {
        const username = await getAuthorizedUser(request, env);
        if (!username) {
          return new Response(JSON.stringify({ error: "未登录，请先登录。" }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        const { friendUsername, target, duration, deposit } = await request.json() as any;
        const normalizedFriend = friendUsername.trim().toLowerCase();

        if (normalizedFriend === username) {
          return new Response(JSON.stringify({ error: "您不能和自己进行打卡对赌绑定哦！" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        const friendRaw = await env.KV.get(`user:${normalizedFriend}`);
        if (!friendRaw) {
          return new Response(JSON.stringify({ error: `用户 "${friendUsername}" 不存在，请核对后重试。` }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        const meRaw = await env.KV.get(`user:${username}`);
        const me = JSON.parse(meRaw!);
        const friend = JSON.parse(friendRaw);

        if (me.bindingId) {
          return new Response(JSON.stringify({ error: "您当前已绑定了对赌关系，需要等当前对赌彻底结束或到期才能开启新的对赌。" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        if (friend.bindingId) {
          return new Response(JSON.stringify({ error: `对方用户当前已经有活跃的绑定对赌了。` }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        // Push invite into friend invites queue
        const rawInvites = await env.KV.get(`invites:${normalizedFriend}`);
        const invites = rawInvites ? JSON.parse(rawInvites) : [];
        
        // Remove duplicate invites from same user if any
        const filteredInvites = invites.filter((inv: any) => inv.from !== username);
        
        filteredInvites.push({
          id: crypto.randomUUID(),
          from: username,
          target: target || "每日至少打卡一次",
          duration: duration || "week",
          deposit: Number(deposit) || 10,
          createdAt: new Date().toISOString()
        });

        await env.KV.put(`invites:${normalizedFriend}`, JSON.stringify(filteredInvites));

        return new Response(JSON.stringify({ message: "对赌绑定邀请已发送给对方！" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      if (path === "/api/binding/invites" && request.method === "GET") {
        const username = await getAuthorizedUser(request, env);
        if (!username) {
          return new Response(JSON.stringify({ error: "未登录。" }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        const rawInvites = await env.KV.get(`invites:${username}`);
        return new Response(rawInvites || "[]", {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      if (path === "/api/binding/accept" && request.method === "POST") {
        const username = await getAuthorizedUser(request, env);
        if (!username) {
          return new Response(JSON.stringify({ error: "未登录。" }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        const { inviteId } = await request.json() as any;
        const rawInvites = await env.KV.get(`invites:${username}`);
        if (!rawInvites) {
          return new Response(JSON.stringify({ error: "没有任何待处理的邀请。" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        const invites = JSON.parse(rawInvites);
        const inviteIdx = invites.findIndex((inv: any) => inv.id === inviteId);
        if (inviteIdx === -1) {
          return new Response(JSON.stringify({ error: "邀请失效或不存在。" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        const invite = invites[inviteIdx];
        
        // Final sanity checks
        const userA = invite.from;
        const userB = username;

        const userARaw = await env.KV.get(`user:${userA}`);
        const userBRaw = await env.KV.get(`user:${userB}`);

        const uA = JSON.parse(userARaw!);
        const uB = JSON.parse(userBRaw!);

        if (uA.bindingId || uB.bindingId) {
          // Clean invitation list first
          invites.splice(inviteIdx, 1);
          await env.KV.put(`invites:${username}`, JSON.stringify(invites));
          return new Response(JSON.stringify({ error: "您或对方当前已经开启了绑定，邀请已自动作废。" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        let totalDays = 7;
        if (invite.duration === "month") totalDays = 30;
        else if (invite.duration === "halfYear") totalDays = 180;
        else if (invite.duration === "year") totalDays = 365;

        const bindingId = crypto.randomUUID();
        const todayStr = new Date().toISOString().split("T")[0];

        const bindingRecord = {
          id: bindingId,
          userA,
          userB,
          target: invite.target,
          duration: invite.duration,
          totalDays,
          startDate: todayStr,
          depositTotal: invite.deposit,
          depositRemaining: invite.deposit,
          streakDays: 0,
          status: "active",
          rageModeRemainingDays: 0,
          rageModeTargetDays: 0,
          missedDaysCount: 0,
          history: {},
          lastSyncDate: todayStr
        };

        // Save binding record
        await env.KV.put(`binding:${bindingId}`, JSON.stringify(bindingRecord));

        // Update users bindingId references
        uA.bindingId = bindingId;
        uB.bindingId = bindingId;

        await env.KV.put(`user:${userA}`, JSON.stringify(uA));
        await env.KV.put(`user:${userB}`, JSON.stringify(uB));

        // Clean up invites list
        invites.splice(inviteIdx, 1);
        await env.KV.put(`invites:${username}`, JSON.stringify(invites));

        return new Response(JSON.stringify({ message: "接受邀请，对赌启动！", bindingId }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      if (path === "/api/binding/reject" && request.method === "POST") {
        const username = await getAuthorizedUser(request, env);
        if (!username) {
          return new Response(JSON.stringify({ error: "未登录。" }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        const { inviteId } = await request.json() as any;
        const rawInvites = await env.KV.get(`invites:${username}`);
        if (rawInvites) {
          const invites = JSON.parse(rawInvites);
          const updatedInvites = invites.filter((inv: any) => inv.id !== inviteId);
          await env.KV.put(`invites:${username}`, JSON.stringify(updatedInvites));
        }

        return new Response(JSON.stringify({ message: "已拒绝邀请。" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      if (path === "/api/binding/status" && request.method === "GET") {
        const username = await getAuthorizedUser(request, env);
        if (!username) {
          return new Response(JSON.stringify({ error: "未登录。" }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        const userRaw = await env.KV.get(`user:${username}`);
        const user = JSON.parse(userRaw!);
        if (!user.bindingId) {
          return new Response(JSON.stringify({ hasBinding: false }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        const bindingRaw = await env.KV.get(`binding:${user.bindingId}`);
        if (!bindingRaw) {
          // Clear dangling reference
          user.bindingId = null;
          await env.KV.put(`user:${username}`, JSON.stringify(user));
          return new Response(JSON.stringify({ hasBinding: false }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        const binding = JSON.parse(bindingRaw);
        
        if (binding.status === "completed") {
          return new Response(JSON.stringify({ hasBinding: true, ...binding }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        // ----------------------------------------------------
        // 对赌状态核算算法 (Calculate daily penalties)
        // ----------------------------------------------------
        const todayStr = new Date().toISOString().split("T")[0];
        
        // Collect dates to check: from binding.lastSyncDate to yesterday
        // Note: Today's check-ins are not final yet, so we check up to yesterday
        const yesterdayObj = new Date();
        yesterdayObj.setDate(yesterdayObj.getDate() - 1);
        const yesterdayStr = yesterdayObj.toISOString().split("T")[0];
        
        const datesToCheck = getDatesInRange(binding.lastSyncDate, yesterdayStr);

        if (datesToCheck.length > 0) {
          const userADataRaw = await env.KV.get(`data:${binding.userA}`) || "{}";
          const userBDataRaw = await env.KV.get(`data:${binding.userB}`) || "{}";
          
          const uAData = JSON.parse(userADataRaw);
          const uBData = JSON.parse(userBDataRaw);

          const checkUserCheckedIn = (data: any, date: string): boolean => {
            const sleeps = data.sleepRecords || [];
            const meals = data.mealItems || [];
            const workouts = data.workoutRecords || [];
            const studies = data.studyRecords || [];
            
            // Check if any check-in exists on this specific date
            const hasSleep = sleeps.some((s: any) => s.date === date);
            const hasMeal = meals.some((m: any) => m.date === date);
            const hasWorkout = workouts.some((w: any) => w.date === date);
            const hasStudy = studies.some((st: any) => st.date === date);
            
            return hasSleep || hasMeal || hasWorkout || hasStudy;
          };

          const dailyPenalty = binding.depositTotal / binding.totalDays;

          for (const dStr of datesToCheck) {
            // Skip already marked processed dates
            if (binding.history[dStr] && binding.history[dStr].processed) {
              continue;
            }

            const presentA = checkUserCheckedIn(uAData, dStr);
            const presentB = checkUserCheckedIn(uBData, dStr);
            const allPresent = presentA && presentB;

            binding.history[dStr] = {
              userA: presentA,
              userB: presentB,
              processed: true
            };

            if (allPresent) {
              // Both checked-in successfully
              if (binding.rageModeRemainingDays > 0) {
                // In Rage Mode, daily streak deducts rage mode countdown
                binding.rageModeRemainingDays = Math.max(0, binding.rageModeRemainingDays - 1);
                if (binding.rageModeRemainingDays === 0) {
                  // Rage mode CHALLENGE SUCCESSFUL!
                  // 1. Streak is recovered
                  binding.streakDays = binding.rageModeTargetDays; 
                  // 2. Refund penalized deposit
                  binding.depositRemaining = Math.min(binding.depositTotal, binding.depositRemaining + (dailyPenalty * binding.missedDaysCount));
                  // 3. Reset stats
                  binding.missedDaysCount = 0;
                  binding.rageModeTargetDays = 0;
                  binding.status = "active";
                }
              } else {
                binding.streakDays += 1;
              }
            } else {
              // At least one person missed the check-in!
              binding.streakDays = 0; // Streak broken

              if (binding.rageModeRemainingDays > 0) {
                // If miss check-in during Rage Mode, target days increase!
                binding.missedDaysCount += 1;
                // penalty extended: missedDaysCount * 7
                binding.rageModeTargetDays = binding.missedDaysCount * 7;
                binding.rageModeRemainingDays = binding.rageModeTargetDays;
              } else {
                // Under normal mode, deduct deposit
                binding.depositRemaining = Math.max(0, binding.depositRemaining - dailyPenalty);
                binding.missedDaysCount += 1;
                
                if (binding.depositRemaining <= 0) {
                  binding.status = "completed"; // Terminated since funds run out
                }
              }
            }
          }

          binding.lastSyncDate = todayStr; // Update sync check anchor date
          await env.KV.put(`binding:${user.bindingId}`, JSON.stringify(binding));
        }

        // Fetch user's nicknames for UI
        const rawUA = await env.KV.get(`user:${binding.userA}`);
        const rawUB = await env.KV.get(`user:${binding.userB}`);
        const nickA = rawUA ? JSON.parse(rawUA).nickname : binding.userA;
        const nickB = rawUB ? JSON.parse(rawUB).nickname : binding.userB;

        // Also check if both users have checked-in *today* (realtime preview)
        const userADataRaw = await env.KV.get(`data:${binding.userA}`) || "{}";
        const userBDataRaw = await env.KV.get(`data:${binding.userB}`) || "{}";
        const uAData = JSON.parse(userADataRaw);
        const uBData = JSON.parse(userBDataRaw);

        const checkUserCheckedIn = (data: any, date: string): boolean => {
          const sleeps = data.sleepRecords || [];
          const meals = data.mealItems || [];
          const workouts = data.workoutRecords || [];
          const studies = data.studyRecords || [];
          return sleeps.some((s: any) => s.date === date) || meals.some((m: any) => m.date === date) || workouts.some((w: any) => w.date === date) || studies.some((st: any) => st.date === date);
        };

        const todayCheckedInA = checkUserCheckedIn(uAData, todayStr);
        const todayCheckedInB = checkUserCheckedIn(uBData, todayStr);

        return new Response(JSON.stringify({
          hasBinding: true,
          ...binding,
          userANickname: nickA,
          userBNickname: nickB,
          todayCheckedInA,
          todayCheckedInB
        }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      if (path === "/api/binding/rage-mode" && request.method === "POST") {
        const username = await getAuthorizedUser(request, env);
        if (!username) {
          return new Response(JSON.stringify({ error: "未登录。" }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        const userRaw = await env.KV.get(`user:${username}`);
        const user = JSON.parse(userRaw!);
        if (!user.bindingId) {
          return new Response(JSON.stringify({ error: "您还没有绑定任何对赌。" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        const bindingRaw = await env.KV.get(`binding:${user.bindingId}`);
        const binding = JSON.parse(bindingRaw!);

        if (binding.status === "completed") {
          return new Response(JSON.stringify({ error: "对赌已过期或结束。" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        if (binding.streakDays > 0 || binding.missedDaysCount === 0) {
          return new Response(JSON.stringify({ error: "您的自律火花正常，不需要开启狂暴自愈模式。" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        if (binding.rageModeRemainingDays > 0) {
          return new Response(JSON.stringify({ error: "狂暴自愈挑战模式已经处于开启状态了。" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        // Initialize Rage Mode Challenge
        binding.rageModeTargetDays = binding.missedDaysCount * 7;
        binding.rageModeRemainingDays = binding.rageModeTargetDays;
        
        await env.KV.put(`binding:${user.bindingId}`, JSON.stringify(binding));

        return new Response(JSON.stringify({ message: `🔥 狂暴魔鬼模式启动成功！在接下来的 ${binding.rageModeTargetDays} 天里全勤坚持以取回保证金！`, rageModeTargetDays: binding.rageModeTargetDays }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // ==========================================
      // 4. AI proxy routes (Authenticated)
      // ==========================================
      const provider = request.headers.get("X-AI-Provider") || env.DEFAULT_AI_PROVIDER || "SiliconFlow";
      
      let apiKey = "";
      let baseURL = "";
      let model = "";
      let isVision = false;

      if (path === "/api/analyze-diet-image") {
        isVision = true;
      }

      if (provider === "SiliconFlow") {
        apiKey = env.SILICONFLOW_API_KEY || "";
        baseURL = "https://api.siliconflow.cn/v1/chat/completions";
        model = isVision 
          ? (env.MODEL_SILICONFLOW_VISION || "Pro/moonshotai/Kimi-K2.5")
          : (env.MODEL_SILICONFLOW || "deepseek-ai/DeepSeek-V4-Flash");
      } else if (provider === "Minimax") {
        apiKey = env.MINIMAX_API_KEY || "";
        baseURL = "https://api.minimax.chat/v1/chat/completions";
        model = isVision
          ? (env.MODEL_MINIMAX_VISION || "abab6.5s-chat")
          : (env.MODEL_MINIMAX || "abab6.5g-chat");
      } else if (provider === "GLM") {
        apiKey = env.ZHIPU_API_KEY || "";
        baseURL = "https://open.bigmodel.cn/api/paas/v4/chat/completions";
        model = isVision
          ? (env.MODEL_GLM_VISION || "glm-4v-flash")
          : (env.MODEL_GLM || "glm-4-flash");
      } else if (provider === "DeepSeek") {
        apiKey = env.DEEPSEEK_API_KEY || "";
        baseURL = "https://api.deepseek.com/chat/completions";
        model = env.MODEL_DEEPSEEK || "deepseek-chat";
        if (isVision) {
          // Fallback to Kimi-K2.5 on SiliconFlow for Vision requests under DeepSeek provider
          apiKey = env.SILICONFLOW_API_KEY || "";
          baseURL = "https://api.siliconflow.cn/v1/chat/completions";
          model = env.MODEL_SILICONFLOW_VISION || "Pro/moonshotai/Kimi-K2.5";
        }
      } else if (provider === "Kimi") {
        apiKey = env.KIMI_API_KEY || "";
        baseURL = "https://api.moonshot.cn/v1/chat/completions";
        model = isVision
          ? (env.MODEL_KIMI_VISION || "moonshot-v1-8k-vision-preview")
          : (env.MODEL_KIMI || "moonshot-v1-8k");
      }

      if (!apiKey) {
        return new Response(JSON.stringify({ error: `Worker 后端未配置 ${provider} 的 API Key。` }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // Check if user is currently under Rage Mode
      const authenticatedUser = await getAuthorizedUser(request, env);
      let isRageModeEnabled = false;
      let rageLeft = 0;
      if (authenticatedUser) {
        const userMetaRaw = await env.KV.get(`user:${authenticatedUser}`);
        if (userMetaRaw) {
          const uMeta = JSON.parse(userMetaRaw);
          if (uMeta.bindingId) {
            const bindMetaRaw = await env.KV.get(`binding:${uMeta.bindingId}`);
            if (bindMetaRaw) {
              const bMeta = JSON.parse(bindMetaRaw);
              if (bMeta.rageModeRemainingDays > 0) {
                isRageModeEnabled = true;
                rageLeft = bMeta.rageModeRemainingDays;
              }
            }
          }
        }
      }

      let systemInstruction = "You are a lifestyle and self-discipline coach. Answer in Chinese. Return valid JSON only.";
      
      // Inject 1.2x Rage mode scaling warning to prompt system instructions
      if (isRageModeEnabled && !isVision) {
        systemInstruction += `\n【⚠️警告：用户当前处于 AI 狂暴自愈自律模式下（挑战剩余 ${rageLeft} 天）。请你扮演极为严苛、魔鬼冷酷的自律魔鬼教练。你制定的饮食目标、运动动作强度、学习路径复杂度和挑战步骤难度必须比往常增加 1.2 倍！加大训练量或时长，字句语气充满绝对性鞭策。】`;
      }

      let prompt = "";
      let jsonSchemaDescription = "";

      // 3.1 Setup API Prompting structures
      if (path === "/api/diet-advice") {
        const { meals } = await request.json() as any;
        const mealSummary = meals.map((m: any) => `[时间: ${m.period}, 食物: ${m.text}, 备注: ${m.note || "无"}]`).join("\n");
        prompt = `分析以下我今天摄入的饮食，估算热量、碳水、蛋白质、脂肪，给出健康评分(0-100)，并给出个性化的饮食建议。\n今日饮食清单：\n${mealSummary}`;
        if (!isRageModeEnabled) {
          systemInstruction = "You are an expert self-discipline and lifestyle coach. Answer in Chinese (简体中文). Design inspiring, practical, and highly realistic habits and goals.";
        }
        jsonSchemaDescription = `必须返回纯 JSON 格式数据。格式必须为：
{
  "calories": 450, // 估算总热量 (必须是纯整数，单位大卡 kcal，方便报表统计)
  "carb": "120g", // 碳水化合物估算 (必须是格式如 '数字g'，例如 '120g'，不得有其他字符)
  "protein": "65g", // 蛋白质估算 (必须是格式如 '数字g'，例如 '65g'，不得有其他字符)
  "fat": "40g", // 脂肪估算 (必须是格式如 '数字g'，例如 '40g'，不得有其他字符)
  "score": 85, // 健康度评分 (必须是0至100之间的整数)
  "analysis": "这里是饮食点评分析...",
  "advice": "这里是未来的改善建议..."
}`;
      } else if (path === "/api/workout-plan") {
        const { target, level, durationMinutes, gender, age } = await request.json() as any;
        prompt = `为一位健身目标是 [${target || "减脂控重"}]，运动基础是 [${level || "初学者"}]，预计训练时长是 [${durationMinutes || 30}分钟] 的用户（性别：${gender || "未指定"}，年龄：${age || "25"}），设计一个高效安全的个性化单次训练计划。请包含热身、正式部分、拉伸放松，并标注具体动作与安全要点。`;
        if (!isRageModeEnabled) {
          systemInstruction = "You are a self-discipline exercise planner. Design inspiring, safe, and realistic workouts. Return responses in Chinese.";
        }
        jsonSchemaDescription = `必须返回纯 JSON 格式数据。格式必须为：
{
  "target": "减脂控重",
  "totalDuration": "30分钟",
  "totalDurationMinutes": 30, // 运动预计总时长 (必须是纯整数数字，单位分钟，方便报表统计)
  "estimatedCalories": 240, // 运动预计消耗热量 (必须是纯整数数字，单位大卡 kcal，方便报表统计)
  "warmup": "这里是热身动作与建议...",
  "mainExercises": [
    {
      "name": "哑铃深蹲",
      "sets": "3组 x 15次",
      "rest": "60秒",
      "description": "动作细节..."
    }
  ],
  "cooldown": "这里是拉伸与放松指导...",
  "safetyNotes": "这里是个性化运动防伤与姿态安全建议..."
}`;
      } else if (path === "/api/skill-challenge") {
        const { interests, completedChallenges } = await request.json() as any;
        const interestStr = interests && interests.length > 0 ? interests.join("、") : "任意生活、趣味或认知技能";
        const completedStr = completedChallenges && completedChallenges.length > 0 ? `避免推荐以下已完成的挑战：${completedChallenges.map((c: any) => c.title).join("、")}` : "";
        prompt = `根据我的兴趣标签 [${interestStr}]，随机推荐一个适合在今天/本周内完成的新技能或好玩的生活冒险挑战！挑战不仅要能保持新鲜感，还要具有一定的实操性和自律提升意义。\n${completedStr}`;
        if (!isRageModeEnabled) {
          systemInstruction = "You are a lifestyle challenge coach. Challenge the user with practical, fun, and self-improving habits. Return responses in Chinese.";
        }
        jsonSchemaDescription = `必须返回纯 JSON 格式数据。格式必须为：
{
  "title": "手冲咖啡大师挑战",
  "category": "生活创造",
  "estimatedTime": "15分钟",
  "difficulty": "新手",
  "description": "为什么要尝试这个挑战，带来什么意义...",
  "steps": [
    "第一步说明...",
    "第二步说明..."
  ],
  "rewardMindset": "挑战成功后的自律认知收获..."
}`;
      } else if (path === "/api/learning-path") {
        const { subject, days } = await request.json() as any;
        prompt = `我想长期终身学习这一项核心知识领域：[${subject}]。
        请为我规划一个长期的里程碑学习路径（分期展开，总共制定 4 个阶段，总耗时大约 ${days || 30} 天）。每个阶段应有明确的阅读重点、核心概念、需要记录卡片的知识要点，以及推荐的学习资料。`;
        if (!isRageModeEnabled) {
          systemInstruction = "You are a professional academic curriculum developer. Break complex topics down logically. Return responses in Chinese.";
        }
        jsonSchemaDescription = `必须返回纯 JSON 格式数据。格式必须为：
{
  "subject": "学习的主题",
  "overview": "该领域学习认知背景和激励...",
  "estimatedDays": "30天",
  "totalDays": 30, // 计划学习总天数 (必须是纯整数数字，方便报表统计)
  "milestonesCount": 4, // 计划阶段总数量 (必须是纯整数数字，方便报表统计)
  "milestones": [
    {
      "phase": "第一阶段",
      "title": "阶段研究主题",
      "timeRange": "第1-7天",
      "content": "学习的核心任务和难点...",
      "recommendedResources": ["参考资料1", "参考资料2"]
    }
  ]
}`;
      } else if (path === "/api/analyze-diet-image") {
        const { image, mimeType } = await request.json() as any;
        if (!image) {
          return new Response(JSON.stringify({ error: "图片数据不完整！" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }
        
        let base64Data = image;
        if (base64Data.includes(",")) {
          base64Data = base64Data.split(",")[1];
        }

        systemInstruction = "You are an expert nutritionist. Analyze the food image accurately and return JSON data in Chinese (简体中文).";
        jsonSchemaDescription = `你必须仔细观察和分析这张餐饮食物照片，识别里面具体吃了什么、微量估算分量，返回纯 JSON 数据。格式必须为：
{
  "text": "识别到的食物名称组合。例：煎三文鱼配藜麦饭与烤芦笋",
  "period": "推荐餐次。只能是以下四个值之一：'早餐', '午餐', '晚餐', '加餐'",
  "note": "估算分量以及一句健康备忘。例：约450大卡，富含优质蛋白与不饱和脂肪酸。",
  "calories": 450, // 估算热量 (必须是纯整数数字，单位大卡 kcal，方便报表统计)
  "carb": "45g", // 碳水化合物估算 (必须是格式如 '数字g'，例如 '45g'，方便报表统计)
  "protein": "35g", // 蛋白质估算 (必须是格式如 '数字g'，例如 '35g'，方便报表统计)
  "fat": "15g" // 脂肪估算 (必须是格式如 '数字g'，例如 '15g'，方便报表统计)
}`;

        // 3.2 vision API formatting for OpenAI compatibility
        const messagePayload = {
          model: model,
          messages: [
            {
              role: "system",
              content: `${systemInstruction}\n${jsonSchemaDescription}`
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "请仔细观察并识别这张图片里的食物，并填充返回对应的 JSON。"
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:${mimeType || "image/jpeg"};base64,${base64Data}`
                  }
                }
              ]
            }
          ],
          response_format: { type: "json_object" }
        };

        const response = await fetch(baseURL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
          },
          body: JSON.stringify(messagePayload)
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`AI Gateway error: ${response.status} - ${errText}`);
        }

        const data = await response.json() as any;
        let replyText = data.choices?.[0]?.message?.content || "{}";
        if (replyText.startsWith("```json")) {
          replyText = replyText.replace(/^```json\s*/, "").replace(/\s*```$/, "");
        } else if (replyText.startsWith("```")) {
          replyText = replyText.replace(/^```\s*/, "").replace(/\s*```$/, "");
        }

        return new Response(replyText, {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // 3.3 Make Text chat API call (for all prompt templates except vision)
      const messagePayload = {
        model: model,
        messages: [
          {
            role: "system",
            content: `${systemInstruction}\n你必须以纯 JSON 对象格式回复，不带任何 Markdown 格式。格式 Schema：\n${jsonSchemaDescription}`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" }
      };

      const response = await fetch(baseURL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify(messagePayload)
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`AI Gateway error: ${response.status} - ${errText}`);
      }

      const data = await response.json() as any;
      let replyText = data.choices?.[0]?.message?.content || "{}";
      
      if (replyText.startsWith("```json")) {
        replyText = replyText.replace(/^```json\s*/, "").replace(/\s*```$/, "");
      } else if (replyText.startsWith("```")) {
        replyText = replyText.replace(/^```\s*/, "").replace(/\s*```$/, "");
      }

      return new Response(replyText, {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });

    } catch (error: any) {
      console.error(error);
      return new Response(JSON.stringify({ error: error.message || "后端接口运行异常，请重试。" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
  }
};
