# Tavily MCP Server - Cloudflare Workers部署指南

## 🚀 快速部署

### 方式一：使用Cloudflare Dashboard（推荐，最简单）

1. **登录 Cloudflare Dashboard**
   - 访问 [dash.cloudflare.com](https://dash.cloudflare.com)
   - 选择 "Workers & Pages"

2. **创建新的Worker**
   - 点击 "Create application"
   - 选择 "Create Worker"
   - 给Worker起个名字，比如 `tavily-mcp-server`

3. **复制粘贴代码**
   - 将上面的 JavaScript 代码完整复制
   - 粘贴到Worker编辑器中，替换默认代码
   - 点击 "Save and Deploy"

4. **设置环境变量**
   - 在Worker详情页，点击 "Settings" → "Variables"
   - 添加环境变量：
     - 变量名：`TAVILY_API_KEY`
     - 值：你的Tavily API密钥
     - 选择 "Encrypt"（加密）
   - 点击 "Save and Deploy"

5. **获取Worker URL**
   - 部署成功后，你会得到一个URL，类似：
   - `https://tavily-mcp-server.your-subdomain.workers.dev`

### 方式二：使用Wrangler CLI

1. **安装Wrangler CLI**
   ```bash
   npm install -g wrangler
   ```

2. **登录Cloudflare**
   ```bash
   wrangler login
   ```

3. **创建项目目录**
   ```bash
   mkdir tavily-mcp-workers
   cd tavily-mcp-workers
   ```

4. **创建文件**
   - 创建 `src/worker.js` 并复制Worker代码
   - 创建 `wrangler.toml` 并复制配置文件

5. **设置环境变量**
   ```bash
   wrangler secret put TAVILY_API_KEY
   # 然后输入你的API密钥
   ```

6. **部署**
   ```bash
   wrangler deploy
   ```

## 🔧 配置LobeChat

部署成功后，在LobeChat中添加MCP服务器：

```json
{
  "name": "tavily-search",
  "transport": "streamable-http",
  "url": "https://你的worker域名.workers.dev/mcp",
  "description": "Tavily网络搜索服务"
}
```

## ✅ 验证部署

1. **健康检查**
   - 访问：`https://你的worker域名.workers.dev/health`
   - 应该返回健康状态JSON

2. **查看服务页面**
   - 访问：`https://你的worker域名.workers.dev/`
   - 应该看到服务信息页面

3. **测试搜索功能**
   - 在LobeChat中询问需要搜索的问题
   - 观察是否能正常调用Tavily搜索

## 📊 费用说明

Cloudflare Workers免费计划包括：
- ✅ 每天 100,000 次请求
- ✅ 每次请求 10ms CPU时间
- ✅ 全球CDN分发
- ✅ 零运维成本

对于个人使用绝对足够，完全免费！

## 🛠️ 自定义配置

### 修改搜索参数默认值
在Worker代码中找到 `handleTavilySearch` 函数，可以修改：
- `max_results`: 默认搜索结果数量
- `search_depth`: 搜索深度（basic/advanced）
- `include_answer`: 是否包含AI总结

### 添加访问控制
如果需要限制访问，可以在代码中添加API密钥验证：

```javascript
// 在handleMCP函数开头添加
const authHeader = request.headers.get('Authorization');
if (authHeader !== 'Bearer your-secret-key') {
    return new Response('Unauthorized', { status: 401 });
}
```

## 🔍 故障排除

### 常见问题

1. **"TAVILY_API_KEY 环境变量未设置"**
   - 确保在Cloudflare Dashboard中正确设置了环境变量
   - 变量名必须完全匹配：`TAVILY_API_KEY`

2. **搜索返回错误**
   - 检查Tavily API密钥是否有效
   - 确保API密钥有足够的配额

3. **LobeChat无法连接**
   - 确认Worker URL正确
   - 检查URL路径是否为 `/mcp`
   - 验证传输协议设置为 `streamable-http`

### 查看日志
在Cloudflare Dashboard中：
- 进入Worker详情页
- 点击 "Logs" 选项卡
- 查看实时日志输出

## 🎯 优势总结

相比传统部署方式，这个Cloudflare Workers版本具有：

- ⚡ **零延迟部署**：复制粘贴即可上线
- 🌍 **全球加速**：Cloudflare边缘网络自动优化
- 💰 **完全免费**：个人使用零成本
- 🔒 **安全可靠**：企业级安全防护
- 📈 **自动扩容**：无需担心流量峰值
- 🛠️ **零运维**：无需管理服务器

现在你可以享受强大的网络搜索能力，而无需任何服务器维护工作！