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

## 已知问题（官方原版即存在）

- 4 个测试在官方 rc.37 原版上即稳定失败：`features/security/__tests__/account-security.test.tsx`（3 个）、`enrollment.test.tsx`（1 个）。
- `bun run lint` 有官方遗留的 lint error（裁剪后 160 个，官方原版 194 个），本仓库未新增。
- 审计日志、个人资料页在开发模式下有 Base UI 的 `nativeButton` 控制台警告。
- 管理员在 playground 遇到"模型未定价"错误时，错误提示里的设置链接指向 `/system-settings/...`，在用户 UI 中是 404（只影响管理员）。

## 同步官方新版本的步骤

1. 部署仓库：`scripts/official-ui-sync.sh --diff <当前基线> <新tag>` 查看 `web/` 改动。
2. 对**保留的文件**按 diff 移植；对**已删除目录**的改动直接忽略；新增路由/功能逐个判断是否属于普通用户。
3. 带 `[user-ui]` 注释的文件需手工合并。
4. `bun run typecheck`、`bun run test`、`bun run build`，再对本地实例走一遍页面。
5. 更新本文件的"基线"一节。
