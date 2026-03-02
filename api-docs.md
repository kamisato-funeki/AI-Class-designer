# AI Class Designer Mock API Documentation

This document provides a reference for all mock API methods located in [src/api/api.ts](file:///f:/AI_class_designer/ai-class-designer/src/api/api.ts). All methods return Promises that simulate network latency.

## 👤 User API (`userApi`)

- **[login(username, password)](file:///f:/AI_class_designer/ai-class-designer/src/api/api.ts#26-40)**
  - **Returns**: `Promise<{ token: string; user: User }>`
  - Simulates user login and returns a mock user profile with a token.

- **[logout()](file:///f:/AI_class_designer/ai-class-designer/src/stores/userStore.ts#16-21)**
  - **Returns**: `Promise<void>`
  - Clears the user session.

- **[updateProfile(data: Partial<User>)](file:///f:/AI_class_designer/ai-class-designer/src/stores/userStore.ts#22-26)**
  - **Returns**: `Promise<User>`
  - Updates and returns the new user profile data.

## 🏠 Workspace API (`workspaceApi`)

- **[getStats()](file:///f:/AI_class_designer/ai-class-designer/src/api/api.ts#58-68)**
  - **Returns**: `Promise<WorkspaceStats>`
  - Fetches dashboard statistics (course count, class count, etc.).

- **[uploadVoice(file: File)](file:///f:/AI_class_designer/ai-class-designer/src/api/api.ts#68-73)**
  - **Returns**: `Promise<{ text: string }>`
  - Simulates uploading a voice file and returning recognized text.

## 🏫 Class API (`classApi`)

- **[getClasses()](file:///f:/AI_class_designer/ai-class-designer/src/api/api.ts#76-100)**
  - **Returns**: `Promise<ClassInfo[]>`
  - Retrieves the list of classes for the user.

- **[createClass(data: Partial<ClassInfo>)](file:///f:/AI_class_designer/ai-class-designer/src/api/api.ts#100-113)**
  - **Returns**: `Promise<ClassInfo>`
  - Creates a new class with the given data.

- **[getClassTasks(classId: string)](file:///f:/AI_class_designer/ai-class-designer/src/api/api.ts#113-135)**
  - **Returns**: `Promise<ClassTask[]>`
  - Gets a list of tasks (homework, discussions) for a specific class.

- **[createTask(data: Partial<ClassTask>)](file:///f:/AI_class_designer/ai-class-designer/src/stores/classesStore.ts#36-41)**
  - **Returns**: `Promise<ClassTask>`
  - Creates a new task for a specified class.

## 📚 AI Knowledge Base RAG API (`ragApi`)

- **[getFiles()](file:///f:/AI_class_designer/ai-class-designer/src/api/api.ts#151-175)**
  - **Returns**: `Promise<RagFile[]>`
  - Lists all uploaded reference files with their tags and statuses.

- **[uploadFile(file: File)](file:///f:/AI_class_designer/ai-class-designer/src/api/api.ts#175-188)**
  - **Returns**: `Promise<RagFile>`
  - Uploads a new file to the knowledge base.

- **[deleteFile(id: string)](file:///f:/AI_class_designer/ai-class-designer/src/stores/ragStore.ts#19-23)**
  - **Returns**: `Promise<void>`
  - Deletes a file from the knowledge base.

- **[updateTags(id: string, tags: string[])](file:///f:/AI_class_designer/ai-class-designer/src/api/api.ts#192-197)**
  - **Returns**: `Promise<RagFile>`
  - Updates the tags associated with a specific file.

## 📖 Courseware API (`coursewareApi`)

- **[getCoursewares()](file:///f:/AI_class_designer/ai-class-designer/src/api/api.ts#200-228)**
  - **Returns**: `Promise<Courseware[]>`
  - Retrieves all courseware items created by the user.

- **[createCourseware(data: Partial<Courseware>)](file:///f:/AI_class_designer/ai-class-designer/src/stores/coursewareStore.ts#13-18)**
  - **Returns**: `Promise<Courseware>`
  - Initializes a new courseware project.

## 💬 Message API (`messageApi`)

- **[getMessages()](file:///f:/AI_class_designer/ai-class-designer/src/api/api.ts#246-272)**
  - **Returns**: `Promise<Message[]>`
  - Retrieves all system and user interaction messages.

- **[markAsRead(id: string)](file:///f:/AI_class_designer/ai-class-designer/src/views/MessagesView.vue#138-143)**
  - **Returns**: `Promise<void>`
  - Marks a specific message as read.

- **[deleteMessage(id: string)](file:///f:/AI_class_designer/ai-class-designer/src/api/api.ts#276-280)**
  - **Returns**: `Promise<void>`
  - Deletes a specific message.

## 🧠 Cocreation API (`cocreationApi`)

- **[getMaterials(coursewareId: string)](file:///f:/AI_class_designer/ai-class-designer/src/api/api.ts#283-292)**
  - **Returns**: `Promise<BoardMaterial[]>`
  - Fetches the generated materials (PPT, Word, Mindmap, Video) for a specific courseware ID.

- **[chat(message: string, isVoice: boolean, file?: File)](file:///f:/AI_class_designer/ai-class-designer/src/api/api.ts#292-303)**
  - **Returns**: `Promise<ChatMessage>`
  - Sends a message (or audio/file prompt) to the AI assistant and receives the AI's response.
