# 与官方前端的差异（同步记录）

本仓库 = 官方 [QuantumNous/new-api](https://github.com/QuantumNous/new-api) `web/` 的普通用户裁剪版。
目标是**与官方保持尽量小的差异**，官方升级时可以按文件移植。

## 基线

| 项 | 值 |
| --- | --- |
| 官方版本 | `v1.0.0-rc.37`（commit `385d2dfd10d821b25c8a6766bd16eea248cb1652`） |
| 原样导入提交 | `Import New API web frontend @ v1.0.0-rc.37`（本仓库） |
| 后端版本要求 | 与基线相同 tag；部署仓库 `deploy/server/.env.example` 的 `NEW_API_TAG` |

代码中所有改动点都带有 `[user-ui]` 注释，可 `grep -rn '\[user-ui\]' src` 定位。

## 裁剪内容

**删除的路由**：`/channels`、`/models/*`、`/users`、`/redemption-codes`、`/subscriptions`（套餐管理）、
`/system-info`、`/task-plugins`、`/system-settings/*`、`/setup`。访问这些地址显示 404。

**整目录删除的功能**：`channels`、`models`、`model-pricing`、`redemption-codes`、`setup`、`system-info`、`system-update`。

**部分保留的功能目录**（只留被用户功能引用的文件）：

| 目录 | 保留 | 引用方 |
| --- | --- | --- |
| `features/subscriptions` | `api`、`types`、`lib`、订阅购买弹窗 | 钱包 |
| `features/users` | `api`、`types` | 使用日志（管理员视角的用户查询） |
| `features/task-plugins` | 插件图标组件与 `lib/plugin-icon` | 定价页 |
| `features/system-settings` | `utils/section-registry`、`general/channel-affinity/*` | 看板、使用日志 |

**保留未删**：`src/components`、`src/hooks`、`src/lib`、`src/stores` 下的通用组件即使暂时无人引用也保留（官方工具箱的一部分，减少差异）。

## 修改的文件

| 文件 | 改动 |
| --- | --- |
| `src/routes/__root.tsx` | 去掉初始化状态检查与跳转 `/setup`，只保留会话初始化 |
| `src/hooks/use-sidebar-data.ts` | 去掉侧边栏 `admin` 分组 |
| `src/components/layout/lib/sidebar-view-registry.ts` | 去掉系统设置嵌套侧边栏（`SIDEBAR_VIEWS = []`） |
| `src/components/layout/index.ts` | 去掉 `SYSTEM_SETTINGS_VIEW` 导出 |
| `src/components/layout/components/app-header.tsx`、`public-header.tsx` | 去掉版本更新按钮（管理员功能） |
| `src/components/profile-dropdown.tsx` | 去掉"系统设置"菜单项 |
| `src/features/dashboard/components/overview/overview-dashboard.tsx` | 去掉"渠道"快捷入口 |
| `src/routeTree.gen.ts` | 由路由插件重新生成 |
| `src/features/pricing/lib/__tests__/billing-expression.test.ts` | 契约文件路径改为 `contracts/billingexpr/` |
| `src/hooks/__tests__/sidebar-config.test.tsx` | 删除 1 个依赖管理端配置序列化的用例 |
| `src/lib/__tests__/server-error-notifications.test.ts` | 删除 3 个以管理端接口为被测对象的用例 |

新增：`contracts/billingexpr/frontend_simulation.json`（官方 `pkg/billingexpr/testdata/` 同名文件，后端计费表达式契约）。

## SwarmRouter 定制（2026-10 重绘）

需求、决策与工作包见部署仓库 `docs/notes/ui-redesign-ledger.md`。原则：**禁用不删除**（开关集中在一处）、
文案通过 i18n 覆盖层改而不改官方词条、官方逻辑层（`features/*/api.ts`、hooks、`lib`、`stores`）只读。

**新增文件（本仓库原创）**

| 文件 | 作用 |
| --- | --- |
| `src/config/user-ui-features.ts` | 功能开关：`pricing`、`rankings`、`about`、`referral` 关闭；`wallet` 开启 |
| `src/config/user-ui-meta.ts` | 源码仓库地址、许可证、上游项目信息（AGPL 声明用） |
| `src/components/legal/source-notice.tsx` | 源码 / 许可证声明组件（AGPLv3 第 13 条） |
| `src/lib/api-endpoint.ts` | API 地址：优先后台 `server_address`，否则当前域名；curl 示例生成 |
| `src/i18n/overrides/*.{zh,en}.json` + `index.ts` | 文案覆盖层，按工作包分文件，覆盖值优先于官方词条 |
| `src/features/docs/**`、`src/routes/docs/**` | 站内接入文档 `/docs`（替代官方文档外链） |
| `src/styles/brand.css` | 品牌主题 token（颜色、圆角、边框、按钮投影、字体） |
| `src/assets/brand.ts`、`brand-logo.tsx` | 品牌 logo 组件（明暗两版） |
| `public/brand/*`、`public/favicon.svg`、`apple-touch-icon.png` | logo 与图标（`favicon.ico`、`logo.png` 已替换） |

**修改的官方文件（均带 `[user-ui]` 注释）**

| 范围 | 改动 |
| --- | --- |
| `src/lib/nav-modules.ts`、`src/hooks/use-sidebar-config.ts`、`use-top-nav-links.ts`、`use-sidebar-data.ts` | 应用功能开关；顶部"文档"固定指向 `/docs`；删除侧边栏"聊天"项 |
| `src/routes/about/index.tsx`、`src/routes/_authenticated/wallet/index.tsx` | 功能关闭时返回 404 |
| 首页 hero / cta、概览、钱包页、移动端抽屉 | 按开关隐藏模型广场、钱包入口、推荐计划卡片 |
| `src/i18n/config.ts`、`languages.ts` | 只加载简体中文与英文，叠加覆盖层；`zh*` 统一映射到简体 |
| `src/lib/constants.ts`、`index.html` | 默认名称 SwarmRouter、默认 logo、图标标签 |
| `src/styles/index.css` | 引入 `brand.css` |
| `src/components/ui/*`（约 30 个）、`components/data-table/core/data-table-view.tsx` | 只改样式变体（小圆角、2px 边、硬投影按钮），组件 API 不变 |
| 主题设置（`config-drawer`、`theme-switch`、`theme-customization*`） | 只保留浅色 / 深色 / 跟随系统；旧主题 cookie 不再生效；去掉 Anthropic 预设 |
| `src/lib/colors.ts`、`status-badge.tsx`、`system-brand.tsx`、`header-logo.tsx` | 语义色 token、品牌 logo |
| 3 个官方测试（`status-query`、`sidebar-config`、`setup-guide`） | mock 功能开关为全开，继续测试官方逻辑 |

**依赖**：新增 `@fontsource-variable/ibm-plex-sans`、`@fontsource-variable/jetbrains-mono`（SIL OFL 1.1）。

**页面重绘（按工作包合并，详情见各合并提交与台账）**

| 工作包 | 范围 | 要点（同步官方时需手工合并的地方） |
| --- | --- | --- |
| SHELL | `components/layout/**`（公共页除外）、`hooks/use-sidebar-*`、`use-top-nav-links.ts`、`profile-dropdown`、`command-menu`、`legacy-route.ts`、`features/errors/**` | 侧边栏按"概览 / 开始使用 / 用量 / 账户"分组改名（新 `nav.*` 键）；新增 `sidebar-source-footer.tsx`（AGPL 源码链接）、`features/errors/components/error-home-action.tsx`；`ProfileDropdown` 新增可选 `showPreferences`（明暗 / 语言子菜单）；⌘K 读侧边栏过滤后的导航；`context/search-provider.tsx` 改为向 `CommandMenu` 传 `open`/`onOpenChange`（消除循环引用）；`_authenticated/errors/$error.tsx` 去掉重复顶栏；`lib/avatar.ts` 按背景亮度选字色；旧地址不再指向已删页面 |
| WALLET | `features/wallet/**`、订阅购买弹窗 | 布局重排；充值改为"选额度 → 选支付方式 → 去支付"；新增 `lib/{payment-options,topup-ui,subscription-payment}.ts`；推荐计划拆到 `referral-section.tsx`（开关关闭时不请求 `/api/user/aff`）；修复 `waffo_pancake` 被当作易支付下单 |
| PLAYGROUND | `features/playground/**`、`components/ai-elements/**` | 去掉附件/搜索假按钮；示例只填入输入框；"查看代码"（`lib/code/playground-code.ts`）；错误分类与人话提示；`hooks/use-chat-handler.ts` 只改 toast 标题；管理员设置链接改为文字提示 |
| ACCOUNT | `features/{profile,security}/**`、`features/usage-logs/audit/**` | 侧边栏显示设置按新分组（`profile/lib/sidebar-modules.ts`，与 `use-sidebar-config.ts` 的 URL 映射保持一致）；余额预警按余额单位输入（`profile/lib/quota-threshold.ts`）；删除 `security/components/privacy-card.tsx`，"记录 IP"移到个人资料的偏好卡片；账户活动默认列面向用户 |
| KEYS | `features/keys/**`、`features/chat/**`、`routes/_authenticated/chat/$chatId.tsx`、`chat2link.tsx` | 创建成功弹窗（创建接口只返回 success/message，按名称回查新密钥）；列表顶部 Base URL 栏；默认列精简（列可见性存储键改为 `api-keys:column-visibility:v2`）；表单"高级"折叠；行菜单"复制 / 一键接入"；分组显示"价格 ×N"徽标；新增 `api-key-created-dialog.tsx`、`api-keys-endpoint-bar.tsx`、`hooks/use-chat-preset-launcher.ts`、`use-user-group-info.ts`、`lib/{created-keys,form-sections,cc-switch-url,connection-text,column-defaults}.ts`；修复官方：默认 CC Switch 聊天预设坏链接、FluentRead 重复 `sk-` 前缀；Cherry Studio 等导入 id 不变 |
| LOGS | `features/usage-logs/**`（`audit/` 除外） | 默认最近 7 天（`lib/time-range-presets.ts`）；首行筛选 + "更多筛选"；默认列精简、桌面每页 50；"价格系数"；按原因区分空状态（`components/usage-logs-empty.tsx`）；共享筛选面板与日期选择器的新标签为可选项，审计页保持原样 |
| USAGE | `features/dashboard/**` | 概览账户状态卡、设置引导、面板按内容显示（`hooks/use-uptime-groups.ts`）；用量统计标题与"按模型 / 按密钥"标签；图表读 `--chart-1..5`（`lib/chart-palette.ts`，解析 lab/oklch/hex）；`lib/range-label.ts` |
| HOME | `features/home/**`、`components/layout/components/{public-header,public-layout,footer}.tsx`（+ `public-nav-labels.ts`） | 首页整页重写（删除官方 stats / features / how-it-works / cta / 终端演示等区块与 `constants.ts`）；公共顶栏通栏；页脚用 `SourceNotice` 取代"© New API"署名与外链；`PublicLayout` 新增 `footer` 选项（默认 `slim`，文档页 / 协议页 / 自定义首页也带源码声明）；后台自定义首页仍整页替换；`glow.tsx`、`mockup.tsx`、`public-navigation.tsx` 未改（官方遗留，未使用） |
| AUTH | `features/auth/**` 展示层、`routes/(auth)/**` | 两栏布局（`auth-brand.tsx`、`honeycomb-motif.tsx`）；默认 logo 不裁圆；协议勾选改为点击时高亮提示（按钮不再置灰）；注册成功经 router history state 把用户名带到登录页（`sign-up-handoff.ts`）；重置页新密码大字 + 复制；`TermsFooter` 不再渲染；`api.ts`、`hooks/`、`lib/`、`passkey/`、`secure-verification/` 未改，`?aff=` 行为不变 |
| PM（收尾） | `i18n/config.ts`、`ui/sonner.tsx`、`ui/input-group.tsx`、`model-group-selector.tsx` | dayjs 语言跟随界面语言（官方未设置）；提示条 2px 边 + 硬投影；输入组禁用样式只看输入控件；只有一个分组时模型选择器不显示分组名 |
| PM | `components/ui/tabs.tsx`、`components/data-table/core/data-table-view.tsx` | 暗色选中标签文字色；表格外框 2px |

## 已知问题（官方原版即存在）

- 4 个测试在官方 rc.37 原版上即稳定失败：`features/security/__tests__/account-security.test.tsx`（3 个）、`enrollment.test.tsx`（1 个）。
- `bun run lint` 有官方遗留的 lint error（裁剪后 160 个，官方原版 194 个），本仓库未新增。
- 审计日志、个人资料页在开发模式下有 Base UI 的 `nativeButton` 控制台警告。

## 同步官方新版本的步骤

1. 部署仓库：`scripts/official-ui-sync.sh --diff <当前基线> <新tag>` 查看 `web/` 改动。
2. 对**保留的文件**按 diff 移植；对**已删除目录**的改动直接忽略；新增路由/功能逐个判断是否属于普通用户。
3. 带 `[user-ui]` 注释的文件需手工合并。
4. `bun run typecheck`、`bun run test`、`bun run build`，再对本地实例走一遍页面。
5. 更新本文件的"基线"一节。
