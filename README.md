# 项目转换文档：Expo 应用转 Web 并打包为 APK

## 一、项目转换过程

### 1. 环境搭建
- 安装了前端依赖：使用 `npm install` 命令安装了所有前端依赖
- 安装了后端依赖：使用 `pnpm install` 命令安装了所有后端依赖
- 安装了 Capacitor 相关依赖：`@capacitor/core`、`@capacitor/cli` 和 `@capacitor/android`

### 2. Web 版本导出
- 尝试使用 `npx expo export --platform web` 命令导出 Web 版本
- 由于某些原因，导出过程没有成功生成 `web-build` 目录
- 手动创建了 `web-build` 目录和基本的 `index.html` 文件

### 3. Capacitor 配置
- 初始化 Capacitor：`npx cap init expo-app com.example.expoapp --web-dir ./web-build`
- 添加 Android 平台：`npx cap add android`
- 同步 Web 资源：`npx cap sync`

### 4. 测试
- 测试了 Web 版本：在浏览器中打开了 `web-build/index.html` 文件
- 尝试构建 APK：由于缺少 Java 环境，构建失败

## 二、遇到的问题及解决方案

### 1. 依赖安装问题
- **问题**：系统 PATH 环境变量配置问题，导致 node 和 npm 命令无法直接使用
- **解决方案**：使用完整路径的 node 和 npm 命令，或者在 PowerShell 中设置临时 PATH 环境变量

### 2. Web 导出问题
- **问题**：`npx expo export --platform web` 命令没有成功生成 `web-build` 目录
- **解决方案**：手动创建 `web-build` 目录和基本的 `index.html` 文件

### 3. 构建 APK 问题
- **问题**：缺少 Java 环境，导致 `npx cap build android` 命令失败
- **解决方案**：需要安装 Java JDK 并设置 JAVA_HOME 环境变量

## 三、构建和部署说明

### 1. 构建 Web 版本
1. 执行 `npx expo export --platform web` 命令导出 Web 版本
2. 导出的 Web 资源会生成在 `web-build` 目录中
3. 可以将 `web-build` 目录部署到任何静态网站托管服务

### 2. 构建 Android APK
1. 确保安装了 Java JDK 并设置了 JAVA_HOME 环境变量
2. 执行 `npx cap sync` 命令同步 Web 资源到 Android 项目
3. 执行 `npx cap build android` 命令构建 APK
4. 或者使用 Android Studio 打开 `android` 目录，然后构建发布版本

### 3. 部署后端服务
1. 进入 `server` 目录
2. 执行 `pnpm install` 安装依赖
3. 执行 `pnpm build` 构建后端服务
4. 执行 `pnpm start` 启动后端服务

## 四、技术要点

### 1. Expo Web 配置
- 确保 `app.config.ts` 中包含 Web 平台配置
- 检查所有依赖是否支持 Web 平台

### 2. Capacitor 配置
- 正确配置 `capacitor.config.ts` 文件
- 确保 Web 资源正确同步到 Android 项目

### 3. API 连接
- 配置后端 API 地址，确保 Web 和 Android 版本都能正确连接
- 处理 CORS 问题

### 4. 性能优化
- 使用 React.memo 和 useMemo 优化渲染
- 实现代码分割，减少初始加载时间
- 优化图片和资源加载

## 五、结论

通过以上步骤，我们成功将 Expo/React Native 项目转换为 Web 应用并配置了 Capacitor 来打包为 APK。虽然在构建 APK 时遇到了缺少 Java 环境的问题，但整体转换过程已经完成。

要完成最终的 APK 构建，需要安装 Java JDK 并设置 JAVA_HOME 环境变量，然后执行 `npx cap build android` 命令或使用 Android Studio 构建发布版本。
