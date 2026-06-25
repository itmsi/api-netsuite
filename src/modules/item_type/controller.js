const service = require('./service');
const { baseResponse, decodeToken } = require('../../utils');

/**
 * Controller Layer - HTTP Request/Response Handler
 *
 * Layer ini hanya menangani HTTP request dan response.
 * Semua business logic dipindahkan ke service layer.
 */

/**
 * GET list item_type dengan pagination, search, dan sorting
 * POST /api/netsuite/item_type/get
 */
const getList = async (req, res) => {
  try {
    const result = await service.getItemTypeList(req.body);
    return baseResponse(res, {
      data: {
        success: true,
        data: result,
        message: 'Data item type berhasil diambil'
      }
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Internal Server Error',
      errors: error.errors || error
    });
  }
};

/**
 * GET single item_type by ID
 * GET /api/netsuite/item_type/:id
 */
const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await service.getItemTypeById(id);
    return baseResponse(res, {
      data: {
        success: true,
        data,
        message: 'Detail item type berhasil diambil'
      }
    });
  } catch (error) {
    const statusCode = error.statusCode || 404;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Data tidak ditemukan'
    });
  }
};

/**
 * CREATE item_type
 * POST /api/netsuite/item_type/create
 */
const create = async (req, res) => {
  try {
    const createdPayload = decodeToken('created', req);
    const userId = createdPayload.created_by || null;
    const data = await service.createItemType(req.body, userId);
    return baseResponse(res, {
      data: {
        success: true,
        data,
        message: 'Data item type berhasil dibuat'
      },
      code: 201
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Internal Server Error'
    });
  }
};

/**
 * UPDATE item_type
 * PUT /api/netsuite/item_type/:id
 */
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedPayload = decodeToken('updated', req);
    const userId = updatedPayload.updated_by || null;
    const data = await service.updateItemType(id, req.body, userId);
    return baseResponse(res, {
      data: {
        success: true,
        data,
        message: 'Data item type berhasil diupdate'
      }
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Internal Server Error'
    });
  }
};

/**
 * DELETE item_type (soft delete)
 * DELETE /api/netsuite/item_type/:id
 */
const remove = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedPayload = decodeToken('deleted', req);
    const userId = deletedPayload.deleted_by || null;
    await service.deleteItemType(id, userId);
    return baseResponse(res, {
      data: {
        success: true,
        message: 'Data item type berhasil dihapus'
      }
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Internal Server Error'
    });
  }
};

module.exports = {
  getList,
  getById,
  create,
  update,
  remove
};
