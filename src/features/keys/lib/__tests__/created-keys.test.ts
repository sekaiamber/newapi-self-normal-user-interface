/*
 * [user-ui] 找回刚创建的密钥（本仓库新增文件，非官方代码）。
 */
import { afterEach, describe, expect, test, vi } from 'vitest'

import { api } from '@/lib/api'

import { apiKeySchema, type ApiKey } from '../../types'
import { locateCreatedApiKeys, pickCreatedKeys } from '../created-keys'

function apiKey(id: number, name: string): ApiKey {
  return apiKeySchema.parse({
    id,
    name,
    key: 'abcd****wxyz',
    status: 1,
    remain_quota: 0,
    used_quota: 0,
    unlimited_quota: true,
    expired_time: -1,
    created_time: 1_700_000_000,
    accessed_time: 0,
    model_limits_enabled: false,
  })
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('pickCreatedKeys', () => {
  test('picks the newest key for each name in the requested order', () => {
    const result = pickCreatedKeys(
      ['app', 'app-x1y2z3'],
      [
        apiKey(3, 'app'),
        apiKey(9, 'app-x1y2z3'),
        apiKey(8, 'app'),
        apiKey(1, 'other'),
      ]
    )
    expect(result.map((item) => item.id)).toEqual([8, 9])
  })

  test('skips names that are not in the candidates', () => {
    expect(pickCreatedKeys(['missing'], [apiKey(1, 'other')])).toEqual([])
  })
})

describe('locateCreatedApiKeys', () => {
  test('uses the first list page when it already contains every new key', async () => {
    const get = vi.spyOn(api, 'get').mockResolvedValue({
      data: {
        success: true,
        data: { items: [apiKey(12, 'app'), apiKey(4, 'app')], total: 2 },
      },
    })
    const result = await locateCreatedApiKeys(['app'])
    expect(result.map((item) => item.id)).toEqual([12])
    expect(get).toHaveBeenCalledTimes(1)
    expect(get).toHaveBeenCalledWith('/api/token/?p=1&size=21')
  })

  test('searches by exact name for keys missing from the first page', async () => {
    const get = vi.spyOn(api, 'get').mockImplementation(async (url: string) => {
      if (url.startsWith('/api/token/search')) {
        return {
          data: {
            success: true,
            data: { items: [apiKey(30, 'late')], total: 1 },
          },
        }
      }
      return { data: { success: true, data: { items: [], total: 0 } } }
    })
    const result = await locateCreatedApiKeys(['late'])
    expect(result.map((item) => item.id)).toEqual([30])
    expect(get).toHaveBeenCalledWith(
      '/api/token/search?keyword=late&p=1&size=20'
    )
  })

  test('returns nothing when the list request fails and search finds nothing', async () => {
    vi.spyOn(api, 'get').mockResolvedValue({
      data: { success: false, message: 'boom' },
    })
    await expect(locateCreatedApiKeys(['app'])).resolves.toEqual([])
  })
})
