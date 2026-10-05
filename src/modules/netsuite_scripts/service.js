const { dbNetsuite } = require("../log_activities/service");

const SORT_COLUMNS = ["created_at", "updated_at", "module", "script_id"];
const SEARCH_COLUMNS = ["module", "script_id"];

/**
 * Get daftar netsuite_scripts dari DB Netsuite (bridge_sanbox)
 * response hanya module & script_id
 */
const getNetsuiteScriptsList = async (body = {}) => {
  try {
    const page = parseInt(body.page) || 1;
    const limit = parseInt(body.limit) || 10;
    const offset = (page - 1) * limit;
    const sortOrder =
      String(body.sort_order).toUpperCase() === "DESC" ? "DESC" : "ASC";
    const orderCol = SORT_COLUMNS.includes(body.sort_by)
      ? body.sort_by
      : "created_at";

    let query = dbNetsuite("netsuite_scripts");

    if (body.search) {
      query = query.where((qb) => {
        SEARCH_COLUMNS.forEach((col) =>
          qb.orWhereILike(col, `%${body.search}%`),
        );
      });
    }

    const countResult = await query.clone().count("* as total").first();
    const total = parseInt(countResult.total) || 0;
    const totalPages = Math.ceil(total / limit);

    const items = await query
      .clone()
      .select("module", "script_id")
      .orderBy(orderCol, sortOrder)
      .orderBy("id", sortOrder)
      .limit(limit)
      .offset(offset);

    return {
      items,
      pagination: { page, limit, total, totalPages },
    };
  } catch (error) {
    throw {
      message:
        error.message || "Failed to fetch netsuite scripts from database",
      statusCode: 500,
    };
  }
};

module.exports = {
  getNetsuiteScriptsList,
};
