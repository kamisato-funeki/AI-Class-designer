/**
 * AI 流式对话核心工具 (chat.ts)
 * 业务职责：
 * 1. 模型高度封装：基于 LangChain 协议整合 DeepSeek-Chat 模型，实现高可靠的文本生成服务。
 * 2. 动态上下文路由：利用 PromptTemplate 将课件的基础元数据（标题、科目、年级）动态注入系统指令，引导 AI 按照特定教研背景进行创作。
 * 3. 实时响应驱动：通过 streaming 模式与前端组件联动，支撑“打字机式”的内容预览。
 * 4. 业务数据提取：流式任务结束后，自动从模型响应中正则析出推荐的课程名称标签（<course_name>），辅助业务状态更新。
 * 5. 请求管控：内置 AbortController 机制，支持用户在长文本生成过程中随时手动熔断请求。
 */

import { ChatOpenAI } from '@langchain/openai'
import { HumanMessage, AIMessage, SystemMessage, BaseMessage } from '@langchain/core/messages'
import { PromptTemplate } from '@langchain/core/prompts'
import { useCocreationStore } from '../stores/cocreationStore'

/** 访问凭证：实际生产环境需接入后端 Proxy 或环境变量加密 */
const DEEPSEEK_API_KEY = 'sk-4d6c3216342d4fc296bba6110f802bce'

/**
 * 训练模型实例初始化
 * 配置：DeepSeek 基座、流式输出开关、采样温度（0.7 以平衡逻辑性与发散性）
 */
const chatModel = new ChatOpenAI({
  apiKey: DEEPSEEK_API_KEY,
  configuration: {
    baseURL: 'https://api.deepseek.com/v1', 
  },
  modelName: 'deepseek-chat',
  streaming: true,
  temperature: 0.7, 
})

/**
 * 【系统指令集】systemTemplate
 * 定义 AI 的专家画像、任务边界及输出协议。
 * 协议说明：结尾强制包含课程名语义标签，用于系统自动重命名逻辑。
 */
const systemTemplate = `你是一位专业的AI课程设计助手。你的任务是帮助老师设计课程内容、大纲、以及相关教学材料。
请按照教育学的最佳实践，提供结构清晰、富有启发性的内容。可以适度使用 markdown 语法。
当前正在设计的课程信息如下：
- 课件名称：{title}
- 适用科目：{subject}
- 适用年级：{grade}

要求：请在最后单独开启一行，使用格式 <course_name>解析或优化的课程名称</course_name> 来返回一个推荐的课程名称以供系统更新。`

/** 将模板字符串转化为 LangChain 可识别的 Prompt 编排对象 */
const promptTemplate = new PromptTemplate({
  template: systemTemplate,
  inputVariables: ["title", "subject", "grade"]
})

/** 请求控制器容器：负责跨函数的请求终止信号传递 */
let abortController: AbortController | null = null

/**
 * 【核心业务函数】streamChat
 * 作用：执行端到端的 AI 对话流
 *
 * @param input       用户当前的自然语言指令
 * @param onToken     UI 层回调：逐字接收 AI 吐出的内容块
 * @param onComplete  业务层回调：当生成结束且解析出推荐课名时触发
 * @param onError     异常链路回调
 * @param context     当前业务上下文（Title/Subject/Grade）
 */
export const streamChat = async (
  input: string,
  onToken: (token: string) => void,
  onComplete: (parsedCourseName?: string) => void,
  onError: (err: unknown) => void,
  context?: { title: string, subject: string, grade: string }
) => {
  const store = useCocreationStore()

  // 1. 动态编排系统上下文（System Messenger）
  const sysMsgText = await promptTemplate.format({
    title: context?.title || '未命名课程',
    subject: context?.subject || '通用教育',
    grade: context?.grade || '全学段'
  })

  // 2. 构造多轮对话内存流（Message Array）
  // 注入全量历史记录，确保 AI 具备长短期记忆能力
  const messages: BaseMessage[] = [new SystemMessage(sysMsgText)]
  for (const msg of store.chatHistory) {
    if (msg.role === 'user') {
      messages.push(new HumanMessage(msg.content))
    } else if (msg.role === 'assistant') {
      messages.push(new AIMessage(msg.content))
    }
  }

  // 3. 压入本次用户指令
  messages.push(new HumanMessage(input))

  // 4. 重置信号量，开启底层流式监听
  abortController = new AbortController()
  let fullOutput = ''

  try {
    const stream = await chatModel.stream(messages, {
      signal: abortController.signal,
    })

    // 5. 逐迭代处理 chunk 分片
    for await (const chunk of stream) {
      if (chunk.content) {
        const text = chunk.content.toString()
        fullOutput += text
        // 无感分发：将内容实时推送到 vue 组件的响应式变量中
        onToken(text)
      }
    }

    // 6. 任务后置处理：提取语义标签
    let parsedName = undefined
    const match = fullOutput.match(/<course_name>(.*?)<\/course_name>/)
    if (match && match[1]) {
      parsedName = match[1].trim()
    }

    onComplete(parsedName)
  } catch (err: unknown) {
    // 处理用户手动熔断逻辑，不作为 Error 抛出
    if (err instanceof Error && err.name === 'AbortError') {
      onComplete()
    } else {
      console.error('DeepSeek 模型调用异常:', err)
      onError(err)
    }
  } finally {
    abortController = null
  }
}

/**
 * 【控制函数】stopGeneration
 * 作用：外部强制终止生成逻辑（如用户点击“停止生成”按钮）
 */
export const stopGeneration = () => {
  if (abortController) {
    abortController.abort() // 发送 Web 标准终止信号
    abortController = null
  }
}
