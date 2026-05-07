const service = require('./service');
const { baseResponse } = require('../../utils');
const { errorResponse } = require('../../utils/response');

/**
 * Controller Layer - HTTP Request/Response Handler
 *
 * Layer ini hanya menangani HTTP request dan response.
 * Semua business logic dipindahkan ke service layer.
 */

/**
 * POST /api/netsuite/sync/get
 * Get list syncs with pagination
 */
const getList = async (req, res) => {
  try {
    const data = await service.getSyncList(req.body);
    return baseResponse(res, { data });
  } catch (error) {
    return errorResponse(res, error.message || 'Internal Server Error', error.statusCode || 500);
  }
};

/**
 * GET /api/netsuite/sync/:id
 * Get single sync by ID
 */
const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await service.getSyncById(id);
    return baseResponse(res, { data });
  } catch (error) {
    return errorResponse(res, error.message || 'Internal Server Error', error.statusCode || 500);
  }
};

/**
 * POST /api/netsuite/sync/create
 * Create new sync record
 */
const create = async (req, res) => {
  try {
    const data = await service.createSync(req.body, req.user);
    return baseResponse(res, {
      data,
      message: 'Data sync berhasil dibuat'
    }, 201);
  } catch (error) {
    return errorResponse(res, error.message || 'Internal Server Error', error.statusCode || 500);
  }
};

/**
 * PUT /api/netsuite/sync/:id
 * Update existing sync record
 */
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await service.updateSync(id, req.body, req.user);
    return baseResponse(res, {
      data,
      message: 'Data sync berhasil diupdate'
    });
  } catch (error) {
    return errorResponse(res, error.message || 'Internal Server Error', error.statusCode || 500);
  }
};

/**
 * DELETE /api/netsuite/sync/:id
 * Soft delete sync record
 */
const remove = async (req, res) => {
  try {
    const { id } = req.params;
    await service.deleteSync(id, req.user);
    return baseResponse(res, {
      message: 'Data sync berhasil dihapus'
    });
  } catch (error) {
    return errorResponse(res, error.message || 'Internal Server Error', error.statusCode || 500);
  }
};

/**
 * POST /api/netsuite/sync/modules
 * Sync specific module (trigger background process)
 */
const syncModules = async (req, res) => {
  try {
    const data = await service.syncModules(req.body, req.user);
    return baseResponse(res, {
      data,
      message: `Sync module ${req.body.module} berhasil diinisiasi`
    });
  } catch (error) {
    return errorResponse(res, error.message || 'Internal Server Error', error.statusCode || 500);
  }
};

/**
 * GET /api/netsuite/sync/all
 * Trigger sync all modules (Orchestration)
 */
const syncAll = async (req, res) => {
  try {
    const data = await service.syncAllModules(req.user);
    return baseResponse(res, {
      data,
      message: 'Sync all process initiated'
    });
  } catch (error) {
    return errorResponse(res, error.message || 'Internal Server Error', error.statusCode || 500);
  }
};

module.exports = {
  getList,
  getById,
  create,
  update,
  remove,
  syncModules,
  syncAll
};
