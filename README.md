# newapi-self-normal-user-interface

New API 的自建普通用户前端。与官方管理 UI 共用同一个 New API 后端，只通过 API 交互。
部署与架构见上层仓库 `newapi-self-deploy` 的 `docs/notes/frontend-architecture.md`。

## License

本项目以 **GNU AGPLv3** 发布，全文见 [LICENSE](LICENSE)。

部分代码参考或改编自 [QuantumNous/new-api](https://github.com/QuantumNous/new-api) 的官方前端（同为 AGPLv3）。
从官方复制或改编的文件，需在文件头注明来源路径与版本，例如：

```ts
// Adapted from QuantumNous/new-api web/src/<path> @ v1.0.0-rc.37 (AGPL-3.0)
```

对外提供服务时，界面上需提供指向本仓库源码的链接（AGPLv3 第 13 条；LICENSE 附录建议在 Web 界面放 "Source" 链接）。

## 开发

依赖 [Bun](https://bun.sh)。需要本地先跑着同版本的 New API 后端（`localhost:3000`，见部署仓库 `deploy/local`）。

```bash
bun install
bun run dev        # 开发服务器；/api、/v1、/mj、/pg 代理到 http://localhost:3000
bun run typecheck
bun run test
bun run build      # 产物在 dist/，由 Nginx 托管
```

后端地址可用 `VITE_REACT_APP_SERVER_URL` 覆盖（构建时生效）。

与官方前端的差异、同步步骤见 [UPSTREAM.md](UPSTREAM.md)；官方开发规范见 [AGENTS.md](AGENTS.md)。
