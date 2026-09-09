const test = require('node:test')
const assert = require('node:assert/strict')

const {
  isValidDeviceToken,
  getOrCreateDeviceToken,
  persistDeviceToken,
} = require('../src/utils/deviceToken')

function browserWithStorage(initial = {}) {
  const values = new Map(Object.entries(initial))
  let sequence = 0
  global.window = {
    localStorage: {
      getItem: key => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
    },
    crypto: {
      randomUUID: () => `00000000-0000-4000-8000-${String(++sequence).padStart(12, '0')}`,
    },
  }
  return values
}

test('le navigateur conserve le même identifiant en changeant de compte', () => {
  browserWithStorage()
  const accountA = getOrCreateDeviceToken()
  const accountB = getOrCreateDeviceToken()
  assert.equal(accountA, accountB)
  assert.equal(isValidDeviceToken(accountA), true)
  delete global.window
})

test('un jeton serveur valide est persisté pour les connexions suivantes', () => {
  browserWithStorage()
  const serverToken = '22222222-2222-4222-8222-222222222222'
  assert.equal(persistDeviceToken(serverToken), true)
  assert.equal(getOrCreateDeviceToken(), serverToken)
  delete global.window
})

test('si le stockage est indisponible, le frontend laisse le cookie sécurisé prendre le relais', () => {
  global.window = {
    localStorage: {
      getItem: () => { throw new Error('storage disabled') },
      setItem: () => { throw new Error('storage disabled') },
    },
    crypto: { randomUUID: () => '33333333-3333-4333-8333-333333333333' },
  }
  assert.equal(getOrCreateDeviceToken(), null)
  delete global.window
})
