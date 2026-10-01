/**
 * Mapping url log (tabel log_activities) -> module_name
 * Sumber: BRIDGE_ROUTES.md. Jika ada route baru di BRIDGE_ROUTES.md, tambahkan juga di sini.
 *
 * module_name = segmen path setelah /api/v1/bridge (tanpa parameter), dipisah spasi.
 * Contoh: POST /api/v1/bridge/customers/get -> "customers get"
 * Jika nama bentrok, diberi akhiran: detail / create / update / delete / by <param>.
 */

// [module, method, path, module_name]
const BRIDGE_ROUTES = [

  // customer
  ["customer", "POST", "/api/v1/bridge/customers/get", "customers get"],
  ["customer", "POST", "/api/v1/bridge/customers/returns", "customers returns"],
  ["customer", "GET", "/api/v1/bridge/customers/:id", "customers"],
  ["customer", "GET", "/api/v1/bridge/customers/netsuite/:netsuite_id", "customers netsuite"],
  ["customer", "GET", "/api/v1/bridge/customers/netsuite/read", "customers netsuite read"],
  ["customer", "POST", "/api/v1/bridge/customers/create", "customers create"],
  ["customer", "POST", "/api/v1/bridge/customers/update", "customers update"],
  ["customer", "POST", "/api/v1/bridge/customers/search", "customers search"],
  ["customer", "POST", "/api/v1/bridge/customers/return-receipt", "customers return-receipt"],
  ["customer", "POST", "/api/v1/bridge/customers/return-receipt/sync/netsuite/:netsuite_id", "customers return-receipt sync netsuite"],
  ["customer", "POST", "/api/v1/bridge/customers/sync/netsuite/:netsuite_id", "customers sync netsuite"],

  // vendor
  ["vendor", "POST", "/api/v1/bridge/vendors/get", "vendors get"],
  ["vendor", "GET", "/api/v1/bridge/vendors/:id", "vendors"],
  ["vendor", "GET", "/api/v1/bridge/vendors/netsuite/:netsuite_id", "vendors netsuite"],
  ["vendor", "POST", "/api/v1/bridge/vendors/search", "vendors search"],

  // items
  ["items", "POST", "/api/v1/bridge/items/get", "items get"],
  ["items", "GET", "/api/v1/bridge/items/:id", "items"],
  ["items", "GET", "/api/v1/bridge/items/netsuite/:netsuite_id", "items netsuite"],
  ["items", "POST", "/api/v1/bridge/items/search", "items search"],
  ["items", "POST", "/api/v1/bridge/items/item-receipt", "items item-receipt"],
  ["items", "POST", "/api/v1/bridge/items/item-fulfillment", "items item-fulfillment"],
  ["items", "POST", "/api/v1/bridge/items/sync/netsuite/:netsuite_id", "items sync netsuite"],
  ["items", "POST", "/api/v1/bridge/items/sync/locations", "items sync locations"],
  ["items", "POST", "/api/v1/bridge/items/sync/type-id", "items sync type-id"],
  ["items", "POST", "/api/v1/bridge/items/:netsuite_id/type-id", "items type-id"],

  // purchase_order
  ["purchase_order", "POST", "/api/v1/bridge/purchase-orders/get", "purchase-orders get"],
  ["purchase_order", "GET", "/api/v1/bridge/purchase-orders/:id", "purchase-orders"],
  ["purchase_order", "GET", "/api/v1/bridge/purchase-orders/netsuite/:netsuite_id", "purchase-orders netsuite"],
  ["purchase_order", "POST", "/api/v1/bridge/purchase-orders/search", "purchase-orders search"],
  ["purchase_order", "POST", "/api/v1/bridge/purchase-orders/get-list", "purchase-orders get-list"],
  ["purchase_order", "GET", "/api/v1/bridge/purchase-orders/sync/:id", "purchase-orders sync by id"],
  ["purchase_order", "POST", "/api/v1/bridge/purchase-orders/sync/findById", "purchase-orders sync findById"],
  ["purchase_order", "POST", "/api/v1/bridge/purchase-orders/sync/:netsuite_id/:internal_id", "purchase-orders sync by netsuite_id internal_id"],
  ["purchase_order", "POST", "/api/v1/bridge/purchase-orders/create", "purchase-orders create"],
  ["purchase_order", "POST", "/api/v1/bridge/purchase-orders/update", "purchase-orders update"],
  ["purchase_order", "POST", "/api/v1/bridge/purchase-orders/approval", "purchase-orders approval"],
  ["purchase_order", "POST", "/api/v1/bridge/purchase-orders/print", "purchase-orders print"],
  ["purchase_order", "POST", "/api/v1/bridge/purchase-orders/receive-item", "purchase-orders receive-item"],
  ["purchase_order", "POST", "/api/v1/bridge/purchase-orders/sync-all", "purchase-orders sync-all"],

  // inbound_shipment
  ["inbound_shipment", "POST", "/api/v1/bridge/inbound-shipments/get", "inbound-shipments get"],
  ["inbound_shipment", "GET", "/api/v1/bridge/inbound-shipments/:id", "inbound-shipments"],
  ["inbound_shipment", "GET", "/api/v1/bridge/inbound-shipments/netsuite/:netsuite_id", "inbound-shipments netsuite"],
  ["inbound_shipment", "POST", "/api/v1/bridge/inbound-shipments/search", "inbound-shipments search"],
  ["inbound_shipment", "POST", "/api/v1/bridge/inbound-shipments/receive", "inbound-shipments receive"],
  ["inbound_shipment", "POST", "/api/v1/bridge/inbound-shipments/receive-partial", "inbound-shipments receive-partial"],

  // sync
  ["sync", "POST", "/api/v1/bridge/admin/sync", "admin sync"],
  ["sync", "GET", "/api/v1/bridge/admin/sync/job/:jobId", "admin sync job"],
  ["sync", "GET", "/api/v1/bridge/admin/sync/status/:module", "admin sync status"],
  ["sync", "GET", "/api/v1/bridge/admin/sync/failed", "admin sync failed"],
  ["sync", "POST", "/api/v1/bridge/admin/sync/failed/:jobId/retry", "admin sync failed retry"],

  // api_client
  ["api_client", "GET", "/api/v1/bridge/admin/api-clients", "admin api-clients"],
  ["api_client", "GET", "/api/v1/bridge/admin/api-clients/:id", "admin api-clients detail"],
  ["api_client", "POST", "/api/v1/bridge/admin/api-clients", "admin api-clients create"],
  ["api_client", "PUT", "/api/v1/bridge/admin/api-clients/:id", "admin api-clients update"],
  ["api_client", "POST", "/api/v1/bridge/admin/api-clients/:id/regenerate-secret", "admin api-clients regenerate-secret"],
  ["api_client", "POST", "/api/v1/bridge/admin/api-clients/:id/toggle-status", "admin api-clients toggle-status"],
  ["api_client", "DELETE", "/api/v1/bridge/admin/api-clients/:id", "admin api-clients delete"],

  // netsuite_scripts
  ["netsuite_scripts", "GET", "/api/v1/bridge/admin/netsuite-scripts", "admin netsuite-scripts"],
  ["netsuite_scripts", "GET", "/api/v1/bridge/admin/netsuite-scripts/module/:module", "admin netsuite-scripts module"],
  ["netsuite_scripts", "GET", "/api/v1/bridge/admin/netsuite-scripts/:module/:operation", "admin netsuite-scripts detail"],
  ["netsuite_scripts", "POST", "/api/v1/bridge/admin/netsuite-scripts", "admin netsuite-scripts create"],
  ["netsuite_scripts", "PUT", "/api/v1/bridge/admin/netsuite-scripts/:module/:operation", "admin netsuite-scripts update"],
  ["netsuite_scripts", "DELETE", "/api/v1/bridge/admin/netsuite-scripts/:module/:operation", "admin netsuite-scripts delete"],

  // auth
  ["auth", "POST", "/api/v1/bridge/auth/token", "auth token"],
  ["auth", "GET", "/api/v1/bridge/auth/token", "auth token"],
  ["auth", "POST", "/api/v1/bridge/auth/revoke", "auth revoke"],

  // reconcile
  ["reconcile", "GET", "/api/v1/reconcile/:module", "reconcile"],

  // webhook
  ["webhook", "POST", "/api/v1/bridge/webhook/auth/login", "webhook auth login"],
  ["webhook", "POST", "/api/v1/bridge/webhook/logs", "webhook logs"],
  ["webhook", "POST", "/api/v1/bridge/webhook/logs/:id/retry", "webhook logs retry"],
  ["webhook", "GET", "/api/v1/bridge/webhook/subscribers", "webhook subscribers"],
  ["webhook", "GET", "/api/v1/bridge/webhook/subscribers/:id", "webhook subscribers detail"],
  ["webhook", "POST", "/api/v1/bridge/webhook/subscribers", "webhook subscribers create"],
  ["webhook", "PUT", "/api/v1/bridge/webhook/subscribers/:id", "webhook subscribers update"],
  ["webhook", "DELETE", "/api/v1/bridge/webhook/subscribers/:id", "webhook subscribers delete"],
  ["webhook", "POST", "/api/v1/bridge/webhook/trigger-test", "webhook trigger-test"],

  // quotation
  ["quotation", "POST", "/api/v1/bridge/quotations/get", "quotations get"],
  ["quotation", "GET", "/api/v1/bridge/quotations/:id", "quotations"],
  ["quotation", "GET", "/api/v1/bridge/quotations/sync/:id", "quotations sync"],
  ["quotation", "GET", "/api/v1/bridge/quotations/netsuite/:netsuite_id", "quotations netsuite"],
  ["quotation", "POST", "/api/v1/bridge/quotations/search", "quotations search"],
  ["quotation", "POST", "/api/v1/bridge/quotations/create", "quotations create"],
  ["quotation", "POST", "/api/v1/bridge/quotations/update", "quotations update"],
  ["quotation", "POST", "/api/v1/bridge/quotations/print", "quotations print"],

  // bills
  ["bills", "POST", "/api/v1/bridge/bills/get", "bills get"],
  ["bills", "GET", "/api/v1/bridge/bills/:id", "bills"],
  ["bills", "GET", "/api/v1/bridge/bills/netsuite/:netsuite_id", "bills netsuite"],
  ["bills", "POST", "/api/v1/bridge/bills/search", "bills search"],

  // bills_payments
  ["bills_payments", "POST", "/api/v1/bridge/bills-payments/get", "bills-payments get"],
  ["bills_payments", "GET", "/api/v1/bridge/bills-payments/:id", "bills-payments"],
  ["bills_payments", "GET", "/api/v1/bridge/bills-payments/sync/:id", "bills-payments sync"],
  ["bills_payments", "GET", "/api/v1/bridge/bills-payments/netsuite/:netsuite_id", "bills-payments netsuite"],
  ["bills_payments", "POST", "/api/v1/bridge/bills-payments/search", "bills-payments search"],

  // sales_order
  ["sales_order", "POST", "/api/v1/bridge/sales-orders/get", "sales-orders get"],
  ["sales_order", "POST", "/api/v1/bridge/sales-orders/search", "sales-orders search"],
  ["sales_order", "POST", "/api/v1/bridge/sales-orders/create", "sales-orders create"],
  ["sales_order", "POST", "/api/v1/bridge/sales-orders/update", "sales-orders update"],
  ["sales_order", "POST", "/api/v1/bridge/sales-orders/update/:id", "sales-orders update by id"],
  ["sales_order", "GET", "/api/v1/bridge/sales-orders/sync/:id", "sales-orders sync by id"],
  ["sales_order", "POST", "/api/v1/bridge/sales-orders/sync/:netsuite_id/:internal_id", "sales-orders sync by netsuite_id internal_id"],

  // locations
  ["locations", "POST", "/api/v1/bridge/locations/get", "locations get"],
  ["locations", "POST", "/api/v1/bridge/locations/search", "locations search"],

  // vendor_returns
  ["vendor_returns", "POST", "/api/v1/bridge/vendor-returns", "vendor-returns"],
  ["vendor_returns", "POST", "/api/v1/bridge/vendor-returns/get", "vendor-returns get"],
  ["vendor_returns", "POST", "/api/v1/bridge/vendor-returns/search", "vendor-returns search"],
  ["vendor_returns", "POST", "/api/v1/bridge/vendor-returns/sync/netsuite/:netsuite_id", "vendor-returns sync netsuite"],

  // sales_delivery
  ["sales_delivery", "POST", "/api/v1/bridge/sales-deliveries/get", "sales-deliveries get"],
  ["sales_delivery", "POST", "/api/v1/bridge/sales-deliveries", "sales-deliveries"],

  // inventory
  ["inventory", "POST", "/api/v1/bridge/inventory/adjustments/get", "inventory adjustments get"],
  ["inventory", "POST", "/api/v1/bridge/inventory/adjustments/get-status", "inventory adjustments get-status"],
  ["inventory", "POST", "/api/v1/bridge/inventory/adjustments/sync/:netsuite_id", "inventory adjustments sync"],
  ["inventory", "POST", "/api/v1/bridge/inventory/adjustments", "inventory adjustments"],
  ["inventory", "POST", "/api/v1/bridge/inventory/transfer", "inventory transfer"],
  ["inventory", "POST", "/api/v1/bridge/inventory/transfer/get", "inventory transfer get"],
  ["inventory", "POST", "/api/v1/bridge/inventory/transfer/sync/:netsuite_id", "inventory transfer sync"],
  ["inventory", "POST", "/api/v1/bridge/inventory/transfer/:id", "inventory transfer by id"],

  // transfer_order
  ["transfer_order", "POST", "/api/v1/bridge/transfer-orders/get", "transfer-orders get"],
  ["transfer_order", "POST", "/api/v1/bridge/transfer-orders/sync/:netsuite_id", "transfer-orders sync"],
  ["transfer_order", "POST", "/api/v1/bridge/transfer-orders/item-receipt", "transfer-orders item-receipt"],
  ["transfer_order", "POST", "/api/v1/bridge/transfer-orders/create", "transfer-orders create"],
  ["transfer_order", "POST", "/api/v1/bridge/transfer-orders/update", "transfer-orders update"],

  // customform
  ["customform", "POST", "/api/v1/bridge/customform/get", "customform get"],
  ["customform", "POST", "/api/v1/bridge/customform/create", "customform create"],
  ["customform", "GET", "/api/v1/bridge/customform/:id", "customform detail"],
  ["customform", "PUT", "/api/v1/bridge/customform/:id", "customform update"],
  ["customform", "DELETE", "/api/v1/bridge/customform/:id", "customform delete"],

  // subsidiary
  ["subsidiary", "POST", "/api/v1/bridge/subsidiary/get", "subsidiary get"],
  ["subsidiary", "POST", "/api/v1/bridge/subsidiary/sync/netsuite/:netsuite_id", "subsidiary sync netsuite"],
  ["subsidiary", "POST", "/api/v1/bridge/subsidiary/create", "subsidiary create"],
  ["subsidiary", "GET", "/api/v1/bridge/subsidiary/:id", "subsidiary detail"],
  ["subsidiary", "PUT", "/api/v1/bridge/subsidiary/:id", "subsidiary update"],
  ["subsidiary", "DELETE", "/api/v1/bridge/subsidiary/:id", "subsidiary delete"],

  // currency
  ["currency", "POST", "/api/v1/bridge/currency/get", "currency get"],
  ["currency", "POST", "/api/v1/bridge/currency/create", "currency create"],
  ["currency", "GET", "/api/v1/bridge/currency/:id", "currency detail"],
  ["currency", "PUT", "/api/v1/bridge/currency/:id", "currency update"],
  ["currency", "DELETE", "/api/v1/bridge/currency/:id", "currency delete"],

  // term
  ["term", "POST", "/api/v1/bridge/term/get", "term get"],
  ["term", "POST", "/api/v1/bridge/term/sync", "term sync"],
  ["term", "POST", "/api/v1/bridge/term/create", "term create"],
  ["term", "GET", "/api/v1/bridge/term/:id", "term detail"],
  ["term", "PUT", "/api/v1/bridge/term/:id", "term update"],
  ["term", "DELETE", "/api/v1/bridge/term/:id", "term delete"],

  // log_activities
  ["log_activities", "POST", "/api/v1/bridge/log_activities/get", "log_activities get"],

  // custbody_me_project_location
  ["custbody_me_project_location", "POST", "/api/v1/bridge/custbody_me_project_location/get", "custbody_me_project_location get"],
  ["custbody_me_project_location", "POST", "/api/v1/bridge/custbody_me_project_location/create", "custbody_me_project_location create"],
  ["custbody_me_project_location", "GET", "/api/v1/bridge/custbody_me_project_location/:id", "custbody_me_project_location detail"],
  ["custbody_me_project_location", "PUT", "/api/v1/bridge/custbody_me_project_location/:id", "custbody_me_project_location update"],
  ["custbody_me_project_location", "DELETE", "/api/v1/bridge/custbody_me_project_location/:id", "custbody_me_project_location delete"],

  // custbody_me_saving_type
  ["custbody_me_saving_type", "POST", "/api/v1/bridge/custbody_me_saving_type/get", "custbody_me_saving_type get"],
  ["custbody_me_saving_type", "POST", "/api/v1/bridge/custbody_me_saving_type/create", "custbody_me_saving_type create"],
  ["custbody_me_saving_type", "GET", "/api/v1/bridge/custbody_me_saving_type/:id", "custbody_me_saving_type detail"],
  ["custbody_me_saving_type", "PUT", "/api/v1/bridge/custbody_me_saving_type/:id", "custbody_me_saving_type update"],
  ["custbody_me_saving_type", "DELETE", "/api/v1/bridge/custbody_me_saving_type/:id", "custbody_me_saving_type delete"],

  // class
  ["class", "POST", "/api/v1/bridge/class/get", "class get"],
  ["class", "POST", "/api/v1/bridge/class/create", "class create"],
  ["class", "GET", "/api/v1/bridge/class/:id", "class detail"],
  ["class", "PUT", "/api/v1/bridge/class/:id", "class update"],
  ["class", "DELETE", "/api/v1/bridge/class/:id", "class delete"],

  // project_segmentations
  ["project_segmentations", "POST", "/api/v1/bridge/project-segmentations/get", "project-segmentations get"],
  ["project_segmentations", "POST", "/api/v1/bridge/project-segmentations/create", "project-segmentations create"],
  ["project_segmentations", "GET", "/api/v1/bridge/project-segmentations/:id", "project-segmentations detail"],
  ["project_segmentations", "PUT", "/api/v1/bridge/project-segmentations/:id", "project-segmentations update"],
  ["project_segmentations", "DELETE", "/api/v1/bridge/project-segmentations/:id", "project-segmentations delete"],

  // department
  ["department", "POST", "/api/v1/bridge/department/get", "department get"],
  ["department", "POST", "/api/v1/bridge/department/create", "department create"],
  ["department", "GET", "/api/v1/bridge/department/:id", "department detail"],
  ["department", "PUT", "/api/v1/bridge/department/:id", "department update"],
  ["department", "DELETE", "/api/v1/bridge/department/:id", "department delete"],

  // taxcode
  ["taxcode", "POST", "/api/v1/bridge/taxcode/get", "taxcode get"],
  ["taxcode", "POST", "/api/v1/bridge/taxcode/create", "taxcode create"],
  ["taxcode", "GET", "/api/v1/bridge/taxcode/:id", "taxcode detail"],
  ["taxcode", "PUT", "/api/v1/bridge/taxcode/:id", "taxcode update"],
  ["taxcode", "DELETE", "/api/v1/bridge/taxcode/:id", "taxcode delete"],

  // componen
  ["componen", "GET", "/api/v1/bridge/componen", "componen"],

  // custbody_me_pr_type
  ["custbody_me_pr_type", "POST", "/api/v1/bridge/custbody_me_pr_type/get", "custbody_me_pr_type get"],
  ["custbody_me_pr_type", "POST", "/api/v1/bridge/custbody_me_pr_type/create", "custbody_me_pr_type create"],
  ["custbody_me_pr_type", "GET", "/api/v1/bridge/custbody_me_pr_type/:id", "custbody_me_pr_type detail"],
  ["custbody_me_pr_type", "PUT", "/api/v1/bridge/custbody_me_pr_type/:id", "custbody_me_pr_type update"],
  ["custbody_me_pr_type", "DELETE", "/api/v1/bridge/custbody_me_pr_type/:id", "custbody_me_pr_type delete"],

  // invoice_sales_order
  ["invoice_sales_order", "POST", "/api/v1/bridge/invoice-sales-orders/get", "invoice-sales-orders get"],

  // outbox
  ["outbox", "GET", "/api/v1/bridge/outbox-events", "outbox-events"],
  ["outbox", "POST", "/api/v1/bridge/outbox-events/get-list", "outbox-events get-list"],
  ["outbox", "POST", "/api/v1/bridge/outbox-events/replay", "outbox-events replay"],
  ["outbox", "GET", "/api/v1/bridge/outbox-events/:id", "outbox-events detail"],

  // bank
  ["bank", "POST", "/api/v1/bridge/bank/get", "bank get"],

  // receive
  ["receive", "POST", "/api/v1/bridge/receives/get-list", "receives get-list"],
  ["receive", "GET", "/api/v1/bridge/receives/sync/:id", "receives sync"],
  ["receive", "POST", "/api/v1/bridge/receives/update/:id", "receives update"],

  // fulfillment
  ["fulfillment", "POST", "/api/v1/bridge/fulfillments/get-list", "fulfillments get-list"],
  ["fulfillment", "GET", "/api/v1/bridge/fulfillments/sync/:id", "fulfillments sync"],
  ["fulfillment", "POST", "/api/v1/bridge/fulfillments/update/:id", "fulfillments update"],

  // logging
  ["logging", "POST", "/api/v1/bridge/logging/activity/get", "logging activity get"],
  ["logging", "POST", "/api/v1/bridge/logging/activity/retry", "logging activity retry"],

  // attach_file
  ["attach_file", "GET", "/api/v1/bridge/attach_file", "attach_file"],
  ["attach_file", "POST", "/api/v1/bridge/attach_file", "attach_file create"],
  ["attach_file", "PUT", "/api/v1/bridge/attach_file/:id", "attach_file update"],
  ["attach_file", "DELETE", "/api/v1/bridge/attach_file/:id", "attach_file delete"],
  ["attach_file", "PUT", "/api/v1/bridge/attach_file/delete/:id", "attach_file delete"],
];

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const segmentsOf = (path) => path.split("/").filter(Boolean);
const isParam = (segment) => segment.startsWith(":");

const ROUTES = BRIDGE_ROUTES.map(([module, method, path, moduleName], index) => {
  const segments = segmentsOf(path);
  const staticCount = segments.filter((s) => !isParam(s)).length;
  return {
    module,
    method,
    path,
    moduleName,
    index,
    segments,
    staticCount,
    // Regex dipakai di JS dan PostgreSQL (~). Query string / trailing slash diabaikan.
    regex: `^/${segments
      .map((s) => (isParam(s) ? "[^/?#]+" : escapeRegex(s)))
      .join("/")}/?([?#].*)?$`,
  };
})
  // Route yang lebih spesifik (lebih banyak segmen statis) dicek lebih dulu
  .sort((a, b) => b.staticCount - a.staticCount || a.index - b.index);

ROUTES.forEach((route) => {
  route.pattern = new RegExp(route.regex);
});

// Dua route bisa match url yang sama jika jumlah segmen sama & tiap segmen statisnya cocok
const canOverlap = (a, b) =>
  a.method === b.method &&
  a.segments.length === b.segments.length &&
  a.segments.every(
    (s, i) => isParam(s) || isParam(b.segments[i]) || s === b.segments[i],
  );

// Route lebih prioritas yang bisa "merebut" url milik route ini (untuk filter SQL)
ROUTES.forEach((route, i) => {
  route.shadowedBy = ROUTES.slice(0, i)
    .filter((other) => canOverlap(route, other))
    .map((other) => other.regex);
});

const resolveModuleName = (url, method) => {
  if (!url) return null;
  const upperMethod = method ? String(method).toUpperCase() : null;
  const route = ROUTES.find(
    (r) => (!upperMethod || r.method === upperMethod) && r.pattern.test(url),
  );
  return route ? route.moduleName : null;
};

const findRoutesByModuleName = (moduleName) => {
  const name = String(moduleName).trim().toLowerCase();
  return ROUTES.filter((r) => r.moduleName.toLowerCase() === name);
};

/**
 * Daftar module_name unik beserta endpoint-nya (urutan sesuai BRIDGE_ROUTES.md)
 */
const listModuleNames = () => {
  const map = new Map();
  [...ROUTES]
    .sort((a, b) => a.index - b.index)
    .forEach((r) => {
      // url = endpoint pertama dari module_name tsb
      if (!map.has(r.moduleName)) {
        map.set(r.moduleName, { module_name: r.moduleName, url: r.path });
      }
    });
  return [...map.values()];
};

module.exports = {
  ROUTES,
  resolveModuleName,
  findRoutesByModuleName,
  listModuleNames,
};
