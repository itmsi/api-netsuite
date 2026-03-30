/**
 * Swagger Schema Definitions for Componen Module
 */

const componenSchemas = {
  ComponenListResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      data: { type: 'object', description: 'Raw response from bridge API' },
      message: { type: 'string', example: 'Data componen berhasil diambil' }
    }
  }
};

module.exports = componenSchemas;
