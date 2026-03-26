const service = require('./service');
const { baseResponse, errorResponse } = require('../../utils/response');

/**
 * Controller Layer - HTTP Request/Response Handler
 * 
 * Layer ini hanya menangani HTTP request dan response.
 * Semua business logic dipindahkan ke service layer.
 */

/**
 * Get all items with pagination
 */
const getAll = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const data = await service.getAllItems(page, limit);
    return baseResponse(res, { data });
  } catch (error) {
    return errorResponse(res, error);
  }
};

/**
 * Get single item by ID
 */
const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await service.getItemById(id);
    return baseResponse(res, { data });
  } catch (error) {
    return errorResponse(res, error);
  }
};

/**
 * Create new item
 */
const create = async (req, res) => {
  try {
    const data = await service.createItem(req.body);
    return baseResponse(res, { 
      data,
      message: 'Data berhasil dibuat' 
    }, 201);
  } catch (error) {
    return errorResponse(res, error);
  }
};

/**
 * Update existing item
 */
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await service.updateItem(id, req.body);
    return baseResponse(res, { 
      data,
      message: 'Data berhasil diupdate' 
    });
  } catch (error) {
    return errorResponse(res, error);
  }
};

/**
 * Soft delete item
 */
const remove = async (req, res) => {
  try {
    const { id } = req.params;
    await service.deleteItem(id);
    return baseResponse(res, { 
      message: 'Data berhasil dihapus' 
    });
  } catch (error) {
    return errorResponse(res, error);
  }
};

/**
 * Restore soft deleted item
 */
const restore = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await service.restoreItem(id);
    return baseResponse(res, { 
      data,
      message: 'Data berhasil direstore' 
    });
  } catch (error) {
    return errorResponse(res, error);
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
  restore
};

