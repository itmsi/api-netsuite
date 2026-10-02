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
  ["customer", "POST", "/api/v1/bridge/customers/get", "get customers"],
  [
    "customer",
    "POST",
    "/api/v1/bridge/customers/returns",
    "get customers returns",
  ],
  ["customer", "GET", "/api/v1/bridge/customers/:id", "get customers"],
  [
    "customer",
    "GET",
    "/api/v1/bridge/customers/netsuite/:netsuite_id",
    "get customers",
  ],
  [
    "customer",
    "GET",
    "/api/v1/bridge/customers/netsuite/read",
    "get customers",
  ],
  ["customer", "POST", "/api/v1/bridge/customers/create", "create customers"],
  ["customer", "POST", "/api/v1/bridge/customers/update", "update customers"],
  ["customer", "POST", "/api/v1/bridge/customers/search", "get customers"],
  [
    "customer",
    "POST",
    "/api/v1/bridge/customers/return-receipt",
    "create customers return receipt",
  ],
  [
    "customer",
    "POST",
    "/api/v1/bridge/customers/return-receipt/sync/netsuite/:netsuite_id",
    "sync customers return receipt",
  ],
  [
    "customer",
    "POST",
    "/api/v1/bridge/customers/sync/netsuite/:netsuite_id",
    "sync customers",
  ],

  // vendor
  ["vendor", "POST", "/api/v1/bridge/vendors/get", "get vendors"],
  ["vendor", "GET", "/api/v1/bridge/vendors/:id", "get vendors"],
  [
    "vendor",
    "GET",
    "/api/v1/bridge/vendors/netsuite/:netsuite_id",
    "get vendors",
  ],
  ["vendor", "POST", "/api/v1/bridge/vendors/search", "get vendors"],

  // items
  ["items", "POST", "/api/v1/bridge/items/get", "get items"],
  ["items", "GET", "/api/v1/bridge/items/:id", "get items"],
  ["items", "GET", "/api/v1/bridge/items/netsuite/:netsuite_id", "get items"],
  ["items", "POST", "/api/v1/bridge/items/search", "get items"],
  [
    "items",
    "POST",
    "/api/v1/bridge/items/item-receipt",
    "create items receipt",
  ],
  [
    "items",
    "POST",
    "/api/v1/bridge/items/item-fulfillment",
    "create items fulfillment",
  ],
  [
    "items",
    "POST",
    "/api/v1/bridge/items/sync/netsuite/:netsuite_id",
    "sync items",
  ],
  ["items", "POST", "/api/v1/bridge/items/sync/locations", "sync items"],
  ["items", "POST", "/api/v1/bridge/items/sync/type-id", "sync items"],
  ["items", "POST", "/api/v1/bridge/items/:netsuite_id/type-id", "sync items"],

  // purchase_order
  [
    "purchase_order",
    "POST",
    "/api/v1/bridge/purchase-orders/get",
    "get purchase orders",
  ],
  [
    "purchase_order",
    "GET",
    "/api/v1/bridge/purchase-orders/:id",
    "get purchase orders",
  ],
  [
    "purchase_order",
    "GET",
    "/api/v1/bridge/purchase-orders/netsuite/:netsuite_id",
    "get purchase orders",
  ],
  [
    "purchase_order",
    "POST",
    "/api/v1/bridge/purchase-orders/search",
    "get purchase orders",
  ],
  [
    "purchase_order",
    "POST",
    "/api/v1/bridge/purchase-orders/get-list",
    "get purchase orders",
  ],
  [
    "purchase_order",
    "GET",
    "/api/v1/bridge/purchase-orders/sync/:id",
    "sync purchase orders",
  ],
  [
    "purchase_order",
    "POST",
    "/api/v1/bridge/purchase-orders/sync/findById",
    "sync purchase orders",
  ],
  [
    "purchase_order",
    "POST",
    "/api/v1/bridge/purchase-orders/sync/:netsuite_id/:internal_id",
    "sync purchase orders",
  ],
  [
    "purchase_order",
    "POST",
    "/api/v1/bridge/purchase-orders/create",
    "create purchase orders",
  ],
  [
    "purchase_order",
    "POST",
    "/api/v1/bridge/purchase-orders/update",
    "update purchase orders",
  ],
  [
    "purchase_order",
    "POST",
    "/api/v1/bridge/purchase-orders/approval",
    "create approve purchase orders",
  ],
  [
    "purchase_order",
    "POST",
    "/api/v1/bridge/purchase-orders/print",
    "print purchase orders",
  ],
  [
    "purchase_order",
    "POST",
    "/api/v1/bridge/purchase-orders/receive-item",
    "create purchase orders receive item",
  ],
  [
    "purchase_order",
    "POST",
    "/api/v1/bridge/purchase-orders/sync-all",
    "sync purchase orders",
  ],

  // inbound_shipment
  [
    "inbound_shipment",
    "POST",
    "/api/v1/bridge/inbound-shipments/get",
    "get inbound shipments",
  ],
  [
    "inbound_shipment",
    "GET",
    "/api/v1/bridge/inbound-shipments/:id",
    "get inbound shipments",
  ],
  [
    "inbound_shipment",
    "GET",
    "/api/v1/bridge/inbound-shipments/netsuite/:netsuite_id",
    "get inbound shipments",
  ],
  [
    "inbound_shipment",
    "POST",
    "/api/v1/bridge/inbound-shipments/search",
    "get inbound shipments",
  ],
  [
    "inbound_shipment",
    "POST",
    "/api/v1/bridge/inbound-shipments/receive",
    "create inbound shipments receive",
  ],
  [
    "inbound_shipment",
    "POST",
    "/api/v1/bridge/inbound-shipments/receive-partial",
    "create inbound shipments receive partial",
  ],

  // sync
  ["sync", "POST", "/api/v1/bridge/admin/sync", "admin sync"],
  ["sync", "GET", "/api/v1/bridge/admin/sync/job/:jobId", "admin sync job"],
  [
    "sync",
    "GET",
    "/api/v1/bridge/admin/sync/status/:module",
    "admin sync status",
  ],
  ["sync", "GET", "/api/v1/bridge/admin/sync/failed", "admin sync failed"],
  [
    "sync",
    "POST",
    "/api/v1/bridge/admin/sync/failed/:jobId/retry",
    "admin sync failed retry",
  ],

  // api_client
  [
    "api_client",
    "GET",
    "/api/v1/bridge/admin/api-clients",
    "admin api clients",
  ],
  [
    "api_client",
    "GET",
    "/api/v1/bridge/admin/api-clients/:id",
    "admin api clients detail",
  ],
  [
    "api_client",
    "POST",
    "/api/v1/bridge/admin/api-clients",
    "admin api clients create",
  ],
  [
    "api_client",
    "PUT",
    "/api/v1/bridge/admin/api-clients/:id",
    "admin api clients update",
  ],
  [
    "api_client",
    "POST",
    "/api/v1/bridge/admin/api-clients/:id/regenerate-secret",
    "admin api clients regenerate secret",
  ],
  [
    "api_client",
    "POST",
    "/api/v1/bridge/admin/api-clients/:id/toggle-status",
    "admin api clients toggle status",
  ],
  [
    "api_client",
    "DELETE",
    "/api/v1/bridge/admin/api-clients/:id",
    "admin api clients delete",
  ],

  // netsuite_scripts
  [
    "netsuite_scripts",
    "GET",
    "/api/v1/bridge/admin/netsuite-scripts",
    "admin netsuite scripts",
  ],
  [
    "netsuite_scripts",
    "GET",
    "/api/v1/bridge/admin/netsuite-scripts/module/:module",
    "admin netsuite scripts module",
  ],
  [
    "netsuite_scripts",
    "GET",
    "/api/v1/bridge/admin/netsuite-scripts/:module/:operation",
    "admin netsuite scripts detail",
  ],
  [
    "netsuite_scripts",
    "POST",
    "/api/v1/bridge/admin/netsuite-scripts",
    "admin netsuite scripts create",
  ],
  [
    "netsuite_scripts",
    "PUT",
    "/api/v1/bridge/admin/netsuite-scripts/:module/:operation",
    "admin netsuite scripts update",
  ],
  [
    "netsuite_scripts",
    "DELETE",
    "/api/v1/bridge/admin/netsuite-scripts/:module/:operation",
    "admin netsuite scripts delete",
  ],

  // auth
  ["auth", "POST", "/api/v1/bridge/auth/token", "auth token"],
  ["auth", "GET", "/api/v1/bridge/auth/token", "auth token"],
  ["auth", "POST", "/api/v1/bridge/auth/revoke", "auth revoke"],

  // reconcile
  ["reconcile", "GET", "/api/v1/reconcile/:module", "reconcile"],

  // webhook
  [
    "webhook",
    "POST",
    "/api/v1/bridge/webhook/auth/login",
    "webhook auth login",
  ],
  ["webhook", "POST", "/api/v1/bridge/webhook/logs", "webhook logs"],
  [
    "webhook",
    "POST",
    "/api/v1/bridge/webhook/logs/:id/retry",
    "webhook logs retry",
  ],
  [
    "webhook",
    "GET",
    "/api/v1/bridge/webhook/subscribers",
    "webhook subscribers",
  ],
  [
    "webhook",
    "GET",
    "/api/v1/bridge/webhook/subscribers/:id",
    "webhook subscribers detail",
  ],
  [
    "webhook",
    "POST",
    "/api/v1/bridge/webhook/subscribers",
    "webhook subscribers create",
  ],
  [
    "webhook",
    "PUT",
    "/api/v1/bridge/webhook/subscribers/:id",
    "webhook subscribers update",
  ],
  [
    "webhook",
    "DELETE",
    "/api/v1/bridge/webhook/subscribers/:id",
    "webhook subscribers delete",
  ],
  [
    "webhook",
    "POST",
    "/api/v1/bridge/webhook/trigger-test",
    "webhook trigger test",
  ],

  // quotation
  ["quotation", "POST", "/api/v1/bridge/quotations/get", "get quotations"],
  ["quotation", "GET", "/api/v1/bridge/quotations/:id", "get quotations"],
  ["quotation", "GET", "/api/v1/bridge/quotations/sync/:id", "sync quotations"],
  [
    "quotation",
    "GET",
    "/api/v1/bridge/quotations/netsuite/:netsuite_id",
    "get quotations netsuite",
  ],
  [
    "quotation",
    "POST",
    "/api/v1/bridge/quotations/search",
    "get quotations search",
  ],
  [
    "quotation",
    "POST",
    "/api/v1/bridge/quotations/create",
    "create quotations",
  ],
  [
    "quotation",
    "POST",
    "/api/v1/bridge/quotations/update",
    "update quotations",
  ],
  ["quotation", "POST", "/api/v1/bridge/quotations/print", "print quotations"],

  // bills
  ["bills", "POST", "/api/v1/bridge/bills/get", "get bills"],
  ["bills", "GET", "/api/v1/bridge/bills/:id", "get bills"],
  ["bills", "GET", "/api/v1/bridge/bills/netsuite/:netsuite_id", "get bills"],
  ["bills", "POST", "/api/v1/bridge/bills/search", "get bills"],

  // bills_payments
  [
    "bills_payments",
    "POST",
    "/api/v1/bridge/bills-payments/get",
    "get bills payments",
  ],
  [
    "bills_payments",
    "GET",
    "/api/v1/bridge/bills-payments/:id",
    "get bills payments",
  ],
  [
    "bills_payments",
    "GET",
    "/api/v1/bridge/bills-payments/sync/:id",
    "sync bills payments",
  ],
  [
    "bills_payments",
    "GET",
    "/api/v1/bridge/bills-payments/netsuite/:netsuite_id",
    "get bills payments",
  ],
  [
    "bills_payments",
    "POST",
    "/api/v1/bridge/bills-payments/search",
    "get bills payments",
  ],

  // sales_order
  [
    "sales_order",
    "POST",
    "/api/v1/bridge/sales-orders/get",
    "get sales orders",
  ],
  [
    "sales_order",
    "POST",
    "/api/v1/bridge/sales-orders/search",
    "get sales orders",
  ],
  [
    "sales_order",
    "POST",
    "/api/v1/bridge/sales-orders/create",
    "create sales orders",
  ],
  [
    "sales_order",
    "POST",
    "/api/v1/bridge/sales-orders/update",
    "update sales orders",
  ],
  [
    "sales_order",
    "POST",
    "/api/v1/bridge/sales-orders/update/:id",
    "update sales orders",
  ],
  [
    "sales_order",
    "GET",
    "/api/v1/bridge/sales-orders/sync/:id",
    "sync sales orders",
  ],
  [
    "sales_order",
    "POST",
    "/api/v1/bridge/sales-orders/sync/:netsuite_id/:internal_id",
    "sync sales orders",
  ],

  // locations
  ["locations", "POST", "/api/v1/bridge/locations/get", "get locations"],
  ["locations", "POST", "/api/v1/bridge/locations/search", "get locations"],

  // vendor_returns
  [
    "vendor_returns",
    "POST",
    "/api/v1/bridge/vendor-returns",
    "get vendor returns",
  ],
  [
    "vendor_returns",
    "POST",
    "/api/v1/bridge/vendor-returns/get",
    "get vendor returns",
  ],
  [
    "vendor_returns",
    "POST",
    "/api/v1/bridge/vendor-returns/search",
    "get vendor returns",
  ],
  [
    "vendor_returns",
    "POST",
    "/api/v1/bridge/vendor-returns/sync/netsuite/:netsuite_id",
    "sync vendor returns",
  ],

  // sales_delivery
  [
    "sales_delivery",
    "POST",
    "/api/v1/bridge/sales-deliveries/get",
    "get sales deliveries",
  ],
  [
    "sales_delivery",
    "POST",
    "/api/v1/bridge/sales-deliveries",
    "create sales deliveries",
  ],

  // inventory
  [
    "inventory",
    "POST",
    "/api/v1/bridge/inventory/adjustments/get",
    "get inventory adjustments",
  ],
  [
    "inventory",
    "POST",
    "/api/v1/bridge/inventory/adjustments/get-status",
    "get inventory adjustments status",
  ],
  [
    "inventory",
    "POST",
    "/api/v1/bridge/inventory/adjustments/sync/:netsuite_id",
    "sync inventory adjustments",
  ],
  [
    "inventory",
    "POST",
    "/api/v1/bridge/inventory/adjustments",
    "create inventory adjustments",
  ],
  [
    "inventory",
    "POST",
    "/api/v1/bridge/inventory/transfer",
    "create inventory transfer",
  ],
  [
    "inventory",
    "POST",
    "/api/v1/bridge/inventory/transfer/get",
    "get inventory transfer",
  ],
  [
    "inventory",
    "POST",
    "/api/v1/bridge/inventory/transfer/sync/:netsuite_id",
    "sync inventory transfer",
  ],
  [
    "inventory",
    "POST",
    "/api/v1/bridge/inventory/transfer/:id",
    "get inventory transfer",
  ],

  // transfer_order
  [
    "transfer_order",
    "POST",
    "/api/v1/bridge/transfer-orders/get",
    "get transfer orders",
  ],
  [
    "transfer_order",
    "POST",
    "/api/v1/bridge/transfer-orders/sync/:netsuite_id",
    "sync transfer orders",
  ],
  [
    "transfer_order",
    "POST",
    "/api/v1/bridge/transfer-orders/item-receipt",
    "create transfer orders item receipt",
  ],
  [
    "transfer_order",
    "POST",
    "/api/v1/bridge/transfer-orders/create",
    "create transfer orders",
  ],
  [
    "transfer_order",
    "POST",
    "/api/v1/bridge/transfer-orders/update",
    "update transfer orders",
  ],

  // customform
  ["customform", "POST", "/api/v1/bridge/customform/get", "get customform"],
  [
    "customform",
    "POST",
    "/api/v1/bridge/customform/create",
    "create customform",
  ],
  ["customform", "GET", "/api/v1/bridge/customform/:id", "get customform"],
  ["customform", "PUT", "/api/v1/bridge/customform/:id", "update customform"],
  [
    "customform",
    "DELETE",
    "/api/v1/bridge/customform/:id",
    "delete customform",
  ],

  // subsidiary
  ["subsidiary", "POST", "/api/v1/bridge/subsidiary/get", "get subsidiary"],
  [
    "subsidiary",
    "POST",
    "/api/v1/bridge/subsidiary/sync/netsuite/:netsuite_id",
    "sync subsidiary",
  ],
  [
    "subsidiary",
    "POST",
    "/api/v1/bridge/subsidiary/create",
    "create subsidiary",
  ],
  ["subsidiary", "GET", "/api/v1/bridge/subsidiary/:id", "get subsidiary"],
  ["subsidiary", "PUT", "/api/v1/bridge/subsidiary/:id", "update subsidiary"],
  [
    "subsidiary",
    "DELETE",
    "/api/v1/bridge/subsidiary/:id",
    "delete subsidiary",
  ],

  // currency
  ["currency", "POST", "/api/v1/bridge/currency/get", "get currency"],
  ["currency", "POST", "/api/v1/bridge/currency/create", "create currency"],
  ["currency", "GET", "/api/v1/bridge/currency/:id", "get currency"],
  ["currency", "PUT", "/api/v1/bridge/currency/:id", "update currency"],
  ["currency", "DELETE", "/api/v1/bridge/currency/:id", "delete currency"],

  // term
  ["term", "POST", "/api/v1/bridge/term/get", "get term"],
  ["term", "POST", "/api/v1/bridge/term/sync", "sync term"],
  ["term", "POST", "/api/v1/bridge/term/create", "create term"],
  ["term", "GET", "/api/v1/bridge/term/:id", "get term"],
  ["term", "PUT", "/api/v1/bridge/term/:id", "update term"],
  ["term", "DELETE", "/api/v1/bridge/term/:id", "delete term"],

  // log_activities
  [
    "log_activities",
    "POST",
    "/api/v1/bridge/log_activities/get",
    "get log activities",
  ],

  // custbody_me_project_location
  [
    "custbody_me_project_location",
    "POST",
    "/api/v1/bridge/custbody_me_project_location/get",
    "get custbody_me_project_location",
  ],
  [
    "custbody_me_project_location",
    "POST",
    "/api/v1/bridge/custbody_me_project_location/create",
    "create custbody_me_project_location",
  ],
  [
    "custbody_me_project_location",
    "GET",
    "/api/v1/bridge/custbody_me_project_location/:id",
    "get custbody_me_project_location",
  ],
  [
    "custbody_me_project_location",
    "PUT",
    "/api/v1/bridge/custbody_me_project_location/:id",
    "update custbody_me_project_location",
  ],
  [
    "custbody_me_project_location",
    "DELETE",
    "/api/v1/bridge/custbody_me_project_location/:id",
    "delete custbody_me_project_location",
  ],

  // custbody_me_saving_type
  [
    "custbody_me_saving_type",
    "POST",
    "/api/v1/bridge/custbody_me_saving_type/get",
    "get custbody_me_saving_type",
  ],
  [
    "custbody_me_saving_type",
    "POST",
    "/api/v1/bridge/custbody_me_saving_type/create",
    "create custbody_me_saving_type",
  ],
  [
    "custbody_me_saving_type",
    "GET",
    "/api/v1/bridge/custbody_me_saving_type/:id",
    "get custbody_me_saving_type",
  ],
  [
    "custbody_me_saving_type",
    "PUT",
    "/api/v1/bridge/custbody_me_saving_type/:id",
    "update custbody_me_saving_type",
  ],
  [
    "custbody_me_saving_type",
    "DELETE",
    "/api/v1/bridge/custbody_me_saving_type/:id",
    "delete custbody_me_saving_type",
  ],

  // class
  ["class", "POST", "/api/v1/bridge/class/get", "get class"],
  ["class", "POST", "/api/v1/bridge/class/create", "create class"],
  ["class", "GET", "/api/v1/bridge/class/:id", "get class"],
  ["class", "PUT", "/api/v1/bridge/class/:id", "update class"],
  ["class", "DELETE", "/api/v1/bridge/class/:id", "delete class"],

  // project_segmentations
  [
    "project_segmentations",
    "POST",
    "/api/v1/bridge/project-segmentations/get",
    "get project segmentations",
  ],
  [
    "project_segmentations",
    "POST",
    "/api/v1/bridge/project-segmentations/create",
    "create project segmentations",
  ],
  [
    "project_segmentations",
    "GET",
    "/api/v1/bridge/project-segmentations/:id",
    "get project segmentations",
  ],
  [
    "project_segmentations",
    "PUT",
    "/api/v1/bridge/project-segmentations/:id",
    "update project segmentations",
  ],
  [
    "project_segmentations",
    "DELETE",
    "/api/v1/bridge/project-segmentations/:id",
    "delete project segmentations",
  ],

  // department
  ["department", "POST", "/api/v1/bridge/department/get", "get department"],
  [
    "department",
    "POST",
    "/api/v1/bridge/department/create",
    "create department",
  ],
  ["department", "GET", "/api/v1/bridge/department/:id", "get department"],
  ["department", "PUT", "/api/v1/bridge/department/:id", "update department"],
  [
    "department",
    "DELETE",
    "/api/v1/bridge/department/:id",
    "delete department",
  ],

  // taxcode
  ["taxcode", "POST", "/api/v1/bridge/taxcode/get", "get taxcode"],
  ["taxcode", "POST", "/api/v1/bridge/taxcode/create", "create taxcode"],
  ["taxcode", "GET", "/api/v1/bridge/taxcode/:id", "get taxcode"],
  ["taxcode", "PUT", "/api/v1/bridge/taxcode/:id", "update taxcode"],
  ["taxcode", "DELETE", "/api/v1/bridge/taxcode/:id", "delete taxcode"],

  // componen
  ["componen", "GET", "/api/v1/bridge/componen", "get componen"],

  // custbody_me_pr_type
  [
    "custbody_me_pr_type",
    "POST",
    "/api/v1/bridge/custbody_me_pr_type/get",
    "get custbody_me_pr_type",
  ],
  [
    "custbody_me_pr_type",
    "POST",
    "/api/v1/bridge/custbody_me_pr_type/create",
    "create custbody_me_pr_type",
  ],
  [
    "custbody_me_pr_type",
    "GET",
    "/api/v1/bridge/custbody_me_pr_type/:id",
    "get custbody_me_pr_type",
  ],
  [
    "custbody_me_pr_type",
    "PUT",
    "/api/v1/bridge/custbody_me_pr_type/:id",
    "update custbody_me_pr_type",
  ],
  [
    "custbody_me_pr_type",
    "DELETE",
    "/api/v1/bridge/custbody_me_pr_type/:id",
    "delete custbody_me_pr_type",
  ],

  // invoice_sales_order
  [
    "invoice_sales_order",
    "POST",
    "/api/v1/bridge/invoice-sales-orders/get",
    "get sales invoice",
  ],

  // outbox
  ["outbox", "GET", "/api/v1/bridge/outbox-events", "outbox events"],
  [
    "outbox",
    "POST",
    "/api/v1/bridge/outbox-events/get-list",
    "get outbox events",
  ],
  [
    "outbox",
    "POST",
    "/api/v1/bridge/outbox-events/replay",
    "replay outbox events",
  ],
  [
    "outbox",
    "GET",
    "/api/v1/bridge/outbox-events/:id",
    "get outbox events detail",
  ],

  // bank
  ["bank", "POST", "/api/v1/bridge/bank/get", "get bank"],

  // receive
  ["receive", "POST", "/api/v1/bridge/receives/get-list", "get receives"],
  ["receive", "GET", "/api/v1/bridge/receives/sync/:id", "sync receives"],
  ["receive", "POST", "/api/v1/bridge/receives/update/:id", "update receives"],

  // fulfillment
  [
    "fulfillment",
    "POST",
    "/api/v1/bridge/fulfillments/get-list",
    "get fulfillments",
  ],
  [
    "fulfillment",
    "GET",
    "/api/v1/bridge/fulfillments/sync/:id",
    "sync fulfillments",
  ],
  [
    "fulfillment",
    "POST",
    "/api/v1/bridge/fulfillments/update/:id",
    "update fulfillments",
  ],

  // logging
  [
    "logging",
    "POST",
    "/api/v1/bridge/logging/activity/get",
    "get logging activity",
  ],
  [
    "logging",
    "POST",
    "/api/v1/bridge/logging/activity/retry",
    "retry logging activity",
  ],

  // attach_file
  ["attach_file", "GET", "/api/v1/bridge/attach_file", "get attach file"],
  ["attach_file", "POST", "/api/v1/bridge/attach_file", "create attach file"],
  [
    "attach_file",
    "PUT",
    "/api/v1/bridge/attach_file/:id",
    "update attach file",
  ],
  [
    "attach_file",
    "DELETE",
    "/api/v1/bridge/attach_file/:id",
    "delete attach file",
  ],
  [
    "attach_file",
    "PUT",
    "/api/v1/bridge/attach_file/delete/:id",
    "delete attach file",
  ],
];

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const segmentsOf = (path) => path.split("/").filter(Boolean);
const isParam = (segment) => segment.startsWith(":");

const ROUTES = BRIDGE_ROUTES.map(
  ([module, method, path, moduleName], index) => {
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
  },
)
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
 * Daftar module_name unik (urutan sesuai BRIDGE_ROUTES.md)
 * Duplikat dibandingkan tanpa beda huruf besar/kecil & spasi berlebih
 */
const listModuleNames = () => {
  const map = new Map();
  [...ROUTES]
    .sort((a, b) => a.index - b.index)
    .forEach((r) => {
      const key = r.moduleName.trim().toLowerCase().replace(/\s+/g, " ");
      if (!map.has(key)) {
        map.set(key, { module_name: r.moduleName.trim() });
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
