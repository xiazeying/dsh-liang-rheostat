# 小梁滑动变阻器 · DSH Liang Rheostat

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![DSH Desktop plugin](https://img.shields.io/badge/DSH-Desktop%20plugin-4c6ef5)](https://github.com/xiazeying/dsh-liang-rheostat)

一个给 **DeepSeek Harness (DSH) Desktop** 用的装饰型插件：在输入框工具行、模型选择器左侧放一条 **8 档滑动变阻器**。拖动它，既会切换整个 DSH 界面的壁纸，也会把当前会话的模型推理等级切到对应档位。

> 当前版本：`1.0.7` · 许可证：MIT · 适用：DSH Desktop Web UI（在 `0.2.2-rc.5` 上验证）

![小梁滑动变阻器壁纸](assets/wallpaper/7.jpg)

## 演示视频

[▶ 点击观看完整使用效果（docs/demo.mp4）](docs/demo.mp4)

<video src="docs/demo.mp4" controls muted playsinline width="100%"></video>

如果上面的视频标签没有内嵌播放，点击上面的链接即可在 GitHub 中打开 `docs/demo.mp4`。

## 它是什么

一条 8 档的滑动变阻器：

**小梁 → 梁子 → 梁叔 → 梁半圣 → 梁圣 → 梁帝 → 梁祖 → 唯一真神**

- 第一档和最后一档的名字常驻两端；鼠标滑过轨道或拖动滑块时，在滑块上方显示当前档位名和推理等级。
- 滑块是连续拖动的，松手吸附到最近的节点，档位由位置自动计算。
- 每一档对应两张壁纸，共 16 张：第一次进入该档用奇数图，下一次再进入用偶数图。
- 切换壁纸使用 **1.1 秒双层交叉淡入淡出**：旧图与新图同时在场，色调渐变，不会先黑一下再闪出新图。
- 壁纸覆盖整个应用：左侧菜单、工作区、会话区、右侧面板都透出同一张图。
- 启用时 UI 使用深色玻璃配色，浅色文字在偏暗的壁纸上仍然可读；停用插件后恢复原主题。

## 档位、壁纸与推理等级

| 档位 | 名称 | 壁纸 | 推理等级 |
| ---: | --- | --- | --- |
| 1 | 小梁 | `1.jpg` / `2.jpg` | `off` |
| 2 | 梁子 | `3.jpg` / `4.jpg` | `off` |
| 3 | 梁叔 | `5.jpg` / `6.jpg` | `low` |
| 4 | 梁半圣 | `7.jpg` / `8.jpg` | `low` |
| 5 | 梁圣 | `9.jpg` / `10.jpg` | `high` |
| 6 | 梁帝 | `11.jpg` / `12.jpg` | `high` |
| 7 | 梁祖 | `13.jpg` / `14.jpg` | `max` |
| 8 | 唯一真神 | `15.jpg` / `16.jpg` | `max` |

推理等级每两档一组。滑到某一档时，插件通过 DSH 的 `session.selectModel` 为当前会话选择对应 effort；效果和模型菜单里手动选择一致：

- 正在运行的步骤保持已开始的等级，下一步生效。
- 和模型菜单一样，选择也会在后台同步为默认模型选择，新会话沿用。
- 打开或切换会话、或者在模型菜单里改推理等级时，滑块和背景会自动同步到该等级所在的档位。

## 安装

### 前置条件

- 已安装并能正常打开 **DSH Desktop**。
- DSH 版本包含 `conversation.input.right` 这个 composer 槽位；本插件在 `0.2.2-rc.5` 上开发和验证。
- 不需要单独安装 Node、pnpm 或任何运行时。

### 从源码安装

```bash
git clone https://github.com/xiazeying/dsh-liang-rheostat.git
```

1. 打开 DSH Desktop。
2. 进入 **Plugins / 插件**，使用 **Add plugin / 添加插件**，选择克隆下来的 `dsh-liang-rheostat` 目录（这个目录本身就是一个 DSH bundle，包含 `cordis.patch.yml`）。
3. 启用插件。首次安装后建议刷新页面；如果滑块样式或版本号没有更新，完全退出并重新打开 DSH，让客户端 bundle 重新生成。
4. 打开一个已有会话，滑动条会出现在输入框工具行、模型选择器左侧。

插件是一个**本地 bundle**，不发布到 npm，也不需要构建。它的 `package.json` 里声明了 `dsh.bundle.patch`、`dsh.client` 和资源导出。

### 开发者方式

如果你在用 DSH 的 `plugin_manager` 工具：

```text
plugin_manager install_bundle  <绝对路径>/dsh-liang-rheostat
```

安装后确认插件行启用；客户端 bundle 有缓存时刷新或重启一次。

## 使用

- **拖动**：连续拖动滑块，松手吸附到最近档位。
- **键盘**：方向键切换一档，Home/End 到头/尾，PageUp/PageDown 一次两档。
- **端点名字**：两端名称可直接点击跳转。
- **悬停标签**：显示当前档位名和推理等级；中文界面下等级为“关 / 低 / 高 / 极”，英文界面为 `Off / Low / High / Max`。
- **版本确认**：悬停滑块会显示原生提示 `小梁滑动变阻器 · v1.0.7`；悬停气泡也会带 `v1.0.7`。
- **背景更新**：切换档位后，旧图与新图做 1.1 秒交叉淡入；如果图片缺失，保留深色渐变底，滑块和推理等级仍然可用。

## 自定义

### 换壁纸

16 张图都在 `assets/wallpaper/1.jpg`–`16.jpg`。直接用同名文件替换即可；如果希望改成自己的 16 张图：

| 文件 | 档位 |
| --- | --- |
| `1.jpg` / `2.jpg` | 小梁 |
| `3.jpg` / `4.jpg` | 梁子 |
| `5.jpg` / `6.jpg` | 梁叔 |
| `7.jpg` / `8.jpg` | 梁半圣 |
| `9.jpg` / `10.jpg` | 梁圣 |
| `11.jpg` / `12.jpg` | 梁帝 |
| `13.jpg` / `14.jpg` | 梁祖 |
| `15.jpg` / `16.jpg` | 唯一真神 |

替换后刷新页面或重新启用插件。图片通过 DSH 的 `/plugins/<package>/assets/...` 资源路由读取，不需要改服务器，也不需要把图片放进某个固定目录。

### 改名称、等级和亮度

- 档位名称：`client.js` 里的 `TIER_NAMES`。
- 档位到推理等级：`TIER_EFFORTS`（每两档一个等级）。
- 暗角和提亮：`IMAGE_SCRIMS`、`IMAGE_BRIGHTNESS`。
- 主题玻璃色：`GLASS_OVERRIDES` 和 `DARK_TOKENS`。
- 版本提示：`BUILD` 与 `package.json` 的 `version`。

`client.js` 是普通 JavaScript，由 `window.__ModuleLoader__.load({...})` 注册，没有 TypeScript、JSX 或编译步骤。`index.js` 是空的 Host 半边，插件是纯 Client UI。

## 实现简介

- **Client half**：注册 `conversation.input.right` 槽位，渲染滑动条；用 `ctx.modelDirectories` 读取当前会话的模型目录并调用 `directory.select()`；用 `ctx.theme.overrideTokens()` 安装深色玻璃色板；用 `ctx.locale` 提供中文/英文文案。
- **壁纸层**：在 AppFrame 内注入两层壁纸容器（位于 frame 背景之上、三栏背景之下），用 opacity 交叉淡入；AppFrame 的主背景透明，侧栏/会话列使用约 10% 的深色染色，让图片透出。
- **资源**：16 张 JPEG 随插件发布，走浏览器已有的 `/plugins` 包资源路由，不依赖 `/api/file` 的认证。
- **Host half**：`index.js` 为空，不需要 Host 服务。

## 已知限制

- 依赖 DSH 的若干 UI 契约：`[data-slot='root']`、`[data-slot='main']`、`[data-slot='sidebar']`、`[data-composer-card]`。DSH 升级重命名这些标记后，壁纸或染色可能需要同步调整。
- 客户端 bundle 由 Host 进程缓存。更新插件后如果看到旧版本号（例如还是 `v1.0.6`），先刷新；仍不生效就完全退出重开 DSH。
- 插件启用期间会强制深色玻璃主题；这是为了让浅色文字在偏暗的壁纸上可读。停用即恢复。
- 子代理会话没有模型选择权限，背景仍可切换，但推理等级会提示不可用。
- 无会话的驻留输入框（例如尚未选择工作区的首页）不显示滑块；有会话后出现。
- 滑块本身始终可交互；如果会话已失效或已移除，背景仍可切换，推理等级会提示不可用。
- **演示素材**：16 张壁纸和 `docs/demo.mp4` 是作者提供的演示素材，可能涉及真实人物肖像等权利；代码以 MIT 发布，但再分发演示素材前请自行确认权利，或替换成自己的素材。详见 [NOTICE.md](NOTICE.md)。

## License

源码以 **MIT License** 发布，任何人可以自由使用、修改、分发、再许可或出售，保留版权与许可声明即可。见 [LICENSE](LICENSE)。

演示壁纸和演示视频的说明见 [NOTICE.md](NOTICE.md)。

## English

A DSH Desktop plugin that adds an eight-stop **Liang Rheostat** to the left of the composer's model selector. Dragging it cross-fades the whole-app wallpaper (two demo images per tier, 1.1s layered cross-fade) and sets the current session's reasoning effort through DSH's model-selection API. Source is MIT-licensed; the demo wallpapers/video are author-provided demo assets — check your rights before redistributing them, or replace them with your own.

Watch the demo: [docs/demo.mp4](docs/demo.mp4).

## 贡献

欢迎 Issue、PR、fork 和二次创作。如果做了新的档位、主题或壁纸玩法，欢迎开 PR 分享。
