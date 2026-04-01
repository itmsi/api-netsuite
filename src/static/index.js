const info = {
  description: 'Express.js API Boilerplate - Template untuk pengembangan REST API dengan fitur lengkap',
  version: '1.0.0',
  title: 'Express.js API Boilerplate Documentation',
  contact: {
    email: 'your-email@example.com'
  },
  license: {
    name: 'MIT',
    url: 'https://opensource.org/licenses/MIT'
  }
}

const servers = [
  {
    url: '/api/netsuite/',
    description: 'Development server'
  },
  {
    url: 'https://gateway.motorsights.com/api/netsuite',
    description: 'Production server'
  },
  {
    url: 'https://dev-gateway.motorsights.com/api/netsuite',
    description: 'Develop server'
  }
]

// Import schemas
// Tambahkan schema module Anda di sini
const commonSchema = require('./schema/common');
// const exampleSchema = require('./schema/example');
const authSchema = require('./schema/auth');
const purchasingOrdersSchema = require('./schema/purchasing_orders');
const componenSchema = require('./schema/componen');
const itemsSchema = require('./schema/items');
const vendorSchema = require('./schema/vendor');
const locationsSchema = require('./schema/locations');
const customerSchema = require('./schema/customer');
const fakturSchema = require('./schema/faktur');
const referenceSchema = require('./schema/reference');
const invoiceSalesOrderSchema = require('./schema/invoice_sales_order');

// Import paths
// Tambahkan path module Anda di sini
// const examplePaths = require('./path/example');
const authPaths = require('./path/auth');
const purchasingOrdersPaths = require('./path/purchasing_orders');
const componenPaths = require('./path/componen');
const itemsPaths = require('./path/items');
const vendorPaths = require('./path/vendor');
const locationsPaths = require('./path/locations');
const customerPaths = require('./path/customer');
const fakturPaths = require('./path/faktur');
const referencePaths = require('./path/reference');
const invoiceSalesOrderPaths = require('./path/invoice_sales_order');

// Combine all schemas
const schemas = {
  ...commonSchema,
  // ...exampleSchema,
  ...authSchema,
  ...purchasingOrdersSchema,
  ...componenSchema,
  ...itemsSchema,
  ...vendorSchema,
  ...locationsSchema,
  ...customerSchema,
  ...fakturSchema,
  ...referenceSchema,
  ...invoiceSalesOrderSchema,
  // ...yourModuleSchema,
};

// Combine all paths
const paths = {
  // ...examplePaths,
  ...authPaths,
  ...purchasingOrdersPaths,
  ...componenPaths,
  ...itemsPaths,
  ...vendorPaths,
  ...locationsPaths,
  ...customerPaths,
  ...fakturPaths,
  ...referencePaths,
  ...invoiceSalesOrderPaths,
  // ...yourModulePaths,
};

const index = {
  openapi: '3.0.0',
  info,
  servers,
  paths,
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    },
    schemas
  }
}

module.exports = {
  index
}
