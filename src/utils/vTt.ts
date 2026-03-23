/**
 * 实时语音转文字（ASR）底层驱动 (vTt.ts)
 * 业务职责：
 * 1. 设备接入管理：申请麦克风权限（navigator.mediaDevices）并执行标准化的音频采集流。
 * 2. 实时信号处理：利用音频工程原语（AudioContext, ScriptProcessorNode）拦截音频原始采样，执行 Float32 到 Int16 的量化压缩。
 * 3. 异步通讯链路：通过 WebSocket 协议将经过 Base64 编码的 PCM 音频片实时透传至阿里百炼后台，同步接收流式识别结果。
 * 4. 业务逻辑切片：解析服务端返回的 stash（中间态）与 completed（确定态）消息，为 UI 提供平滑的打字机反馈。
 * 5. 生命周期管控：严密控制 Session 的建立与销毁流程，确保 WebSocket 资源的及时回收。
 *
 * API 参考文档：https://help.aliyun.com/zh/model-studio/qwen-asr-realtime-interaction-process
 */

/** 语音识别外部指令集接口 */
export interface VttOptions {
  onToken: (text: string) => void      // 即时感知反馈：当 AI 识别出新 token 时触发
  onComplete: (fullText: string) => void // 任务圆满完成：吐出整次对话的完整转录本
  onError: (err: string) => void         // 稳健性处理：捕获网络或权限异常
}

/** 语音识别运行态会话凭证 */
export interface VttSession {
  stop: () => void // 提供手动熔断接口，用于结束录音
}

/**
 * 【核心业务函数】startVoiceToText
 * 作用：初始化并维持一个实时识别会话
 *
 * @param opts 外部注入的回调逻辑
 * @returns 异步返回带 stop 能力的会话句柄
 */
export async function startVoiceToText(opts: VttOptions): Promise<VttSession> {
  // --- 硬件与协议资源容器 ---
  let stream: MediaStream | null = null
  let audioContext: AudioContext | null = null
  let processor: ScriptProcessorNode | null = null
  let ws: WebSocket | null = null
  let isStopped = false
  let fullText = '' // 内存记录：聚合跨切片的最终转录文本

  try {
    // 1. 系统权限预检：请求麦克风入场券
    stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })

    // 2. 通讯链路编排：建立 WebSocket 持久连接
    // 注意：实际落地建议通过 Backend Proxy 代理转发，避免前端直传 API Key。
    const wsBase = (location.protocol === 'https:' ? 'wss:' : 'ws:') + '//' + location.host
    const wsUrl = `${wsBase}/dashscope-apiws/api-ws/v1/realtime?model=qwen3-asr-flash-realtime`
    ws = new WebSocket(wsUrl)

    // 3. WS 握手成功：执行 Session 初始化握手
    ws.onopen = () => {
      const sessionUpdate = {
        event_id: crypto.randomUUID(),
        type: 'session.update',
        session: {
          modalities: ['text'],               // 指令集映射：仅文字 ASR
          input_audio_format: 'pcm',          // 输入负载格式：原生 PCM (16bit/16kHz)
          sample_rate: 16000,                 // 采样率校对：阿里云标准 16k
          input_audio_transcription: {
            language: 'zh'                    // 语言包驱动：支持中文普通话
          },
          turn_detection: {
            type: 'server_vad',               // 云端 VAD 嗅探：自动检测语态停顿
            threshold: 0.0,
            silence_duration_ms: 400          // 静音策略：400ms 无声执行切句
          }
        }
      }
      ws!.send(JSON.stringify(sessionUpdate))
    }

    // 4. 下行数据监听：响应识别流
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)

        switch (data.type) {
          case 'conversation.item.input_audio_transcription.text': {
            // 中间预判结果（Stash）：AI 认为你可能说的内容，随语境变化而修正
            const stashText = data.stash || data.text || ''
            if (stashText || fullText) {
              opts.onToken(fullText + (fullText ? ' ' : '') + stashText)
            }
            break
          }
          case 'conversation.item.input_audio_transcription.completed': {
            // 原子任务落地（Completed）：当前整句已由服务端锁定并定稿
            const transcript = data.transcript || ''
            if (transcript) {
              fullText += (fullText ? ' ' : '') + transcript
              opts.onToken(fullText)
            }
            break
          }
          case 'session.finished': {
            // 会话逻辑终止信号
            cleanup()
            opts.onComplete(fullText)
            break
          }
          case 'error': {
            console.error('阿里云 ASR 处理链路报错:', data)
            opts.onError(data?.error?.message || '语音处理服务暂时不可用')
            cleanup()
            break
          }
        }
      } catch (e) {
        console.error('ASR 信令解析异常:', e)
      }
    }

    ws.onerror = (e) => {
      console.error('ASR WebSocket 物理链路中断', e)
      cleanup()
      opts.onError('网络连接失败，请检查防火墙设置')
    }

    // 5. 音频特征工程：PCM 实时重采样与分发
    // 创建 16kHz 的隔离音频上下文，确保采集数据与服务端对齐
    audioContext = new AudioContext({ sampleRate: 16000 })
    const source = audioContext.createMediaStreamSource(stream)
    
    // bufferSize: 4096 样本点，大约提供 256ms 的采集延迟平衡
    const bufferSize = 4096
    processor = audioContext.createScriptProcessor(bufferSize, 1, 1)

    /**
     * 【音频分片处理器】onaudioprocess
     * 作用：在每一帧音频到达时执行格式量化压缩并上传
     */
    processor.onaudioprocess = (e) => {
      if (isStopped || !ws || ws.readyState !== WebSocket.OPEN) return

      // A. 获取 Float32 数据流 (range [-1, 1])
      const channelData = e.inputBuffer.getChannelData(0)

      // B. 压缩至 Int16 PCM (range [-32768, 32767])
      const pcm = new Int16Array(channelData.length)
      for (let i = 0; i < channelData.length; i++) {
        const val = channelData[i] || 0
        const s = Math.max(-1, Math.min(1, val))
        pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff
      }

      // C. 打包为 Base64 文本并外发
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

    // 资源链路关联
    source.connect(processor)
    processor.connect(audioContext.destination)

  } catch (err) {
    cleanup()
    opts.onError(err instanceof Error ? err.message : '由于系统限制，麦克风无法正常启动')
  }

  /**
   * 资源回收沙盒
   */
  function cleanup() {
    isStopped = true
    if (processor) { processor.disconnect(); processor = null }
    if (audioContext) { audioContext.close(); audioContext = null }
    if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null }
  }

  /**
   * 【手动熔断函数】stop
   * 作用：主动通知服务端“我说完了，请进行最后一次结算”
   */
  function stop() {
    if (isStopped) return
    isStopped = true

    // 1. 立即停止音频采集，节省本地 CPU 与带宽
    if (processor) { processor.disconnect(); processor = null }
    if (audioContext) { audioContext.close(); audioContext = null }
    if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null }

    // 2. 发送逻辑结束指令，触发云端最终识别
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ event_id: crypto.randomUUID(), type: 'input_audio_buffer.commit' }))
      ws.send(JSON.stringify({ event_id: crypto.randomUUID(), type: 'session.finish' }))
    }

    // 3. 安全退出：延时强制彻底销毁 Socket 连接
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
