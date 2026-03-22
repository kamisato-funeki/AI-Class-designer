/**
 * vTt.ts - 语音转文字工具函数
 * 基于阿里百炼千问实时语音识别服务 (qwen3-asr-flash-realtime)
 * API文档：https://help.aliyun.com/zh/model-studio/qwen-asr-realtime-interaction-process
 */

export interface VttOptions {
  /** 识别到新文字时回调（流式，每次返回完整本句当前识别结果累加） */
  onToken: (text: string) => void
  /** 识别完成时回调 */
  onComplete: (fullText: string) => void
  /** 发生错误时回调 */
  onError: (err: string) => void
}

export interface VttSession {
  /** 停止录音并发送结束包 */
  stop: () => void
}

/**
 * 开始语音输入识别
 * 内部使用 MediaRecorder/AudioContext + WebSocket 实现流式 PCM 传输
 */
export async function startVoiceToText(opts: VttOptions): Promise<VttSession> {
  let stream: MediaStream | null = null
  let audioContext: AudioContext | null = null
  let processor: ScriptProcessorNode | null = null
  let ws: WebSocket | null = null
  let isStopped = false
  let fullText = ''

  try {
    // 1. 请求麦克风权限
    stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })

    // 2. 建立 WebSocket 连接到代理
    // proxy 用于自动增加 Authorization 及其它的 Header 信息
    const wsBase = (location.protocol === 'https:' ? 'wss:' : 'ws:') + '//' + location.host;
    const wsUrl = `${wsBase}/dashscope-apiws/api-ws/v1/realtime?model=qwen3-asr-flash-realtime`

    ws = new WebSocket(wsUrl)

    // 3. 连接成功后发送 session.update 配置
    ws.onopen = () => {
      const sessionUpdate = {
        event_id: crypto.randomUUID(),
        type: 'session.update',
        session: {
          modalities: ['text'],
          input_audio_format: 'pcm',
          sample_rate: 16000,
          input_audio_transcription: {
            language: 'zh'
          },
          turn_detection: {
             type: 'server_vad',
             threshold: 0.0,
             silence_duration_ms: 400
          }
        }
      }
      ws!.send(JSON.stringify(sessionUpdate))
    }

    // 4. 接收服务端响应
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        
        switch (data.type) {
          case 'conversation.item.input_audio_transcription.text': {
            // 实时部分结果 (stash)
            const stashText = data.stash || data.text || ''
            if (stashText || fullText) {
              opts.onToken(fullText + (fullText ? ' ' : '') + stashText)
            }
            break
          }
          case 'conversation.item.input_audio_transcription.completed': {
            // 一句话完成
            const transcript = data.transcript || ''
            if (transcript) {
              fullText += (fullText ? ' ' : '') + transcript
              opts.onToken(fullText)
            }
            break
          }
          case 'session.finished': {
            // 会话结束
            const transcript = data.transcript
            if (transcript) {
              // 处理最后一句结果（通常在 completed 中已经包含）
              if (!fullText.endsWith(transcript)) {
                fullText += (fullText ? ' ' : '') + transcript
                opts.onToken(fullText)
              }
            }
            cleanup()
            opts.onComplete(fullText)
            break
          }
          case 'error': {
            console.error('ASR WebSocket Server Error:', data)
            opts.onError(data?.error?.message || 'ASR 服务端报错')
            cleanup()
            break
          }
        }
      } catch (e) {
        console.error('Failed to parse ASR message:', e)
      }
    }

    ws.onerror = (e) => {
      console.error('ASR WebSocket error', e)
      cleanup()
      opts.onError('WebSocket 连接失败')
    }

    ws.onclose = (e) => {
      if (!isStopped) {
        cleanup()
        if (fullText) {
          opts.onComplete(fullText)
        } else {
          opts.onError(`连接中断 (code=${e.code})`)
        }
      }
    }

    // 5. 使用 AudioContext + ScriptProcessorNode 采集 PCM 数据
    audioContext = new AudioContext({ sampleRate: 16000 })
    const source = audioContext.createMediaStreamSource(stream)
    const bufferSize = 4096 
    processor = audioContext.createScriptProcessor(bufferSize, 1, 1)

    processor.onaudioprocess = (e) => {
      if (isStopped || !ws || ws.readyState !== WebSocket.OPEN) return

      const channelData = e.inputBuffer.getChannelData(0) // mono
      // Convert Float32 to Int16 PCM
      const pcm = new Int16Array(channelData.length)
      for (let i = 0; i < channelData.length; i++) {
        const val = channelData[i] || 0
        const s = Math.max(-1, Math.min(1, val))
        pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff
      }
      
      // Node.js 代码显示将 PCM 转为 base64 发送
      const buffer = pcm.buffer
      let binary = ''
      const bytes = new Uint8Array(buffer)
      const len = bytes.byteLength
      for (let i = 0; i < len; i++) {
          binary += String.fromCharCode(bytes[i]!)
      }
      const base64Audio = btoa(binary)
      
      const audioEvent = {
         event_id: crypto.randomUUID(),
         type: 'input_audio_buffer.append',
         audio: base64Audio
      }
      ws.send(JSON.stringify(audioEvent))
    }

    source.connect(processor)
    processor.connect(audioContext.destination)

  } catch (err) {
    cleanup()
    opts.onError(err instanceof Error ? err.message : '麦克风启动失败')
  }

  function cleanup() {
    isStopped = true
    if (processor) { processor.disconnect(); processor = null }
    if (audioContext) { audioContext.close(); audioContext = null }
    if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null }
  }

  function stop() {
    if (isStopped) return
    isStopped = true
    
    // Stop recording first
    if (processor) { processor.disconnect(); processor = null }
    if (audioContext) { audioContext.close(); audioContext = null }
    if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null }

    if (ws && ws.readyState === WebSocket.OPEN) {
      // 发送 input_audio_buffer.commit 标记音频发送完毕（可选，但对于依赖 Server VAD 有时可以加速判定）
      const commitEvent = {
        event_id: crypto.randomUUID(),
        type: 'input_audio_buffer.commit'
      }
      ws.send(JSON.stringify(commitEvent))

      const finishEvent = {
        event_id: crypto.randomUUID(),
        type: 'session.finish'
      }
      ws.send(JSON.stringify(finishEvent))
    }
    
    if (ws) {
      setTimeout(() => {
        if (ws && ws.readyState !== WebSocket.CLOSED) {
          ws.close()
        }
      }, 2000)
    }
  }

  return { stop }
}
