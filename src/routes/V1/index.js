const express = require('express')
// const { verifyToken } = require('../../middlewares')

const routing = express();
const API_TAG = '/api/netsuite';

/* RULE
naming convention endpoint: using plural
Example:
- GET /api/examples
- POST /api/examples
- GET /api/examples/:id
- PUT /api/examples/:id
- DELETE /api/examples/:id
*/

// Example Module (Template untuk module Anda)
const exampleModule = require('../../modules/example')
routing.use(`${API_TAG}/examples`, exampleModule)

// Tambahkan routes module Anda di sini
const authModule = require('../../modules/auth');
routing.use(`${API_TAG}/auth`, authModule);

const purchasingOrdersModule = require('../../modules/purchasing_orders');
routing.use(`${API_TAG}/purchasing-orders`, purchasingOrdersModule);

const componenModule = require('../../modules/componen');
routing.use(`${API_TAG}/componen`, componenModule);

// Example:
// const yourModule = require('../../modules/yourModule')
// routing.use(`${API_TAG}/your-endpoint`, yourModule)

module.exports = routing;
