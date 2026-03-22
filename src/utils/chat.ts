import { ChatOpenAI } from '@langchain/openai'
import { HumanMessage, AIMessage, SystemMessage, BaseMessage } from '@langchain/core/messages'
import { PromptTemplate } from '@langchain/core/prompts'
import { useCocreationStore } from '../stores/cocreationStore'

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

const systemTemplate = `你是一位专业的AI课程设计助手。你的任务是帮助老师设计课程内容、大纲、以及相关教学材料。
请按照教育学的最佳实践，提供结构清晰、富有启发性的内容。可以适度使用 markdown 语法。
当前正在设计的课程信息如下：
- 课件名称：{title}
- 适用科目：{subject}
- 适用年级：{grade}

要求：请在最后单独开启一行，使用格式 <course_name>解析或优化的课程名称</course_name> 来返回一个推荐的课程名称以供系统更新。`

const promptTemplate = new PromptTemplate({
  template: systemTemplate,
  inputVariables: ["title", "subject", "grade"]
})

let abortController: AbortController | null = null

export const streamChat = async (
  input: string,
  onToken: (token: string) => void,
  onComplete: (parsedCourseName?: string) => void,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onError: (err: any) => void,
  context?: { title: string, subject: string, grade: string }
) => {
  const store = useCocreationStore()

  // Format the system prompt with context using PromptTemplate
  const sysMsgText = await promptTemplate.format({
    title: context?.title || '未命名',
    subject: context?.subject || '通用',
    grade: context?.grade || '通用'
  })

  // Build message history
  const messages: BaseMessage[] = [new SystemMessage(sysMsgText)]
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

  let fullOutput = ''

  try {
    const stream = await chatModel.stream(messages, {
      signal: abortController.signal,
    })

    for await (const chunk of stream) {
      if (chunk.content) {
        const text = chunk.content.toString()
        fullOutput += text
        
        // Let's strip out the <course_name> tags from the UI stream
        // Not perfect if it streams character by character, but we can do a cleanup at the end
        // For UI, we just stream it as is and clean it up in updateLastMessage at the caller
        onToken(text)
      }
    }
    
    // Attempt to extract the parsed course name
    let parsedName = undefined
    const match = fullOutput.match(/<course_name>(.*?)<\/course_name>/)
    if (match && match[1]) {
      parsedName = match[1].trim()
    }
    
    // Call complete
    onComplete(parsedName)
  } catch (err: unknown) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((err as any).name === 'AbortError') {
      onComplete()
    } else {
      console.error('Chat API Error:', err)
      onError(err)
    }
  } finally {
    abortController = null
  }
}

export const stopGeneration = () => {
  if (abortController) {
    abortController.abort()
    abortController = null
  }
}
