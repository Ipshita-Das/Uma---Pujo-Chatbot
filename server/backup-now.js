// `npm run backup`: makes one backup of the database right away.
import { backupDatabase } from './backup.js'
import { db } from './db.js'

const file = await backupDatabase(db)
console.log(`Backed up to ${file}`)
