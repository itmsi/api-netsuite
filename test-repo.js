require('dotenv').config();
const repo = require('./src/modules/po_status/repository');
repo.findAll().then(console.log).catch(console.error).finally(() => process.exit(0));
