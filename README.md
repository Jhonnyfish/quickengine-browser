# 快擎浏览器

快擎浏览器是一个基于 Chromium 的桌面浏览器起步项目。当前实现采用 Electron 作为 Chromium 运行时，先完成可运行的浏览器外壳，后续可以继续扩展书签、下载管理、隐私模式、扩展系统、账号同步和更深层的 Chromium 定制。

## 当前功能

- Chromium 网页渲染
- 多标签页
- 地址栏输入网址或搜索词
- 前进、后退、刷新、停止加载、主页
- favicon、网页标题和基础加载状态
- 常用快捷键：`Ctrl+L`、`Ctrl+T`、`Ctrl+W`、`F5`

## 本地运行

安装依赖：

```bash
npm install
```

启动：

```bash
npm start
```

静态检查：

```bash
npm run lint
```

## 技术路线

第一阶段建议继续保持 Electron 路线，因为它能快速获得 Chromium 内核、跨平台窗口、更新和打包能力。等产品形态稳定后，再评估是否需要直接维护 Chromium fork；那会带来更高的源码同步、编译、补丁维护和安全更新成本。
