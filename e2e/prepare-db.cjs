// Avant le démarrage du serveur de test : base lsb_e2e vide, recréée avec la structure actuelle, puis comptes de test.
const { execFileSync } = require('child_process')
const path = require('path')
const { BACKEND, DB_URL, PASSWORD, ACCOUNTS, assertLocal } = require('./env.cjs')

async function prepareDb() {
  assertLocal(DB_URL)
  const env = { ...process.env, DATABASE_URL: DB_URL }
  execFileSync('dropdb', ['--if-exists', '--force', 'lsb_e2e'], { stdio: 'inherit' })
  execFileSync('createdb', ['lsb_e2e'], { stdio: 'inherit' })
  execFileSync(path.join(BACKEND, 'node_modules/.bin/prisma'), ['db', 'push', '--skip-generate', '--schema', path.join(BACKEND, 'prisma/schema.prisma')], { env, stdio: 'pipe' })

  const { PrismaClient } = require(path.join(BACKEND, 'node_modules/@prisma/client'))
  const bcrypt = require(path.join(BACKEND, 'node_modules/bcrypt'))
  const prisma = new PrismaClient({ datasources: { db: { url: DB_URL } } })
  const password = await bcrypt.hash(PASSWORD, 10)
  for (const a of Object.values(ACCOUNTS)) {
    await prisma.user.create({
      data: {
        email: a.email, password, role: a.role, pseudo: a.pseudo, firstName: a.firstName, lastName: a.lastName,
        emailVerified: true, registrationStep: 5, welcomeSeenAt: new Date(),
        profile: { create: { location: 'Marseille', country: 'France', latitude: 43.2964, longitude: 5.3778, specialties: a.role === 'ARTIST' ? ['DJ'] : [], legalStatus: a.role === 'ARTIST' ? 'AUTO_ENTREPRENEUR' : 'COMPANY' } },
      },
    })
  }
  await prisma.$disconnect()
}

module.exports = { prepareDb }
