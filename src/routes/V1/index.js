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

const itemsModule = require('../../modules/items');
routing.use(`${API_TAG}/items`, itemsModule);

const vendorModule = require('../../modules/vendor');
routing.use(`${API_TAG}/vendor`, vendorModule);

const locationsModule = require('../../modules/locations');
routing.use(`${API_TAG}/locations`, locationsModule);

const customerModule = require('../../modules/customer');
routing.use(`${API_TAG}/customers`, customerModule);

const fakturModule = require('../../modules/faktur');
routing.use(`${API_TAG}/faktur`, fakturModule);

const referenceModule = require('../../modules/reference');
routing.use(`${API_TAG}/reference`, referenceModule);

const invoiceSalesOrderModule = require('../../modules/invoice_sales_order');
routing.use(`${API_TAG}/invoice-sales-orders`, invoiceSalesOrderModule);

const classesModule = require('../../modules/classes');
routing.use(`${API_TAG}/classes`, classesModule);

const departmentModule = require('../../modules/department');
routing.use(`${API_TAG}/departments`, departmentModule);

const subsidiaryModule = require('../../modules/subsidiary');
routing.use(`${API_TAG}/subsidiary`, subsidiaryModule);

const termsModule = require('../../modules/terms');
routing.use(`${API_TAG}/terms`, termsModule);

// Example:
// const yourModule = require('../../modules/yourModule')
// routing.use(`${API_TAG}/your-endpoint`, yourModule)

module.exports = routing;
