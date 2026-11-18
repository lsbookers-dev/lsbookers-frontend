// Serveur de test : prépare la base lsb_e2e, puis démarre le serveur du site sur cet ordinateur.
// (Les serveurs démarrent avant tout le reste dans Playwright : la base doit être prête ici.)
const path = require('path')
const { BACKEND, BACKEND_ENV } = require('./env.cjs')
const { prepareDb } = require('./prepare-db.cjs')

Object.assign(process.env, BACKEND_ENV)
prepareDb()
  .then(() => require(path.join(BACKEND, 'server.js')))
  .catch(err => { console.error('Préparation de la base de test impossible :', err.message); process.exit(1) })
