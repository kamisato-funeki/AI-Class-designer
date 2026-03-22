在直播、在线会议、语音聊天或智能助手等场景中，需要将连续的音频流实时转化为文字，以提供即时字幕、生成会议记录或响应语音指令。千问实时语音识别服务能够接收音频流并实时转写。

## **核心功能**

-   **多语种高精度识别：**支持多语言高精度语音识别（涵盖普通话及多种方言，如粤语、四川话等，详情请参见[模型功能特性](#ea5edc7ae4cq7)）
    
-   **复杂环境适应：**具备应对复杂声学环境的能力，支持自动语种检测与智能非人声过滤
    
-   **情感识别：**支持多种情绪状态的识别（涵盖惊讶、平静、愉快、悲伤、厌恶、愤怒和恐惧）
    

## **适用范围**

**支持的模型：**

## 中国内地

在[中国内地部署模式](https://help.aliyun.com/zh/model-studio/regions/#080da663a75xh)下，接入点与数据存储均位于**北京地域**，模型推理计算资源仅限于中国内地。

调用以下模型时，请选择北京地域的[API Key](https://bailian.console.aliyun.com/?tab=model#/api-key)：

**千问3-ASR-Flash-Realtime**：qwen3-asr-flash-realtime（稳定版，当前等同qwen3-asr-flash-realtime-2025-10-27）、qwen3-asr-flash-realtime-2026-02-10（最新快照版）、qwen3-asr-flash-realtime-2025-10-27（快照版）

## 国际

在[国际部署模式](https://help.aliyun.com/zh/model-studio/regions/#080da663a75xh)下，接入点与数据存储均位于**新加坡地域**，模型推理计算资源在全球范围内动态调度（不含中国内地）。

调用以下模型时，请选择新加坡地域的[API Key](https://modelstudio.console.aliyun.com/?tab=dashboard#/api-key)：

**千问3-ASR-Flash-Realtime**：qwen3-asr-flash-realtime（稳定版，当前等同qwen3-asr-flash-realtime-2025-10-27）、qwen3-asr-flash-realtime-2026-02-10（最新快照版）、qwen3-asr-flash-realtime-2025-10-27（快照版）

更多信息请参见[模型列表](https://help.aliyun.com/zh/model-studio/models)

## **模型选型**

| **场景** | **推荐模型** | **理由** |
| --- | --- | --- |
| **智能客服质检** | qwen3-asr-flash-realtime-2026-02-10 | 实时分析通话内容与客户情绪，辅助坐席并进行服务质量监控 |
| **直播/短视频** | 为直播内容生成实时字幕，覆盖多语种观众 |
| **在线会议/访谈** | 实时记录会议发言，快速生成文字纪要，提高信息整理效率 |

更多说明请参见[模型功能特性](#ea5edc7ae4cq7)。

## **快速开始**

## 使用DashScope SDK

## Java

1.  [安装SDK](https://help.aliyun.com/zh/model-studio/install-sdk)，确保DashScope SDK版本不低于2.22.5。
    
2.  [获取API Key](https://help.aliyun.com/zh/model-studio/get-api-key)，推荐使用环境变量配置 API Key，以避免在代码中硬编码。
    
3.  运行示例代码。
    
    更多示例代码请参见[Github](https://github.com/aliyun/alibabacloud-bailian-speech-demo/tree/master/samples/speech-recognition/recognize_speech_from_microphone_with_qwen3_asr_flash_realtime)。
    
    ```
    import com.alibaba.dashscope.audio.omni.*;
    import com.alibaba.dashscope.exception.NoApiKeyException;
    import com.google.gson.JsonObject;
    import org.slf4j.Logger;
    import org.slf4j.LoggerFactory;
    
    import javax.sound.sampled.LineUnavailableException;
    import java.io.File;
    import java.io.FileInputStream;
    import java.util.Base64;
    import java.util.Collections;
    import java.util.concurrent.CountDownLatch;
    import java.util.concurrent.atomic.AtomicReference;
    
    public class Qwen3AsrRealtimeUsage {
        private static final Logger log = LoggerFactory.getLogger(Qwen3AsrRealtimeUsage.class);
        private static final int AUDIO_CHUNK_SIZE = 1024; // Audio chunk size in bytes
        private static final int SLEEP_INTERVAL_MS = 30;  // Sleep interval in milliseconds
    
        public static void main(String[] args) throws InterruptedException, LineUnavailableException {
            CountDownLatch finishLatch = new CountDownLatch(1);
    
            OmniRealtimeParam param = OmniRealtimeParam.builder()
                    .model("qwen3-asr-flash-realtime")
                    // 以下为北京地域url，若使用新加坡地域的模型，需将url替换为：wss://dashscope-intl.aliyuncs.com/api-ws/v1/realtime
                    .url("wss://dashscope.aliyuncs.com/api-ws/v1/realtime")
                    // 新加坡和北京地域的API Key不同。获取API Key：https://help.aliyun.com/zh/model-studio/get-api-key
                    // 若没有配置环境变量，请用百炼API Key将下行替换为：.apikey("sk-xxx")
                    .apikey(System.getenv("DASHSCOPE_API_KEY"))
                    .build();
    
            OmniRealtimeConversation conversation = null;
            final AtomicReference<OmniRealtimeConversation> conversationRef = new AtomicReference<>(null);
            conversation = new OmniRealtimeConversation(param, new OmniRealtimeCallback() {
                @Override
                public void onOpen() {
                    System.out.println("connection opened");
                }
                @Override
                public void onEvent(JsonObject message) {
                    String type = message.get("type").getAsString();
                    switch(type) {
                        case "session.created":
                            System.out.println("start session: " + message.get("session").getAsJsonObject().get("id").getAsString());
                            break;
                        case "conversation.item.input_audio_transcription.completed":
                            System.out.println("transcription: " + message.get("transcript").getAsString());
                            finishLatch.countDown();
                            break;
                        case "input_audio_buffer.speech_started":
                            System.out.println("======VAD Speech Start======");
                            break;
                        case "input_audio_buffer.speech_stopped":
                            System.out.println("======VAD Speech Stop======");
                            break;
                        case "conversation.item.input_audio_transcription.text":
                            System.out.println("transcription: " + message.get("text").getAsString());
                            break;
                        default:
                            break;
                    }
                }
                @Override
                public void onClose(int code, String reason) {
                    System.out.println("connection closed code: " + code + ", reason: " + reason);
                }
            });
            conversationRef.set(conversation);
            try {
                conversation.connect();
            } catch (NoApiKeyException e) {
                throw new RuntimeException(e);
            }
    
            OmniRealtimeTranscriptionParam transcriptionParam = new OmniRealtimeTranscriptionParam();
            transcriptionParam.setLanguage("zh");
            transcriptionParam.setInputAudioFormat("pcm");
            transcriptionParam.setInputSampleRate(16000);
    
            OmniRealtimeConfig config = OmniRealtimeConfig.builder()
                    .modalities(Collections.singletonList(OmniRealtimeModality.TEXT))
                    .transcriptionConfig(transcriptionParam)
                    .build();
            conversation.updateSession(config);
    
            String filePath = "your_audio_file.pcm";
            File audioFile = new File(filePath);
            if (!audioFile.exists()) {
                log.error("Audio file not found: {}", filePath);
                return;
            }
    
            try (FileInputStream audioInputStream = new FileInputStream(audioFile)) {
                byte[] audioBuffer = new byte[AUDIO_CHUNK_SIZE];
                int bytesRead;
                int totalBytesRead = 0;
    
                log.info("Starting to send audio data from: {}", filePath);
    
                // Read and send audio data in chunks
                while ((bytesRead = audioInputStream.read(audioBuffer)) != -1) {
                    totalBytesRead += bytesRead;
                    String audioB64 = Base64.getEncoder().encodeToString(audioBuffer);
                    // Send audio chunk to conversation
                    conversation.appendAudio(audioB64);
    
                    // Add small delay to simulate real-time audio streaming
                    Thread.sleep(SLEEP_INTERVAL_MS);
                }
    
                log.info("Finished sending audio data. Total bytes sent: {}", totalBytesRead);
    
            } catch (Exception e) {
                log.error("Error sending audio from file: {}", filePath, e);
            }
    
            //send session.finish and wait for finish and close
            conversation.endSession();
            log.info("task finished");
    
            System.exit(0);
        }
    }
    ```
    

## Python

1.  [安装SDK](https://help.aliyun.com/zh/model-studio/install-sdk)，确保DashScope SDK版本不低于1.25.6。
    
2.  [获取API Key](https://help.aliyun.com/zh/model-studio/get-api-key)，推荐使用环境变量配置 API Key，以避免在代码中硬编码。
    
3.  运行示例代码。
    
    更多示例代码请参见[Github](https://github.com/aliyun/alibabacloud-bailian-speech-demo/tree/master/samples/speech-recognition/recognize_speech_from_microphone_with_qwen3_asr_flash_realtime)。
    
    ```
    import logging
    import os
    import base64
    import signal
    import sys
    import time
    import dashscope
    from dashscope.audio.qwen_omni import *
    from dashscope.audio.qwen_omni.omni_realtime import TranscriptionParams
    
    
    def setup_logging():
        """配置日志输出"""
        logger = logging.getLogger('dashscope')
        logger.setLevel(logging.DEBUG)
        handler = logging.StreamHandler(sys.stdout)
        handler.setLevel(logging.DEBUG)
        formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
        handler.setFormatter(formatter)
        logger.addHandler(handler)
        logger.propagate = False
        return logger
    
    
    def init_api_key():
        """初始化 API Key"""
        # 新加坡和北京地域的API Key不同。获取API Key：https://help.aliyun.com/zh/model-studio/get-api-key
        # 若没有配置环境变量，请用百炼API Key将下行替换为：dashscope.api_key = "sk-xxx"
        dashscope.api_key = os.environ.get('DASHSCOPE_API_KEY', 'YOUR_API_KEY')
        if dashscope.api_key == 'YOUR_API_KEY':
            print('[Warning] Using placeholder API key, set DASHSCOPE_API_KEY environment variable.')
    
    
    class MyCallback(OmniRealtimeCallback):
        """实时识别回调处理"""
        def __init__(self, conversation):
            self.conversation = conversation
            self.handlers = {
                'session.created': self._handle_session_created,
                'conversation.item.input_audio_transcription.completed': self._handle_final_text,
                'conversation.item.input_audio_transcription.text': self._handle_stash_text,
                'input_audio_buffer.speech_started': lambda r: print('======Speech Start======'),
                'input_audio_buffer.speech_stopped': lambda r: print('======Speech Stop======')
            }
    
        def on_open(self):
            print('Connection opened')
    
        def on_close(self, code, msg):
            print(f'Connection closed, code: {code}, msg: {msg}')
    
        def on_event(self, response):
            try:
                handler = self.handlers.get(response['type'])
                if handler:
                    handler(response)
            except Exception as e:
                print(f'[Error] {e}')
    
        def _handle_session_created(self, response):
            print(f"Start session: {response['session']['id']}")
    
        def _handle_final_text(self, response):
            print(f"Final recognized text: {response['transcript']}")
    
        def _handle_stash_text(self, response):
            print(f"Got stash result: {response['stash']}")
    
    
    def read_audio_chunks(file_path, chunk_size=3200):
        """按块读取音频文件"""
        with open(file_path, 'rb') as f:
            while chunk := f.read(chunk_size):
                yield chunk
    
    
    def send_audio(conversation, file_path, delay=0.1):
        """发送音频数据"""
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Audio file {file_path} does not exist.")
    
        print("Processing audio file... Press 'Ctrl+C' to stop.")
        for chunk in read_audio_chunks(file_path):
            audio_b64 = base64.b64encode(chunk).decode('ascii')
            conversation.append_audio(audio_b64)
            time.sleep(delay)
    
    def main():
        setup_logging()
        init_api_key()
    
        audio_file_path = "./your_audio_file.pcm"
        conversation = OmniRealtimeConversation(
            model='qwen3-asr-flash-realtime',
            # 以下为北京地域url，若使用新加坡地域的模型，需将url替换为：wss://dashscope-intl.aliyuncs.com/api-ws/v1/realtime
            url='wss://dashscope.aliyuncs.com/api-ws/v1/realtime',
            callback=MyCallback(conversation=None)  # 暂时传None，稍后注入
        )
    
        # 注入自身到回调
        conversation.callback.conversation = conversation
    
        def handle_exit(sig, frame):
            print('Ctrl+C pressed, exiting...')
            conversation.close()
            sys.exit(0)
    
        signal.signal(signal.SIGINT, handle_exit)
    
        conversation.connect()
    
        transcription_params = TranscriptionParams(
            language='zh',
            sample_rate=16000,
            input_audio_format="pcm"
        )
    
        conversation.update_session(
            output_modalities=[MultiModality.TEXT],
            enable_input_audio_transcription=True,
            transcription_params=transcription_params
        )
    
        try:
            send_audio(conversation, audio_file_path)
            # send session.finish and wait for finished and close
            conversation.end_session()
        except Exception as e:
            print(f"Error occurred: {e}")
        finally:
            conversation.close()
            print("Audio processing completed.")
    
    
    if __name__ == '__main__':
        main()
    ```
    

## 使用WebSocket API

以下示例演示如何通过 WebSocket 连接发送本地音频文件并获取识别结果。

1.  **获取API Key：**[获取API Key](https://help.aliyun.com/zh/model-studio/get-api-key)，安全起见，推荐将API Key配置到环境变量。
    
2.  **编写并运行代码：**通过代码实现认证、连接、发送音频和接收结果的完整流程（详情请参见[交互流程](https://help.aliyun.com/zh/model-studio/qwen-asr-realtime-interaction-process#1b15e5c235azv)）。
    
    ## Python
    
    在运行示例前，请确保已使用以下命令安装依赖：
    
    ```
    pip uninstall websocket-client
    pip uninstall websocket
    pip install websocket-client
    ```
    
    请不要将示例代码文件命名为 `websocket.py`，否则可能触发如下错误：AttributeError: module 'websocket' has no attribute 'WebSocketApp'. Did you mean: 'WebSocket'?
    
    ```
    # pip install websocket-client
    import os
    import time
    import json
    import threading
    import base64
    import websocket
    import logging
    import logging.handlers
    from datetime import datetime
    
    logger = logging.getLogger(__name__)
    logger.setLevel(logging.DEBUG)
    
    # 新加坡和北京地域的API Key不同。获取API Key：https://help.aliyun.com/zh/model-studio/get-api-key
    # 若没有配置环境变量，请用百炼API Key将下行替换为：API_KEY="sk-xxx"
    API_KEY = os.environ.get("DASHSCOPE_API_KEY", "sk-xxx")
    QWEN_MODEL = "qwen3-asr-flash-realtime"
    # 以下是北京地域baseUrl，如果使用新加坡地域的模型，需要将baseUrl替换为：wss://dashscope-intl.aliyuncs.com/api-ws/v1/realtime
    baseUrl = "wss://dashscope.aliyuncs.com/api-ws/v1/realtime"
    url = f"{baseUrl}?model={QWEN_MODEL}"
    print(f"Connecting to server: {url}")
    
    # 注意： 如果是非vad模式，建议持续发送的音频时长累加不超过60s
    enableServerVad = True
    is_running = True  # 增加运行标志位
    
    headers = [
        "Authorization: Bearer " + API_KEY,
        "OpenAI-Beta: realtime=v1"
    ]
    
    def init_logger():
        formatter = logging.Formatter('%(asctime)s|%(levelname)s|%(message)s')
        f_handler = logging.handlers.RotatingFileHandler(
            "omni_tester.log", maxBytes=100 * 1024 * 1024, backupCount=3
        )
        f_handler.setLevel(logging.DEBUG)
        f_handler.setFormatter(formatter)
    
        console = logging.StreamHandler()
        console.setLevel(logging.DEBUG)
        console.setFormatter(formatter)
    
        logger.addHandler(f_handler)
        logger.addHandler(console)
    
    def on_open(ws):
        logger.info("Connected to server.")
    
        # 会话更新事件
        event_manual = {
            "event_id": "event_123",
            "type": "session.update",
            "session": {
                "modalities": ["text"],
                "input_audio_format": "pcm",
                "sample_rate": 16000,
                "input_audio_transcription": {
                    # 语种标识，可选，如果有明确的语种信息，建议设置
                    "language": "zh"
                },
                "turn_detection": None
            }
        }
        event_vad = {
            "event_id": "event_123",
            "type": "session.update",
            "session": {
                "modalities": ["text"],
                "input_audio_format": "pcm",
                "sample_rate": 16000,
                "input_audio_transcription": {
                    "language": "zh"
                },
                "turn_detection": {
                    "type": "server_vad",
                    "threshold": 0.0,
                    "silence_duration_ms": 400
                }
            }
        }
        if enableServerVad:
            logger.info(f"Sending event: {json.dumps(event_vad, indent=2)}")
            ws.send(json.dumps(event_vad))
        else:
            logger.info(f"Sending event: {json.dumps(event_manual, indent=2)}")
            ws.send(json.dumps(event_manual))
    
    def on_message(ws, message):
        global is_running
        try:
            data = json.loads(message)
            logger.info(f"Received event: {json.dumps(data, ensure_ascii=False, indent=2)}")
            if data.get("type") == "session.finished":
                logger.info(f"Final transcript: {data.get('transcript')}")
                logger.info("Closing WebSocket connection after session finished...")
                is_running = False  # 停止音频发送线程
                ws.close()
        except json.JSONDecodeError:
            logger.error(f"Failed to parse message: {message}")
    
    def on_error(ws, error):
        logger.error(f"Error: {error}")
    
    def on_close(ws, close_status_code, close_msg):
        logger.info(f"Connection closed: {close_status_code} - {close_msg}")
    
    def send_audio(ws, local_audio_path):
        time.sleep(3)  # 等待会话更新完成
        global is_running
    
        with open(local_audio_path, 'rb') as audio_file:
            logger.info(f"文件读取开始: {datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f')[:-3]}")
            while is_running:
                audio_data = audio_file.read(3200)  # ~0.1s PCM16/16kHz
                if not audio_data:
                    logger.info(f"文件读取完毕: {datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f')[:-3]}")
                    if ws.sock and ws.sock.connected:
                        if not enableServerVad:
                            commit_event = {
                                "event_id": "event_789",
                                "type": "input_audio_buffer.commit"
                            }
                            ws.send(json.dumps(commit_event))
                        finish_event = {
                            "event_id": "event_987",
                            "type": "session.finish"
                        }
                        ws.send(json.dumps(finish_event))
                    break
    
                if not ws.sock or not ws.sock.connected:
                    logger.info("WebSocket已关闭，停止发送音频。")
                    break
    
                encoded_data = base64.b64encode(audio_data).decode('utf-8')
                eventd = {
                    "event_id": f"event_{int(time.time() * 1000)}",
                    "type": "input_audio_buffer.append",
                    "audio": encoded_data
                }
                ws.send(json.dumps(eventd))
                logger.info(f"Sending audio event: {eventd['event_id']}")
                time.sleep(0.1)  # 模拟实时采集
    
    # 初始化日志
    init_logger()
    logger.info(f"Connecting to WebSocket server at {url}...")
    
    local_audio_path = "your_audio_file.pcm"
    ws = websocket.WebSocketApp(
        url,
        header=headers,
        on_open=on_open,
        on_message=on_message,
        on_error=on_error,
        on_close=on_close
    )
    
    thread = threading.Thread(target=send_audio, args=(ws, local_audio_path))
    thread.start()
    ws.run_forever()
    ```
    
    ## Java
    
    在运行示例前，请确保已安装Java-WebSocket依赖：
    
    ## Maven
    
    ```
    <dependency>
        <groupId>org.java-websocket</groupId>
        <artifactId>Java-WebSocket</artifactId>
        <version>1.5.6</version>
    </dependency>
    ```
    
    ## Gradle
    
    ```
    implementation 'org.java-websocket:Java-WebSocket:1.5.6'
    ```
    
    ```
    import org.java_websocket.client.WebSocketClient;
    import org.java_websocket.handshake.ServerHandshake;
    import org.json.JSONObject;
    
    import java.net.URI;
    import java.nio.file.Files;
    import java.nio.file.Paths;
    import java.util.Base64;
    import java.util.concurrent.atomic.AtomicBoolean;
    import java.util.logging.*;
    
    public class QwenASRRealtimeClient {
    
        private static final Logger logger = Logger.getLogger(QwenASRRealtimeClient.class.getName());
        // 新加坡和北京地域的API Key不同。获取API Key：https://help.aliyun.com/zh/model-studio/get-api-key
        // 若没有配置环境变量，请用百炼API Key将下行替换为：private static final String API_KEY = "sk-xxx"
        private static final String API_KEY = System.getenv().getOrDefault("DASHSCOPE_API_KEY", "sk-xxx");
        private static final String MODEL = "qwen3-asr-flash-realtime";
    
        // 控制是否使用 VAD 模式
        private static final boolean enableServerVad = true;
    
        private static final AtomicBoolean isRunning = new AtomicBoolean(true);
        private static WebSocketClient client;
    
        public static void main(String[] args) throws Exception {
            initLogger();
    
            // 以下是北京地域baseUrl，如果使用新加坡地域的模型，需要将baseUrl替换为：wss://dashscope-intl.aliyuncs.com/api-ws/v1/realtime
            String baseUrl = "wss://dashscope.aliyuncs.com/api-ws/v1/realtime";
            String url = baseUrl + "?model=" + MODEL;
            logger.info("Connecting to server: " + url);
    
            client = new WebSocketClient(new URI(url)) {
                @Override
                public void onOpen(ServerHandshake handshake) {
                    logger.info("Connected to server.");
                    sendSessionUpdate();
                }
    
                @Override
                public void onMessage(String message) {
                    try {
                        JSONObject data = new JSONObject(message);
                        String eventType = data.optString("type");
    
                        logger.info("Received event: " + data.toString(2));
    
                        // 收到结束事件 → 停止发送线程并关闭连接
                        if ("session.finished".equals(eventType)) {
                            logger.info("Final transcript: " + data.optString("transcript"));
                            logger.info("Closing WebSocket connection after session finished...");
    
                            isRunning.set(false); // 停止发送音频线程
                            if (this.isOpen()) {
                                this.close(1000, "ASR finished");
                            }
                        }
                    } catch (Exception e) {
                        logger.severe("Failed to parse message: " + message);
                    }
                }
    
                @Override
                public void onClose(int code, String reason, boolean remote) {
                    logger.info("Connection closed: " + code + " - " + reason);
                }
    
                @Override
                public void onError(Exception ex) {
                    logger.severe("Error: " + ex.getMessage());
                }
            };
    
            // 添加请求头
            client.addHeader("Authorization", "Bearer " + API_KEY);
            client.addHeader("OpenAI-Beta", "realtime=v1");
    
            client.connectBlocking(); // 阻塞直到连接建立
    
            // 替换为待识别的音频文件路径
            String localAudioPath = "your_audio_file.pcm";
            Thread audioThread = new Thread(() -> {
                try {
                    sendAudio(localAudioPath);
                } catch (Exception e) {
                    logger.severe("Audio sending thread error: " + e.getMessage());
                }
            });
            audioThread.start();
        }
    
        /** 会话更新事件（开启/关闭 VAD） */
        private static void sendSessionUpdate() {
            JSONObject eventNoVad = new JSONObject()
                    .put("event_id", "event_123")
                    .put("type", "session.update")
                    .put("session", new JSONObject()
                            .put("modalities", new String[]{"text"})
                            .put("input_audio_format", "pcm")
                            .put("sample_rate", 16000)
                            .put("input_audio_transcription", new JSONObject()
                                    .put("language", "zh"))
                            .put("turn_detection", JSONObject.NULL) // 手动模式
                    );
    
            JSONObject eventVad = new JSONObject()
                    .put("event_id", "event_123")
                    .put("type", "session.update")
                    .put("session", new JSONObject()
                            .put("modalities", new String[]{"text"})
                            .put("input_audio_format", "pcm")
                            .put("sample_rate", 16000)
                            .put("input_audio_transcription", new JSONObject()
                                    .put("language", "zh"))
                            .put("turn_detection", new JSONObject()
                                    .put("type", "server_vad")
                                    .put("threshold", 0.0)
                                    .put("silence_duration_ms", 400))
                    );
    
            if (enableServerVad) {
                logger.info("Sending event (VAD):\n" + eventVad.toString(2));
                client.send(eventVad.toString());
            } else {
                logger.info("Sending event (Manual):\n" + eventNoVad.toString(2));
                client.send(eventNoVad.toString());
            }
        }
    
        /** 发送音频文件流 */
        private static void sendAudio(String localAudioPath) throws Exception {
            Thread.sleep(3000); // 等会话准备
            byte[] allBytes = Files.readAllBytes(Paths.get(localAudioPath));
            logger.info("文件读取开始");
    
            int offset = 0;
            while (isRunning.get() && offset < allBytes.length) {
                int chunkSize = Math.min(3200, allBytes.length - offset);
                byte[] chunk = new byte[chunkSize];
                System.arraycopy(allBytes, offset, chunk, 0, chunkSize);
                offset += chunkSize;
    
                if (client != null && client.isOpen()) {
                    String encoded = Base64.getEncoder().encodeToString(chunk);
                    JSONObject eventd = new JSONObject()
                            .put("event_id", "event_" + System.currentTimeMillis())
                            .put("type", "input_audio_buffer.append")
                            .put("audio", encoded);
    
                    client.send(eventd.toString());
                    logger.info("Sending audio event: " + eventd.getString("event_id"));
                } else {
                    break; // 避免在断开后继续发送
                }
    
                Thread.sleep(100); // 模拟实时发送
            }
    
            logger.info("文件读取完毕");
    
            if (client != null && client.isOpen()) {
                // 非 VAD 模式下需要 commit
                if (!enableServerVad) {
                    JSONObject commitEvent = new JSONObject()
                            .put("event_id", "event_789")
                            .put("type", "input_audio_buffer.commit");
                    client.send(commitEvent.toString());
                    logger.info("Sent commit event for manual mode.");
                }
    
                JSONObject finishEvent = new JSONObject()
                        .put("event_id", "event_987")
                        .put("type", "session.finish");
                client.send(finishEvent.toString());
                logger.info("Sent finish event.");
            }
        }
    
        /** 初始化日志 */
        private static void initLogger() {
            logger.setLevel(Level.ALL);
            Logger rootLogger = Logger.getLogger("");
            for (Handler h : rootLogger.getHandlers()) {
                rootLogger.removeHandler(h);
            }
    
            Handler consoleHandler = new ConsoleHandler();
            consoleHandler.setLevel(Level.ALL);
            consoleHandler.setFormatter(new SimpleFormatter());
            logger.addHandler(consoleHandler);
        }
    }
    ```
    
    ## Node.js
    
    在运行示例前，请确保已使用以下命令安装依赖：
    
    ```
    npm install ws
    ```
    
    ```
    /**
     * Qwen-ASR Realtime WebSocket 客户端（Node.js版）
     * 功能：
     * - 支持 VAD 模式和 Manual 模式
     * - 发送 session.update 启动会话
     * - 持续发送音频块 input_audio_buffer.append
     * - 如果是Manual模式，需要发送 input_audio_buffer.commit
     * - 发送session.finish事件
     * - 收到 session.finished 事件后关闭连接
     */
    
    import WebSocket from 'ws';
    import fs from 'fs';
    
    // ===== 配置 =====
    // 新加坡和北京地域的API Key不同。获取API Key：https://help.aliyun.com/zh/model-studio/get-api-key
    // 若没有配置环境变量，请用百炼API Key将下行替换为：const API_KEY = "sk-xxx"
    const API_KEY = process.env.DASHSCOPE_API_KEY || 'sk-xxx';
    const MODEL = 'qwen3-asr-flash-realtime';
    const enableServerVad = true; // true为VAD模式，false为Manual模式
    const localAudioPath = 'your_audio_file.pcm'; // PCM16、16kHz音频文件路径
    
    // 以下是北京地域baseUrl，如果使用新加坡地域的模型，需要将baseUrl替换为：wss://dashscope-intl.aliyuncs.com/api-ws/v1/realtime
    const baseUrl = 'wss://dashscope.aliyuncs.com/api-ws/v1/realtime';
    const url = `${baseUrl}?model=${MODEL}`;
    
    console.log(`Connecting to server: ${url}`);
    
    // ===== 状态控制 =====
    let isRunning = true;
    
    // ===== 建立连接 =====
    const ws = new WebSocket(url, {
        headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'OpenAI-Beta': 'realtime=v1'
        }
    });
    
    // ===== 事件绑定 =====
    ws.on('open', () => {
        console.log('[WebSocket] Connected to server.');
        sendSessionUpdate();
        // 启动音频发送线程
        sendAudio(localAudioPath);
    });
    
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            console.log('[Received Event]:', JSON.stringify(data, null, 2));
    
            // 收到结束事件
            if (data.type === 'session.finished') {
                console.log(`[Final Transcript] ${data.transcript}`);
                console.log('[Action] Closing WebSocket connection after session finished...');
                
                if (ws.readyState === WebSocket.OPEN) {
                    ws.close(1000, 'ASR finished');
                }
            }
        } catch (e) {
            console.error('[Error] Failed to parse message:', message);
        }
    });
    
    ws.on('close', (code, reason) => {
        console.log(`[WebSocket] Connection closed: ${code} - ${reason}`);
    });
    
    ws.on('error', (err) => {
        console.error('[WebSocket Error]', err);
    });
    
    // ===== 会话更新 =====
    function sendSessionUpdate() {
        const eventNoVad = {
            event_id: 'event_123',
            type: 'session.update',
            session: {
                modalities: ['text'],
                input_audio_format: 'pcm',
                sample_rate: 16000,
                input_audio_transcription: {
                    language: 'zh'
                },
                turn_detection: null
            }
        };
    
        const eventVad = {
            event_id: 'event_123',
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
        };
    
        if (enableServerVad) {
            console.log('[Send Event] VAD Mode:\n', JSON.stringify(eventVad, null, 2));
            ws.send(JSON.stringify(eventVad));
        } else {
            console.log('[Send Event] Manual Mode:\n', JSON.stringify(eventNoVad, null, 2));
            ws.send(JSON.stringify(eventNoVad));
        }
    }
    
    // ===== 发送音频文件流 =====
    function sendAudio(audioPath) {
        setTimeout(() => {
            console.log(`[File Read Start] ${audioPath}`);
            const buffer = fs.readFileSync(audioPath);
    
            let offset = 0;
            const chunkSize = 3200; // 约0.1s的PCM16音频
    
            function sendChunk() {
                if (!isRunning) return;
                if (offset >= buffer.length) {
                    isRunning = false; // 停止发送音频
                    console.log('[File Read End]');
                    if (ws.readyState === WebSocket.OPEN) {
                        if (!enableServerVad) {
                            const commitEvent = {
                                event_id: 'event_789',
                                type: 'input_audio_buffer.commit'
                            };
                            ws.send(JSON.stringify(commitEvent));
                            console.log('[Send Commit Event]');
                        }
    
                        const finishEvent = {
                            event_id: 'event_987',
                            type: 'session.finish'
                        };
                        ws.send(JSON.stringify(finishEvent));
                        console.log('[Send Finish Event]');
                    }
                    
                    return;
                }
    
                if (ws.readyState !== WebSocket.OPEN) {
                    console.log('[Stop] WebSocket is not open.');
                    return;
                }
    
                const chunk = buffer.slice(offset, offset + chunkSize);
                offset += chunkSize;
    
                const encoded = chunk.toString('base64');
                const appendEvent = {
                    event_id: `event_${Date.now()}`,
                    type: 'input_audio_buffer.append',
                    audio: encoded
                };
    
                ws.send(JSON.stringify(appendEvent));
                console.log(`[Send Audio Event] ${appendEvent.event_id}`);
    
                setTimeout(sendChunk, 100); // 模拟实时发送
            }
    
            sendChunk();
        }, 3000); // 等待会话配置完成
    }
    ```
    

## **API参考**

[实时语音识别-千问API参考](https://help.aliyun.com/zh/model-studio/qwen-asr-realtime-api/)

## **模型功能特性**

| **功能/特性** | **qwen3-asr-flash-realtime、****qwen3-asr-flash-realtime-2026-02-10、****qwen3-asr-flash-realtime-2025-10-27** |
| --- | --- |
| **支持语言** | 中文（普通话、四川话、闽南语、吴语、粤语）、英语、日语、德语、韩语、俄语、法语、葡萄牙语、阿拉伯语、意大利语、西班牙语、印地语、印尼语、泰语、土耳其语、乌克兰语、越南语、捷克语、丹麦语、菲律宾语、芬兰语、冰岛语、马来语、挪威语、波兰语、瑞典语 |
| **支持的音频格式** | pcm、opus |
| **采样率** | 8kHz、16kHz |
| **声道** | 单声道 |
| **输入形式** | 二进制音频流 |
| **音频大小/时长** | 不限  |
| **情感识别** | 支持 固定开启 |
| **敏感词过滤** | 不支持 |
| **说话人分离** | 不支持 |
| **语气词过滤** | 不支持 |
| **时间戳** | 不支持 |
| **标点符号预测** | 支持 固定开启 |
| **ITN（Inverse Text Normalization，逆文本正则化）** | 不支持 |
| **VAD（Voice Activity Detection，语音活动检测）** | 支持 固定开启 |
| **限流（RPS）** | 20  |
| **接入方式** | Java/Python SDK、WebSocket API |
| **价格** | 中国内地：0.00033元/秒 国际：0.00066元/秒 |

## **模型应用上架及备案**

参见[应用合规备案](https://help.aliyun.com/zh/model-studio/compliance-and-launch-filing-guide-for-ai-apps-powered-by-the-tongyi-model)。

 span.aliyun-docs-icon { color: transparent !important; font-size: 0 !important; } span.aliyun-docs-icon:before { color: black; font-size: 16px; } span.aliyun-docs-icon.icon-size-20:before { font-size: 20px; } span.aliyun-docs-icon.icon-size-22:before { font-size: 22px; } span.aliyun-docs-icon.icon-size-24:before { font-size: 24px; } span.aliyun-docs-icon.icon-size-26:before { font-size: 26px; } span.aliyun-docs-icon.icon-size-28:before { font-size: 28px; }