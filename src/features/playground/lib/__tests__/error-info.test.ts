/*
 * [user-ui] 在线试用错误分类的测试（本仓库新增文件，非官方代码）。
 * 用例里的错误文本取自 2026-10-05 本地实例（rc.37）对 /pg/chat/completions 的实测响应。
 */
import { describe, expect, it } from 'vitest'

import { getPlaygroundErrorInfo, stripRequestErrorPrefix } from '..'

const PREFIX = 'Request error occurred: '

describe('getPlaygroundErrorInfo', () => {
  it('classifies insufficient_user_quota as a balance problem the user can fix', () => {
    const info = getPlaygroundErrorInfo(
      `${PREFIX}预扣费额度失败, 用户剩余额度: ＄99.997424, 需要预扣费额度: ＄2500.000050 (request id: 1)`,
      'insufficient_user_quota'
    )

    expect(info.kind).toBe('quota')
    expect(info.tone).toBe('warning')
    expect(info.titleKey).toBe('playground.error.quota.title')
  })

  it('classifies model_not_found as an unavailable model', () => {
    const info = getPlaygroundErrorInfo(
      `${PREFIX}No available channel for model gpt-4o under group default (distributor) (request id: 2)`,
      'model_not_found'
    )

    expect(info.kind).toBe('model-unavailable')
  })

  it('recognises the no-channel message even when the code is missing', () => {
    const info = getPlaygroundErrorInfo(
      'No available channel for model gpt-4o under group vip'
    )

    expect(info.kind).toBe('model-unavailable')
  })

  it('classifies the group permission error that has an empty code', () => {
    const info = getPlaygroundErrorInfo(
      `${PREFIX}No permission to access this group (request id: 3)`,
      ''
    )

    expect(info.kind).toBe('group-forbidden')
  })

  it('classifies model_price_error and invalid_request by code', () => {
    expect(getPlaygroundErrorInfo('x', 'model_price_error').kind).toBe(
      'model-price'
    )
    expect(
      getPlaygroundErrorInfo('max_tokens is invalid', 'invalid_request').kind
    ).toBe('invalid-request')
  })

  it('treats an unauthorized stream body as an expired session', () => {
    const info = getPlaygroundErrorInfo(
      `${PREFIX}{"code":"AUTH_UNAUTHORIZED","message":"Unauthorized, invalid access token","success":false}`
    )

    expect(info.kind).toBe('auth')
  })

  it('treats HTTP 429 and saturated group load as a busy service', () => {
    expect(getPlaygroundErrorInfo('HTTP 429: Connection closed').kind).toBe(
      'busy'
    )
    expect(
      getPlaygroundErrorInfo(
        'Current group load is saturated, please try again later.'
      ).kind
    ).toBe('busy')
  })

  it('treats dropped connections as network errors', () => {
    expect(getPlaygroundErrorInfo('HTTP 502: Connection closed').kind).toBe(
      'network'
    )
    expect(
      getPlaygroundErrorInfo(
        `${PREFIX}Network connection failed or server not responding`
      ).kind
    ).toBe('network')
  })

  it('falls back to a generic failure and keeps the original text without the prefix', () => {
    const info = getPlaygroundErrorInfo(`${PREFIX}upstream said no`)

    expect(info.kind).toBe('generic')
    expect(info.tone).toBe('destructive')
    expect(info.detail).toBe('upstream said no')
  })
})

describe('stripRequestErrorPrefix', () => {
  it('leaves text without the prefix unchanged', () => {
    expect(stripRequestErrorPrefix('plain message')).toBe('plain message')
  })
})
