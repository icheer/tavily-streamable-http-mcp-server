# Tavily Streamable HTTP MCP Server

<div align="center">

一个基于 Cloudflare Workers 的 Tavily 搜索 MCP (Model Context Protocol) 服务器

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-orange)](https://workers.cloudflare.com/)
[![MCP Protocol](https://img.shields.io/badge/MCP-Compatible-blue)](https://github.com/modelcontextprotocol)

</div>

## 📖 简介

Tavily Streamable HTTP MCP Server 是一个实现了 Model Context Protocol 规范的网络搜索服务器，基于 Cloudflare Workers 平台构建。它提供了高性能的网络搜索和内容提取功能，支持与 LobeChat、Cherry Studio、Claude Desktop 等 AI 客户端无缝集成。

### ✨ 核心特性

- 🔍 **智能搜索**：基于 Tavily API 的高质量网络搜索
- 📄 **内容提取**：从指定 URL 提取和处理网页内容
- ⚡ **边缘计算**：利用 Cloudflare 全球网络实现低延迟响应
- 🔐 **安全可靠**：支持 API 密钥轮换和负载均衡
- 💰 **完全免费**：基于 Cloudflare Workers 免费计划
- 🌐 **跨平台兼容**：支持多种 MCP 客户端

### 🛠 技术栈

- **运行时**：Cloudflare Workers
- **协议**：Model Context Protocol (MCP)
- **API**：Tavily Search API
- **传输**：Streamable HTTP

## 🚀 快速开始

### 方式一：Cloudflare Dashboard 部署（推荐）

1. **准备工作**
   ```bash
   # 获取 Tavily API 密钥
   # 访问 https://tavily.com 注册并获取 API Key
   ```

2. **创建 Worker**
   - 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
   - 导航至 `Workers & Pages`
   - 点击 `Create application` → `Create Worker`
   - 命名您的 Worker（如：`tavily-mcp-server`）

3. **部署代码**
   - 将 `worker.js` 中的代码复制到在线编辑器
   - 点击 `Save and Deploy`

4. **配置环境变量**
   - 在 Worker 设置页面选择 `Settings` → `Variables`
   - 添加环境变量：
     - **名称**：`TAVILY_API_KEY`
     - **值**：您的 Tavily API 密钥（支持多个密钥用逗号分隔）
     - **类型**：加密变量
   - 保存并重新部署

### 方式二：Wrangler CLI 部署

1. **环境准备**
   ```bash
   # 安装 Wrangler CLI
   npm install -g wrangler
   
   # 登录 Cloudflare
   wrangler login
   ```

2. **项目初始化**
   ```bash
   # 克隆仓库
   git clone <repository-url>
   cd tavily-mcp-server
   
   # 配置环境变量
   wrangler secret put TAVILY_API_KEY
   ```

3. **部署服务**
   ```bash
   wrangler deploy
   ```

## 📋 API 文档

### 端点说明

| 端点 | 方法 | 描述 |
|------|------|------|
| `/` | GET | 服务信息页面 |
| `/health` | GET | 健康检查端点 |
| `/mcp` | POST | MCP 协议通信端点 |

### 支持的工具

#### 1. tavily_search
执行网络搜索操作

**参数：**
```json
{
  "query": "搜索查询内容",          // 必需
  "max_results": 5,              // 可选，默认 5
  "search_depth": "basic",       // 可选，basic/advanced
  "include_domains": ["域名"],    // 可选
  "exclude_domains": ["域名"]     // 可选
}
```

#### 2. tavily_extract
从指定 URL 提取内容

**参数：**
```json
{
  "urls": ["https://example.com"] // 必需，URL 数组
}
```

## 🔧 客户端配置

### LobeChat 配置

在 LobeChat 中添加 MCP 服务器：

```json
{
  "name": "tavily-search",
  "transport": "streamable-http",
  "url": "https://your-worker.workers.dev/mcp",
  "description": "Tavily 网络搜索服务"
}
```

### Claude Desktop 配置

在 `claude_desktop_config.json` 中添加：

```json
{
  "mcpServers": {
    "tavily": {
      "transport": "http",
      "url": "https://your-worker.workers.dev/mcp"
    }
  }
}
```

## 🧪 测试验证

### 健康检查
```bash
curl https://your-worker.workers.dev/health
```

### 功能测试
```bash
# 测试搜索功能
curl -X POST https://your-worker.workers.dev/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "tavily_search",
      "arguments": {
        "query": "人工智能最新发展"
      }
    }
  }'
```

## ⚙️ 高级配置

### 自定义搜索参数

修改 `worker.js` 中的默认参数：

```javascript
const DEFAULT_CONFIG = {
  max_results: 10,        // 增加默认结果数量
  search_depth: 'advanced', // 使用高级搜索
  include_answer: true    // 包含 AI 摘要
};
```

### 访问控制

默认未设访问控制，可自行添加 API 密钥验证：

```javascript
const authHeader = request.headers.get('Authorization');
if (authHeader !== 'Bearer your-secret-key') {
    return new Response('Unauthorized', { status: 401 });
}
```

### 日志监控

在 Cloudflare Dashboard 中查看实时日志：
- 进入 Worker 详情页
- 选择 `Logs` 选项卡
- 监控请求和错误信息

## � 成本说明

### Cloudflare Workers 免费额度

- ✅ 每日 100,000 次请求
- ✅ 每次请求 10ms CPU 时间
- ✅ 全球 CDN 分发
- ✅ 零运维成本

### Tavily API 定价

请参考 [Tavily 官方定价](https://tavily.com/pricing) 了解 API 使用费用。
通常来说：Tavily 免费计划账号每个月有 1000 次 API 调用额度，相同账号下的多个 API Key 共享 1000 次调用额度。

## 🐛 故障排除

### 常见问题

**问题：环境变量未设置**
```
错误：TAVILY_API_KEY 环境变量未设置
解决：检查 Cloudflare Dashboard 中的环境变量配置
```

**问题：搜索返回错误**
```
错误：API 请求失败
解决：验证 API 密钥有效性和配额余额
```

**问题：客户端连接失败**
```
错误：无法连接到 MCP 服务器
解决：确认 URL 正确性和协议设置
```

### 调试技巧

1. **查看实时日志**
   ```bash
   wrangler tail your-worker-name
   ```

2. **本地测试**
   ```bash
   wrangler dev
   ```

3. **验证环境变量**
   ```bash
   wrangler secret list
   ```

## 🤝 贡献指南

我们欢迎社区贡献！请遵循以下步骤：

1. Fork 本仓库
2. 创建功能分支：`git checkout -b feature/AmazingFeature`
3. 提交更改：`git commit -m 'Add some AmazingFeature'`
4. 推送分支：`git push origin feature/AmazingFeature`
5. 提交 Pull Request

### 开发规范

- 遵循 JavaScript/ES6+ 编码规范
- 添加适当的错误处理和日志记录
- 更新相关文档和测试用例

## 📄 许可证

本项目基于 MIT 许可证开源。详见 [LICENSE](LICENSE) 文件。

## 🔗 相关链接

- [Model Context Protocol](https://github.com/modelcontextprotocol) - MCP 协议规范
- [Tavily API](https://tavily.com) - 搜索 API 服务
- [Cloudflare Workers](https://workers.cloudflare.com/) - 边缘计算平台
- [LobeChat](https://github.com/lobehub/lobe-chat) - AI 聊天客户端

---

<div align="center">

**[⭐ 给个 Star](https://github.com/your-username/tavily-mcp-server) | [� 报告问题](https://github.com/your-username/tavily-mcp-server/issues) | [� 功能建议](https://github.com/your-username/tavily-mcp-server/discussions)**

</div>