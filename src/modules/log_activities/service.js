const knex = require("knex");
const moment = require("moment");

// Knex instance untuk DB Netsuite (bridge_sanbox)
const dbNetsuite = knex({
  client: "pg",
  connection: {
    host: process.env.DB_HOST_NETSUITE || "localhost",
    port: parseInt(process.env.DB_PORT_NETSUITE) || 9541,
    user: process.env.DB_USER_NETSUITE || "msiserver",
    password: process.env.DB_PASS_NETSUITE,
    database: process.env.DB_NAME_NETSUITE || "bridge_sanbox",
  },
});

const TYPE_DATA = ["apps", "netsuite"];
const CLIENTS = ["ITI", "MSI"];

// Format tanggal request & response: yyyy-MM-dd HH:mm:ss.SSS Z
const DATE_FORMAT = "YYYY-MM-DD HH:mm:ss.SSS ZZ";
const INPUT_DATE_FORMATS = [
  "YYYY-MM-DD HH:mm:ss.SSS ZZ",
  "YYYY-MM-DD HH:mm:ss.SSS Z",
  "YYYY-MM-DD HH:mm:ss ZZ",
  "YYYY-MM-DD HH:mm:ss Z",
  "YYYY-MM-DD HH:mm:ss.SSS",
  "YYYY-MM-DD HH:mm:ss",
  "YYYY-MM-DD HH:mm",
  "YYYY-MM-DD",
];
const OUTPUT_UTC_OFFSET = "+07:00";

// Konfigurasi per tabel
const SOURCES = {
  apps: {
    table: "log_activities",
    clientColumn: "client_id",
    select: [
      "id",
      "url",
      "url as function_name",
      "status_code",
      "status as status_message",
      "payload",
      "response",
      "created_at",
      dbNetsuite.raw("NULL as updated_at"),
    ],
    searchColumns: ["url"],
    sortColumns: ["created_at", "url"],
    functionColumn: "url",
    exactFilters: [],
    // Jangan tampilkan log dari endpoint log_activities itu sendiri
    excludeUrls: ["/api/v1/bridge/log_activities/get"],
  },
  netsuite: {
    table: "log_activities_netsuite",
    clientColumn: "created_by",
    select: [
      "id",
      "url",
      "function as function_name",
      "status_code",
      "status_messsage as status_message",
      "payload",
      "response",
      "created_at",
      "updated_at",
    ],
    searchColumns: ["url", "function"],
    sortColumns: ["created_at", "updated_at", "url", "function"],
    functionColumn: "function",
    exactFilters: ["aggregate_id", "aggregate_type", "code"],
    excludeUrls: [],
  },
};

const SOURCES_LIST = {
  apps: {
    table: "log_activities",
    clientColumn: "client_id",
    select: [
      "id",
      "url",
      "url as function_name",
      "status_code",
      "status as status_message",
      "created_at",
      dbNetsuite.raw("NULL as updated_at"),
    ],
    searchColumns: ["url"],
    sortColumns: ["created_at", "url"],
    functionColumn: "url",
    exactFilters: [],
    // Jangan tampilkan log dari endpoint log_activities itu sendiri
    excludeUrls: ["/api/v1/bridge/log_activities/get"],
  },
  netsuite: {
    table: "log_activities_netsuite",
    clientColumn: "created_by",
    select: [
      "id",
      "url",
      "function as function_name",
      "status_code",
      "status_messsage as status_message",
      "created_at",
      "updated_at",
    ],
    searchColumns: ["url", "function"],
    sortColumns: ["created_at", "updated_at", "url", "function"],
    functionColumn: "function",
    exactFilters: ["aggregate_id", "aggregate_type", "code"],
    excludeUrls: [],
  },
};

const badRequest = (message) => ({ message, statusCode: 400 });

const parseDate = (value, field) => {
  if (value === undefined || value === null || value === "") return null;
  const parsed = moment.parseZone(
    String(value).trim(),
    INPUT_DATE_FORMATS,
    true,
  );
  if (!parsed.isValid()) {
    throw badRequest(
      `${field} tidak valid, gunakan format yyyy-MM-dd HH:mm:ss.SSS Z (contoh: 2026-09-29 08:46:36.250 +0700)`,
    );
  }
  // Tanpa offset -> anggap WIB (+0700)
  const hasOffset = /[+-]\d{2}:?\d{2}$|Z$/i.test(String(value).trim());
  return hasOffset
    ? parsed.toDate()
    : moment
        .utc(parsed.format("YYYY-MM-DD HH:mm:ss.SSS"))
        .utcOffset(OUTPUT_UTC_OFFSET, true)
        .toDate();
};

const formatDate = (value) =>
  value ? moment(value).utcOffset(OUTPUT_UTC_OFFSET).format(DATE_FORMAT) : null;

const parseTypeData = (value) => {
  const typeData = value ? String(value).toLowerCase() : "netsuite";
  if (!TYPE_DATA.includes(typeData)) {
    throw badRequest(
      `type_data tidak valid, pilihan: ${TYPE_DATA.join(" / ")}`,
    );
  }
  return typeData;
};

const mapItem = (row, client, typeData) => ({
  id: row.id,
  client,
  type_data: typeData,
  url: row.url,
  function_name: row.function_name,
  ststus_code: row.status_code,
  status_message: row.status_message,
  payload: row.payload,
  response: row.response,
  created_at: formatDate(row.created_at),
  updated_at: formatDate(row.updated_at),
});

/**
 * Get log activities dari DB Netsuite (bridge_sanbox)
 * - type_data apps     -> log_activities (filter client_id)
 * - type_data netsuite -> log_activities_netsuite (filter created_by)
 */
const getLogActivitiesList = async (body = {}) => {
  const typeData = parseTypeData(body.type_data);

  const client = body.client ? String(body.client).toUpperCase() : "ITI";
  if (!CLIENTS.includes(client)) {
    throw badRequest(`client tidak valid, pilihan: ${CLIENTS.join(" / ")}`);
  }

  const startDate = parseDate(body.start_date, "start_date");
  const endDate = parseDate(body.end_date, "end_date");
  if (startDate && endDate && startDate > endDate) {
    throw badRequest("start_date tidak boleh lebih besar dari end_date");
  }

  try {
    const source = SOURCES_LIST[typeData];
    const page = parseInt(body.page) || 1;
    const limit = parseInt(body.limit) || parseInt(body.page_size) || 10;
    const sortOrder =
      String(body.sort_order).toUpperCase() === "ASC" ? "ASC" : "DESC";
    const offset = (page - 1) * limit;
    const orderCol = source.sortColumns.includes(body.sort_by)
      ? body.sort_by
      : "created_at";

    // Ambil id client dari api_clients
    const apiClient = await dbNetsuite("api_clients")
      .select("id")
      .where("name", client)
      .first();
    if (!apiClient) {
      throw {
        message: `Client ${client} tidak ditemukan di api_clients`,
        statusCode: 404,
      };
    }

    let query = dbNetsuite(source.table).where(
      source.clientColumn,
      apiClient.id,
    );

    if (startDate) query = query.where("created_at", ">=", startDate);
    if (endDate) query = query.where("created_at", "<=", endDate);

    if (source.excludeUrls.length) {
      // url NULL tetap ikut (whereNotIn saja akan membuang NULL)
      query = query.where((qb) =>
        qb.whereNotIn("url", source.excludeUrls).orWhereNull("url"),
      );
    }

    if (body.function_name) {
      query = query.whereILike(
        source.functionColumn,
        `%${body.function_name}%`,
      );
    }

    // Filter khusus netsuite: aggregate_id, aggregate_type, code (exact match)
    source.exactFilters.forEach((col) => {
      if (body[col] !== undefined && body[col] !== null && body[col] !== "") {
        query = query.where(col, String(body[col]));
      }
    });

    if (body.search) {
      query = query.where((qb) => {
        source.searchColumns.forEach((col) =>
          qb.orWhereILike(col, `%${body.search}%`),
        );
      });
    }

    // Hitung total
    const countResult = await query.clone().count("* as total").first();
    const total = parseInt(countResult.total) || 0;
    const totalPages = Math.ceil(total / limit);

    const rows = await query
      .clone()
      .select(source.select)
      .orderBy(orderCol, sortOrder)
      .limit(limit)
      .offset(offset);

    const items = rows.map((row) => mapItem(row, client, typeData));

    return {
      items,
      pagination: { page, limit, total, totalPages },
    };
  } catch (error) {
    if (error.statusCode) throw error;
    throw {
      message: error.message || "Failed to fetch log activities from database",
      statusCode: 500,
    };
  }
};

/**
 * Get detail log activity by id
 * - type_data apps     -> log_activities
 * - type_data netsuite -> log_activities_netsuite
 */
const getLogActivityById = async (id, query = {}) => {
  const typeData = parseTypeData(query.type_data);
  const source = SOURCES[typeData];

  try {
    const row = await dbNetsuite(`${source.table} as l`)
      // client_id (apps) bertipe varchar sedangkan api_clients.id uuid -> samakan tipe via text
      .leftJoin(
        "api_clients as c",
        dbNetsuite.raw("??::text", [`l.${source.clientColumn}`]),
        dbNetsuite.raw("c.id::text"),
      )
      .select([
        ...source.select.map((col) =>
          typeof col === "string" ? `l.${col}` : col,
        ),
        "c.name as client_name",
      ])
      .where("l.id", id)
      .first();

    if (!row) {
      throw {
        message: `Log activity dengan id ${id} tidak ditemukan`,
        statusCode: 404,
      };
    }

    return mapItem(row, row.client_name || null, typeData);
  } catch (error) {
    if (error.statusCode) throw error;
    // id tidak sesuai tipe kolom (mis. bukan angka/uuid) -> anggap tidak ditemukan
    if (error.code === "22P02") {
      throw {
        message: `Log activity dengan id ${id} tidak ditemukan`,
        statusCode: 404,
      };
    }
    throw {
      message: error.message || "Failed to fetch log activity from database",
      statusCode: 500,
    };
  }
};

module.exports = {
  getLogActivitiesList,
  getLogActivityById,
};
