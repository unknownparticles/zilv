# 自律修行管家 🏆 (PWA + Cloudflare Workers Cloud Edition)

这是一个运行在浏览器中的自律与生活习惯养成管家，支持离线运行 (PWA)、可一键发布至 GitHub Pages，并配合 Cloudflare Workers 实现低成本/零成本的云端同步和多 AI 服务商 API 代理。

---

## 🌟 核心亮点

- **PWA (渐进式 Web 应用) 支持**：支持离线缓存，并可在移动端与桌面端“添加至主屏幕”作为原生 App 般体验。
- **云端与本地双模式**：
  - **单机模式**：直接利用浏览器 LocalStorage，免去任何后端配置。
  - **云端模式**：配置 Cloudflare Worker API 地址后，自动切换为云端登录、注册与自动多端备份同步。
- **邀请码限额注册**：注册采用邀请激活码限制，且可在 Cloudflare KV 中动态为每个邀请码设定最大注册次数，防止接口滥用。
- **多 AI 渠道代理**：支持 **硅基流动 (SiliconFlow)**、**Minimax (名之境)**、**智谱 GLM**、**DeepSeek (深度求索)**、**Kimi (月之暗面)** 的 API。
- **5 大智能助手模块**：
  - **📸 视觉膳食扫描**：拍照上传食物图片，AI 自动识别菜品并生成记录。
  - **🍎 膳食深度剖析**：一键点评今日总摄入热量、营养配比并给出膳食改善指导。
  - **🏋️ 专属运动规划**：根据运动目标、运动基础、性别年龄等量身打造单次运动图表。
  - **🧭 自律新挑战**：自选兴趣标签，AI 随机指派自律修行计划，一键认领至必做清单。
  - **📖 终身学习路径**：为您的学习领域制定分阶段里程碑式 30 天/自定义周期自学路线。

---

## 🛠️ 前端部署指南 (GitHub Pages & PWA)

项目使用 Vite 构建，默认配置了相对路径资源引用 (`base: './'`)，可直接部署在 GitHub Pages 任意子路径下。

### 1. 本地运行与打包

```bash
# 1. 安装依赖
npm install

# 2. 本地开发调试
npm run dev

# 3. 编译打包纯静态资源
npm run build
```

打包完成后，`dist/` 文件夹内的所有文件即为纯静态资源，可直接上传或推送到 GitHub 仓库的 `gh-pages` 分支进行托管。

### 2. GitHub Actions 自动部署 (推荐)

在项目根目录创建 `.github/workflows/deploy.yml`：

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches:
      - main # 触发部署的分支

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: true

jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      - name: Set up Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - name: Install dependencies
        run: npm install
      - name: Build
        run: npm run build
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

---

## ☁️ 后端部署指南 (Cloudflare Workers + KV)

后端代码位于 `cf-worker/` 文件夹，使用 Cloudflare KV 保存用户信息、邀请码额度与用户打卡数据。

### 1. 准备配置文件

进入 `cf-worker` 目录，将 `wrangler.toml.example` 复制一份并重命名为 `wrangler.toml`：
*(注意：`wrangler.toml` 已列入 `.gitignore`，不会被提交至公开仓库)*

```bash
cd cf-worker
cp wrangler.toml.example wrangler.toml
```

### 2. 创建 KV 命名空间

在 Cloudflare 控制台的 **Workers & Pages -> KV** 中创建一个名为 `SELF_DISCIPLINE_KV` 的命名空间（或者直接使用命令行）：

```bash
npx wrangler kv:namespace create KV
```

运行后将命令行返回的 `id` 填写到 `wrangler.toml` 的 `kv_namespaces` 下的 `id` 属性中。

### 3. 配置 AI 平台 API Keys (Secrets)

对于您需要启用的 AI 渠道，在 `cf-worker` 目录下，运行以下指令将其安全挂载到 Cloudflare 中：

```bash
# 挂载 硅基流动 Key (可选)
npx wrangler secret put SILICONFLOW_API_KEY

# 挂载 Minimax Key (可选)
npx wrangler secret put MINIMAX_API_KEY

# 挂载 智谱 GLM Key (可选)
npx wrangler secret put ZHIPU_API_KEY

# 挂载 DeepSeek Key (可选)
npx wrangler secret put DEEPSEEK_API_KEY

# 挂载 Kimi Key (可选)
npx wrangler secret put KIMI_API_KEY
```

### 4. 部署 Worker 后端

```bash
npm run deploy
```

部署成功后，控制台会输出一个访问地址（如 `https://self-discipline-backend.username.workers.dev`）。

### 5. 邀请码配置

初次部署后，Worker 会自动在您的 KV 命名空间中初始化一个 `config:invite_codes` 键，其默认值为：

```json
[
  { "code": "AISTUDIO2026", "maxUses": 10, "usedCount": 0 },
  { "code": "SELFDISCIPLINE", "maxUses": 5, "usedCount": 0 },
  { "code": "WELCOME", "maxUses": 100, "usedCount": 0 }
]
```

您可以在 Cloudflare Worker 控制台的 KV 栏目中直接点击编辑该 JSON：
- `code`：您期望设置的邀请激活码（不区分大小写）。
- `maxUses`：该邀请码可被注册的最大账号个数。
- `usedCount`：当前已经被注册的个数。
当 `usedCount >= maxUses` 时，该激活码将无法再被用于注册新账号。

---

## ⚙️ 客户端对接说明

1. 成功发布前端和后端后，在浏览器中打开前端页面。
2. 在登录页面中，输入您的 Cloudflare Worker 服务接口地址（若尚未登录，可通过小折叠面板配置；登录后也可以在“设置页”中随时更新）。
3. 切换至“创建新账号”，输入用户名、昵称、密码以及您在 KV 中配置好的**激活邀请码**，即可完成注册并同步登入云端！
4. 随后所有的 AI 大模型接口（膳食评估、运动定制、技能挑战、路线生成等）将直接通过您自己的 Cloudflare Worker 安全转发。