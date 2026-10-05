/*
 * [user-ui] 密钥列表的默认列（本仓库新增文件，非官方代码）。
 *
 * 审计 2.5 K3：默认只显示 名称 / 状态 / 密钥 / 额度 / 过期时间 / 操作；
 * 分组、模型、IP 限制、时间默认隐藏，仍可在"查看"列选择器里打开。
 */
export const API_KEYS_DEFAULT_COLUMN_VISIBILITY = {
  group: false,
  model_limits: false,
  allow_ips: false,
  activity_time: false,
} as const satisfies Record<string, boolean>

/** 默认列改过一次，换新的存储键，让新的默认值生效。 */
export const API_KEYS_COLUMN_VISIBILITY_STORAGE_KEY =
  'api-keys:column-visibility:v2'
