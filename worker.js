// Tavily MCP Server - Cloudflare Workers版本
// 支持 Streamable HTTP 协议

// MCP服务器信息
const SERVER_INFO = {
  name: 'tavily-mcp-workers',
  version: '1.0.0',
  description: 'Tavily搜索MCP服务器 - Cloudflare Workers版本',
  author: 'Custom Implementation'
};

// 支持的工具列表
const TOOLS = [
  {
    name: 'tavily_search',
    description: '使用Tavily API进行网络搜索',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: '搜索查询内容'
        },
        max_results: {
          type: 'number',
          description: '最大返回结果数量（默认5）',
          default: 5
        },
        search_depth: {
          type: 'string',
          enum: ['basic', 'advanced'],
          description: '搜索深度（默认basic）',
          default: 'basic'
        },
        include_domains: {
          type: 'array',
          items: { type: 'string' },
          description: '包含的域名列表'
        },
        exclude_domains: {
          type: 'array',
          items: { type: 'string' },
          description: '排除的域名列表'
        }
      },
      required: ['query']
    }
  },
  {
    name: 'tavily_extract',
    description: '从指定URL提取内容',
    inputSchema: {
      type: 'object',
      properties: {
        urls: {
          type: 'array',
          items: { type: 'string' },
          description: '要提取内容的URL列表'
        }
      },
      required: ['urls']
    }
  }
];

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400'
};

// 主要的fetch事件处理器
export default {
  async fetch(request, env, ctx) {
    // 处理预检请求
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: corsHeaders
      });
    }

    const url = new URL(request.url);

    try {
      // 路由处理
      switch (url.pathname) {
        case '/':
          return handleRoot();
        case '/health':
          return handleHealth();
        case '/mcp':
          return handleMCP(request, env);
        default:
          return new Response('Not Found', {
            status: 404,
            headers: corsHeaders
          });
      }
    } catch (error) {
      console.error('Worker error:', error);
      return new Response(
        JSON.stringify({
          error: 'Internal Server Error',
          message: error.message
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        }
      );
    }
  }
};

// 根路径处理
function handleRoot() {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Tavily MCP Server</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .container { max-width: 800px; margin: 0 auto; }
            .status { color: #28a745; font-weight: bold; }
            .endpoint { background: #f8f9fa; padding: 10px; border-radius: 5px; margin: 10px 0; }
            code { background: #e9ecef; padding: 2px 5px; border-radius: 3px; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🔍 Tavily MCP Server</h1>
            <p class="status">✅ 服务运行正常</p>
            
            <h2>服务信息</h2>
            <ul>
                <li><strong>名称:</strong> ${SERVER_INFO.name}</li>
                <li><strong>版本:</strong> ${SERVER_INFO.version}</li>
                <li><strong>描述:</strong> ${SERVER_INFO.description}</li>
                <li><strong>协议:</strong> Streamable HTTP</li>
            </ul>

            <h2>可用端点</h2>
            <div class="endpoint">
                <strong>健康检查:</strong> <code>GET /health</code>
            </div>
            <div class="endpoint">
                <strong>MCP端点:</strong> <code>POST /mcp</code>
            </div>

            <h2>支持的工具</h2>
            <ul>
                ${TOOLS.map(
                  tool =>
                    `<li><strong>${tool.name}</strong>: ${tool.description}</li>`
                ).join('')}
            </ul>

            <h2>配置示例</h2>
            <p>在 LobeChat 中添加此 MCP 服务器:</p>
            <pre><code>{
  "name": "tavily-search",
  "transport": "streamable-http", 
  "url": "https://your-worker.your-subdomain.workers.dev/mcp",
  "description": "Tavily搜索服务"
}</code></pre>
        </div>
    </body>
    </html>
    `;

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html',
      ...corsHeaders
    }
  });
}

// 健康检查处理
function handleHealth() {
  return new Response(
    JSON.stringify({
      status: 'healthy',
      server: SERVER_INFO,
      timestamp: new Date().toISOString(),
      uptime: 'Cloudflare Workers (serverless)'
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    }
  );
}

// MCP协议处理
async function handleMCP(request, env) {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', {
      status: 405,
      headers: corsHeaders
    });
  }

  // 检查API密钥
  if (!env.TAVILY_API_KEY) {
    return createErrorResponse(null, -32603, 'TAVILY_API_KEY 环境变量未设置');
  }

  let requestData;
  try {
    requestData = await request.json();
  } catch (error) {
    return createErrorResponse(null, -32700, '无效的JSON请求');
  }

  const { method, params, id } = requestData;

  try {
    let result;

    switch (method) {
      case 'initialize':
        result = {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: {}
          },
          serverInfo: SERVER_INFO
        };
        break;

      case 'tools/list':
        result = {
          tools: TOOLS
        };
        break;

      case 'tools/call':
        result = await handleToolCall(params, env);
        break;

      default:
        return createErrorResponse(id, -32601, `未知方法: ${method}`);
    }

    // 创建SSE响应
    const response = {
      jsonrpc: '2.0',
      id: id,
      result: result
    };

    return new Response(`data: ${JSON.stringify(response)}\n\n`, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        ...corsHeaders
      }
    });
  } catch (error) {
    console.error('MCP处理错误:', error);
    return createErrorResponse(id, -32603, `内部服务器错误: ${error.message}`);
  }
}

// 创建错误响应
function createErrorResponse(id, code, message) {
  const errorResponse = {
    jsonrpc: '2.0',
    id: id,
    error: {
      code: code,
      message: message
    }
  };

  return new Response(`data: ${JSON.stringify(errorResponse)}\n\n`, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      ...corsHeaders
    }
  });
}

// 处理工具调用
async function handleToolCall(params, env) {
  const { name, arguments: args } = params;

  switch (name) {
    case 'tavily_search':
      return await handleTavilySearch(args, env);
    case 'tavily_extract':
      return await handleTavilyExtract(args, env);
    default:
      throw new Error(`未知工具: ${name}`);
  }
}

// 如果环境变量中的TAVILY_API_KEY设置了多个(逗号分隔),则每次随机使用一个
function getRandomApiKey(env) {
  const keys = (env.TAVILY_API_KEY || '')
    .split(',')
    .map(key => key.trim())
    .filter(key => key);
  // 如果没有设置TAVILY_API_KEY或第一个key为空,则抛出错误

  if (keys.length === 0 || !keys[0]) {
    throw new Error('TAVILY_API_KEY 环境变量未设置或无效');
  }
  // 随机选择一个API密钥
  return keys[Math.floor(Math.random() * keys.length)];
}

// 处理Tavily搜索
async function handleTavilySearch(args, env) {
  try {
    const searchParams = {
      api_key: getRandomApiKey(env),
      query: args.query,
      max_results: args.max_results || 5,
      search_depth: args.search_depth || 'basic',
      include_answer: true,
      include_images: false,
      include_raw_content: false
    };

    if (args.include_domains) {
      searchParams.include_domains = args.include_domains;
    }
    if (args.exclude_domains) {
      searchParams.exclude_domains = args.exclude_domains;
    }

    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(searchParams)
    });

    if (!response.ok) {
      throw new Error(
        `Tavily API错误: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();

    const results = (data.results || []).map(result => ({
      title: result.title || '无标题',
      url: result.url || '',
      content: result.content || '无内容',
      score: result.score || 0,
      published_date: result.published_date || null
    }));

    return {
      content: [
        {
          type: 'text',
          text:
            `🔍 搜索查询: "${args.query}"\n📊 找到 ${results.length} 个结果:\n\n` +
            results
              .map(
                (result, index) =>
                  `**${index + 1}. ${result.title}**\n` +
                  `🔗 URL: ${result.url}\n` +
                  `⭐ 评分: ${result.score.toFixed(2)}\n` +
                  `📅 发布日期: ${result.published_date || '未知'}\n` +
                  `📝 摘要: ${result.content}\n`
              )
              .join('\n') +
            (data.answer ? `\n🤖 **AI总结答案:**\n${data.answer}` : '') +
            `\n\n⚡ 由 Cloudflare Workers 提供服务`
        }
      ]
    };
  } catch (error) {
    console.error('Tavily搜索错误:', error);
    return {
      content: [
        {
          type: 'text',
          text: `❌ 搜索失败: ${error.message}`
        }
      ]
    };
  }
}

// 处理Tavily内容提取
async function handleTavilyExtract(args, env) {
  try {
    const extractParams = {
      api_key: getRandomApiKey(env),
      urls: args.urls
    };

    const response = await fetch('https://api.tavily.com/extract', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(extractParams)
    });

    if (!response.ok) {
      throw new Error(
        `Tavily Extract API错误: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();

    const results = (data.results || []).map(result => ({
      url: result.url || '',
      raw_content: result.raw_content || '无内容',
      status_code: result.status_code || 0
    }));

    return {
      content: [
        {
          type: 'text',
          text:
            `📄 内容提取结果:\n\n` +
            results
              .map(
                (result, index) =>
                  `**${index + 1}. URL**: ${result.url}\n` +
                  `**状态码**: ${result.status_code}\n` +
                  `**内容**:\n${result.raw_content.substring(0, 2000)}${
                    result.raw_content.length > 2000 ? '...(内容已截断)' : ''
                  }\n\n`
              )
              .join('') +
            `⚡ 由 Cloudflare Workers 提供服务`
        }
      ]
    };
  } catch (error) {
    console.error('Tavily提取错误:', error);
    return {
      content: [
        {
          type: 'text',
          text: `❌ 内容提取失败: ${error.message}`
        }
      ]
    };
  }
}
