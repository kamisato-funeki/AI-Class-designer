import { ChatOpenAI } from '@langchain/openai'
import { HumanMessage, AIMessage, SystemMessage, BaseMessage } from '@langchain/core/messages'
import { useCocreationStore } from '../stores/cocreationStore'

// We configure ChatOpenAI to point to the DeepSeek API compatibility layer
// We expect the key to be provided in the environment or passed directly for this demo.
const DEEPSEEK_API_KEY = 'sk-4d6c3216342d4fc296bba6110f802bce'

const chatModel = new ChatOpenAI({
  apiKey: DEEPSEEK_API_KEY,
  configuration: {
    baseURL: 'https://api.deepseek.com/v1',
  },
  modelName: 'deepseek-chat',
  streaming: true,
  temperature: 0.7,
})

const systemPrompt = new SystemMessage(
  `你是一位专业的AI课程设计助手。你的任务是帮助老师设计课程内容、大纲、以及相关教学材料。
请按照教育学的最佳实践，提供结构清晰、富有启发性的内容。`,
)

let abortController: AbortController | null = null

/**
 * 核心聊天函数，支持上下文记忆和流式输出
 * @param input 用户输入文本
 * @param onToken 流式输出回调
 * @param onComplete 完成回调
 * @param onError 错误回调
 */
export const streamChat = async (
  input: string,
  onToken: (token: string) => void,
  onComplete: () => void,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onError: (err: any) => void,
) => {
  const store = useCocreationStore()

  // Build message history
  const messages: BaseMessage[] = [systemPrompt]
  for (const msg of store.chatHistory) {
    if (msg.role === 'user') {
      messages.push(new HumanMessage(msg.content))
    } else if (msg.role === 'assistant') {
      messages.push(new AIMessage(msg.content))
    }
  }

  // Add the new message
  messages.push(new HumanMessage(input))

  // Create an abort controller so we can cancel generation
  abortController = new AbortController()

  try {
    const stream = await chatModel.stream(messages, {
      signal: abortController.signal,
    })

    for await (const chunk of stream) {
      if (chunk.content) {
        onToken(chunk.content.toString())
      }
    }
    onComplete()
  } catch (err: unknown) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((err as any).name === 'AbortError') {
      // Generation was cancelled, which is fine
      onComplete()
    } else {
      console.error('Chat API Error:', err)
      onError(err)
    }
  } finally {
    abortController = null
  }
}

/**
 * 停止当前的生成过程
 */
export const stopGeneration = () => {
  if (abortController) {
    abortController.abort()
    abortController = null
  }
}
