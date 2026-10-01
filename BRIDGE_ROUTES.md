# Daftar Route API Bridge

Daftar seluruh endpoint yang terdaftar di sistem, dikelompokkan per module.

- Sumber routing: `src/routes/index.js` (root) dan `src/routes/V1/index.js` (semua module)
- Base prefix: `/api/v1/bridge` (kecuali module **reconcile** yang memakai `/api/v1/reconcile`)
- Kolom **Auth**: `OAuth2` = `verifyOAuth2Token`, `Token` = `verifyToken`, `-` = tanpa middleware auth

## Daftar Isi

0. [root](#0-root-health-check--dokumentasi)
1. [example](#1-example)
2. [customer](#2-customer)
3. [vendor](#3-vendor)
4. [items](#4-items)
5. [purchase_order](#5-purchase_order)
6. [inbound_shipment](#6-inbound_shipment)
7. [sync](#7-sync)
8. [api_client](#8-api_client)
9. [netsuite_scripts](#9-netsuite_scripts)
10. [auth](#10-auth)
11. [reconcile](#11-reconcile)
12. [webhook](#12-webhook)
13. [quotation](#13-quotation)
14. [bills](#14-bills)
15. [bills_payments](#15-bills_payments)
16. [sales_order](#16-sales_order)
17. [locations](#17-locations)
18. [vendor_returns](#18-vendor_returns)
19. [sales_delivery](#19-sales_delivery)
20. [inventory](#20-inventory)
21. [transfer_order](#21-transfer_order)
22. [customform](#22-customform)
23. [subsidiary](#23-subsidiary)
24. [currency](#24-currency)
25. [term](#25-term)
26. [log_activities](#26-log_activities)
27. [custbody_me_project_location](#27-custbody_me_project_location)
28. [custbody_me_saving_type](#28-custbody_me_saving_type)
29. [class](#29-class)
30. [project_segmentations](#30-project_segmentations)
31. [department](#31-department)
32. [taxcode](#32-taxcode)
33. [componen](#33-componen)
34. [custbody_me_pr_type](#34-custbody_me_pr_type)
35. [invoice_sales_order](#35-invoice_sales_order)
36. [outbox](#36-outbox)
37. [bank](#37-bank)
38. [receive](#38-receive)
39. [fulfillment](#39-fulfillment)
40. [logging](#40-logging)
41. [attach_file](#41-attach_file)

Total: **41 module**, **205 endpoint** (di luar route root).

## 0. root (health check & dokumentasi)

- File: `src/routes/index.js`

| Method | Endpoint | Handler | Auth |
|---|---|---|---|
| GET | `/` | info aplikasi / health check | - |
| GET | `/metrics` | metrics Prometheus | - |
| GET | `/documentation` | Swagger UI (aktif jika `SWAGGER_ENABLED`) | - |
| GET | `/public/*` | static file folder `public` | - |

## 1. example

- Folder: `src/modules/example`
- Base path: `/api/v1/bridge/examples`

| Method | Endpoint | Handler | Auth |
|---|---|---|---|
| GET | `/api/v1/bridge/examples` | getAll | - |
| GET | `/api/v1/bridge/examples/:id` | getById | - |
| POST | `/api/v1/bridge/examples` | create | - |
| PUT | `/api/v1/bridge/examples/:id` | update | - |
| DELETE | `/api/v1/bridge/examples/:id` | remove | - |
| POST | `/api/v1/bridge/examples/:id/restore` | restore | - |

## 2. customer

- Folder: `src/modules/customer`
- Base path: `/api/v1/bridge/customers`

| Method | Endpoint | Handler | Auth |
|---|---|---|---|
| POST | `/api/v1/bridge/customers/get` | getAll | OAuth2 |
| POST | `/api/v1/bridge/customers/returns` | getAllReturns | OAuth2 |
| GET | `/api/v1/bridge/customers/:id` | getById | OAuth2 |
| GET | `/api/v1/bridge/customers/netsuite/:netsuite_id` | getByNetSuiteId | OAuth2 |
| GET | `/api/v1/bridge/customers/netsuite/read` | readFromNetSuite | OAuth2 |
| POST | `/api/v1/bridge/customers/create` | create | OAuth2 |
| POST | `/api/v1/bridge/customers/update` | update | OAuth2 |
| POST | `/api/v1/bridge/customers/search` | searchFromNetSuite | OAuth2 |
| POST | `/api/v1/bridge/customers/return-receipt` | createReturnReceipt | OAuth2 |
| POST | `/api/v1/bridge/customers/return-receipt/sync/netsuite/:netsuite_id` | syncReturnReceipt | OAuth2 |
| POST | `/api/v1/bridge/customers/sync/netsuite/:netsuite_id` | syncByNetSuiteId | OAuth2 |

## 3. vendor

- Folder: `src/modules/vendor`
- Base path: `/api/v1/bridge/vendors`

| Method | Endpoint | Handler | Auth |
|---|---|---|---|
| POST | `/api/v1/bridge/vendors/get` | getAll | OAuth2 |
| GET | `/api/v1/bridge/vendors/:id` | getById | OAuth2 |
| GET | `/api/v1/bridge/vendors/netsuite/:netsuite_id` | getByNetSuiteId | OAuth2 |
| POST | `/api/v1/bridge/vendors/search` | searchFromNetSuite | OAuth2 |

## 4. items

- Folder: `src/modules/items`
- Base path: `/api/v1/bridge/items`

| Method | Endpoint | Handler | Auth |
|---|---|---|---|
| POST | `/api/v1/bridge/items/get` | getAll | OAuth2 |
| GET | `/api/v1/bridge/items/:id` | getById | OAuth2 |
| GET | `/api/v1/bridge/items/netsuite/:netsuite_id` | getByNetSuiteId | OAuth2 |
| POST | `/api/v1/bridge/items/search` | searchFromNetSuite | OAuth2 |
| POST | `/api/v1/bridge/items/item-receipt` | createItemReceipt | OAuth2 |
| POST | `/api/v1/bridge/items/item-fulfillment` | createItemFulfillment | OAuth2 |
| POST | `/api/v1/bridge/items/sync/netsuite/:netsuite_id` | syncByNetSuiteId | OAuth2 |
| POST | `/api/v1/bridge/items/sync/locations` | syncLocations | OAuth2 |
| POST | `/api/v1/bridge/items/sync/type-id` | syncTypeId | OAuth2 |
| POST | `/api/v1/bridge/items/:netsuite_id/type-id` | updateTypeId | OAuth2 |

## 5. purchase_order

- Folder: `src/modules/purchase_order`
- Base path: `/api/v1/bridge/purchase-orders`

| Method | Endpoint | Handler | Auth |
|---|---|---|---|
| POST | `/api/v1/bridge/purchase-orders/get` | getAll | OAuth2 |
| GET | `/api/v1/bridge/purchase-orders/:id` | getById | OAuth2 |
| GET | `/api/v1/bridge/purchase-orders/netsuite/:netsuite_id` | getByNetSuiteId | OAuth2 |
| POST | `/api/v1/bridge/purchase-orders/search` | searchFromNetSuite | OAuth2 |
| POST | `/api/v1/bridge/purchase-orders/get-list` | getList | OAuth2 |
| GET | `/api/v1/bridge/purchase-orders/sync/:id` | syncById | OAuth2 |
| POST | `/api/v1/bridge/purchase-orders/sync/findById` | syncByIds | OAuth2 |
| POST | `/api/v1/bridge/purchase-orders/sync/:netsuite_id/:internal_id` | syncByNetsuiteAndInternalId | OAuth2 |
| POST | `/api/v1/bridge/purchase-orders/create` | create | OAuth2 |
| POST | `/api/v1/bridge/purchase-orders/update` | update | OAuth2 |
| POST | `/api/v1/bridge/purchase-orders/approval` | transactionPurchaseOrder | OAuth2 |
| POST | `/api/v1/bridge/purchase-orders/print` | printPurchaseOrder | OAuth2 |
| POST | `/api/v1/bridge/purchase-orders/receive-item` | receiveItem | OAuth2 |
| POST | `/api/v1/bridge/purchase-orders/sync-all` | syncAll | OAuth2 |

## 6. inbound_shipment

- Folder: `src/modules/inbound_shipment`
- Base path: `/api/v1/bridge/inbound-shipments`

| Method | Endpoint | Handler | Auth |
|---|---|---|---|
| POST | `/api/v1/bridge/inbound-shipments/get` | getAll | OAuth2 |
| GET | `/api/v1/bridge/inbound-shipments/:id` | getById | OAuth2 |
| GET | `/api/v1/bridge/inbound-shipments/netsuite/:netsuite_id` | getByNetSuiteId | OAuth2 |
| POST | `/api/v1/bridge/inbound-shipments/search` | searchFromNetSuite | OAuth2 |
| POST | `/api/v1/bridge/inbound-shipments/receive` | receive | OAuth2 |
| POST | `/api/v1/bridge/inbound-shipments/receive-partial` | receivePartial | OAuth2 |

## 7. sync

- Folder: `src/modules/sync`
- Base path: `/api/v1/bridge/admin/sync`

| Method | Endpoint | Handler | Auth |
|---|---|---|---|
| POST | `/api/v1/bridge/admin/sync` | triggerSync | - |
| GET | `/api/v1/bridge/admin/sync/job/:jobId` | getJobStatus | - |
| GET | `/api/v1/bridge/admin/sync/status/:module` | getSyncStatus | - |
| GET | `/api/v1/bridge/admin/sync/failed` | getFailedJobs | - |
| POST | `/api/v1/bridge/admin/sync/failed/:jobId/retry` | retryFailedJob | - |

## 8. api_client

- Folder: `src/modules/api_client`
- Base path: `/api/v1/bridge/admin/api-clients`

| Method | Endpoint | Handler | Auth |
|---|---|---|---|
| GET | `/api/v1/bridge/admin/api-clients` | getAll | - |
| GET | `/api/v1/bridge/admin/api-clients/:id` | getById | - |
| POST | `/api/v1/bridge/admin/api-clients` | register | - |
| PUT | `/api/v1/bridge/admin/api-clients/:id` | update | - |
| POST | `/api/v1/bridge/admin/api-clients/:id/regenerate-secret` | regenerateSecret | - |
| POST | `/api/v1/bridge/admin/api-clients/:id/toggle-status` | toggleStatus | - |
| DELETE | `/api/v1/bridge/admin/api-clients/:id` | remove | - |

## 9. netsuite_scripts

- Folder: `src/modules/netsuite_scripts`
- Base path: `/api/v1/bridge/admin/netsuite-scripts`

| Method | Endpoint | Handler | Auth |
|---|---|---|---|
| GET | `/api/v1/bridge/admin/netsuite-scripts` | getAll | - |
| GET | `/api/v1/bridge/admin/netsuite-scripts/module/:module` | getByModule | - |
| GET | `/api/v1/bridge/admin/netsuite-scripts/:module/:operation` | getByModuleAndOperation | - |
| POST | `/api/v1/bridge/admin/netsuite-scripts` | create | - |
| PUT | `/api/v1/bridge/admin/netsuite-scripts/:module/:operation` | update | - |
| DELETE | `/api/v1/bridge/admin/netsuite-scripts/:module/:operation` | remove | - |

## 10. auth

- Folder: `src/modules/auth`
- Base path: `/api/v1/bridge/auth`

| Method | Endpoint | Handler | Auth |
|---|---|---|---|
| POST | `/api/v1/bridge/auth/token` | getTokenAlternative | - |
| GET | `/api/v1/bridge/auth/token` | getTokenAlternative | - |
| POST | `/api/v1/bridge/auth/revoke` | revokeToken | - |

## 11. reconcile

- Folder: `src/modules/reconcile`
- Base path: `/api/v1/reconcile`

| Method | Endpoint | Handler | Auth |
|---|---|---|---|
| GET | `/api/v1/reconcile/:module` | reconcileData | OAuth2 |

## 12. webhook

- Folder: `src/modules/webhook`
- Base path: `/api/v1/bridge/webhook`

| Method | Endpoint | Handler | Auth |
|---|---|---|---|
| POST | `/api/v1/bridge/webhook/auth/login` | login | - |
| POST | `/api/v1/bridge/webhook/logs` | getLogs | Token |
| POST | `/api/v1/bridge/webhook/logs/:id/retry` | retryLog | Token |
| GET | `/api/v1/bridge/webhook/subscribers` | getSubscribers | Token |
| GET | `/api/v1/bridge/webhook/subscribers/:id` | getSubscriberById | Token |
| POST | `/api/v1/bridge/webhook/subscribers` | createSubscriber | - |
| PUT | `/api/v1/bridge/webhook/subscribers/:id` | updateSubscriber | Token |
| DELETE | `/api/v1/bridge/webhook/subscribers/:id` | deleteSubscriber | Token |
| POST | `/api/v1/bridge/webhook/trigger-test` | triggerTestEvent | - |

## 13. quotation

- Folder: `src/modules/quotation`
- Base path: `/api/v1/bridge/quotations`

| Method | Endpoint | Handler | Auth |
|---|---|---|---|
| POST | `/api/v1/bridge/quotations/get` | getAll | OAuth2 |
| GET | `/api/v1/bridge/quotations/:id` | getById | OAuth2 |
| GET | `/api/v1/bridge/quotations/sync/:id` | syncById | OAuth2 |
| GET | `/api/v1/bridge/quotations/netsuite/:netsuite_id` | getByNetSuiteId | OAuth2 |
| POST | `/api/v1/bridge/quotations/search` | searchFromNetSuite | OAuth2 |
| POST | `/api/v1/bridge/quotations/create` | create | OAuth2 |
| POST | `/api/v1/bridge/quotations/update` | update | OAuth2 |
| POST | `/api/v1/bridge/quotations/print` | printQuotation | OAuth2 |

## 14. bills

- Folder: `src/modules/bills`
- Base path: `/api/v1/bridge/bills`

| Method | Endpoint | Handler | Auth |
|---|---|---|---|
| POST | `/api/v1/bridge/bills/get` | getAll | OAuth2 |
| GET | `/api/v1/bridge/bills/:id` | getById | OAuth2 |
| GET | `/api/v1/bridge/bills/netsuite/:netsuite_id` | getByNetSuiteId | OAuth2 |
| POST | `/api/v1/bridge/bills/search` | searchFromNetSuite | OAuth2 |

## 15. bills_payments

- Folder: `src/modules/bills_payments`
- Base path: `/api/v1/bridge/bills-payments`

| Method | Endpoint | Handler | Auth |
|---|---|---|---|
| POST | `/api/v1/bridge/bills-payments/get` | getAll | OAuth2 |
| GET | `/api/v1/bridge/bills-payments/:id` | getById | OAuth2 |
| GET | `/api/v1/bridge/bills-payments/sync/:id` | syncById | OAuth2 |
| GET | `/api/v1/bridge/bills-payments/netsuite/:netsuite_id` | getByNetSuiteId | OAuth2 |
| POST | `/api/v1/bridge/bills-payments/search` | searchFromNetSuite | OAuth2 |

## 16. sales_order

- Folder: `src/modules/sales_order`
- Base path: `/api/v1/bridge/sales-orders`

| Method | Endpoint | Handler | Auth |
|---|---|---|---|
| POST | `/api/v1/bridge/sales-orders/get` | getAll | OAuth2 |
| POST | `/api/v1/bridge/sales-orders/search` | searchFromNetSuite | OAuth2 |
| POST | `/api/v1/bridge/sales-orders/create` | create | OAuth2 |
| POST | `/api/v1/bridge/sales-orders/update` | update | OAuth2 |
| POST | `/api/v1/bridge/sales-orders/update/:id` | updateById | OAuth2 |
| GET | `/api/v1/bridge/sales-orders/sync/:id` | syncById | OAuth2 |
| POST | `/api/v1/bridge/sales-orders/sync/:netsuite_id/:internal_id` | syncByNetsuiteAndInternalId | OAuth2 |

## 17. locations

- Folder: `src/modules/locations`
- Base path: `/api/v1/bridge/locations`

| Method | Endpoint | Handler | Auth |
|---|---|---|---|
| POST | `/api/v1/bridge/locations/get` | getAll | OAuth2 |
| POST | `/api/v1/bridge/locations/search` | searchFromNetSuite | OAuth2 |

## 18. vendor_returns

- Folder: `src/modules/vendor_returns`
- Base path: `/api/v1/bridge/vendor-returns`

| Method | Endpoint | Handler | Auth |
|---|---|---|---|
| POST | `/api/v1/bridge/vendor-returns` | getAll | OAuth2 |
| POST | `/api/v1/bridge/vendor-returns/get` | getAll | OAuth2 |
| POST | `/api/v1/bridge/vendor-returns/search` | getAll | OAuth2 |
| POST | `/api/v1/bridge/vendor-returns/sync/netsuite/:netsuite_id` | syncVendorReturn | OAuth2 |

## 19. sales_delivery

- Folder: `src/modules/sales_delivery`
- Base path: `/api/v1/bridge/sales-deliveries`

| Method | Endpoint | Handler | Auth |
|---|---|---|---|
| POST | `/api/v1/bridge/sales-deliveries/get` | getAll | OAuth2 |
| POST | `/api/v1/bridge/sales-deliveries` | searchFromNetSuite | OAuth2 |

## 20. inventory

- Folder: `src/modules/inventory`
- Base path: `/api/v1/bridge/inventory`

| Method | Endpoint | Handler | Auth |
|---|---|---|---|
| POST | `/api/v1/bridge/inventory/adjustments/get` | getAdjustments | OAuth2 |
| POST | `/api/v1/bridge/inventory/adjustments/get-status` | getAdjustmentStatus | OAuth2 |
| POST | `/api/v1/bridge/inventory/adjustments/sync/:netsuite_id` | syncByNetsuiteId | OAuth2 |
| POST | `/api/v1/bridge/inventory/adjustments` | createAdjustment | OAuth2 |
| POST | `/api/v1/bridge/inventory/transfer` | createTransfer | OAuth2 |
| POST | `/api/v1/bridge/inventory/transfer/get` | getTransfers | OAuth2 |
| POST | `/api/v1/bridge/inventory/transfer/sync/:netsuite_id` | syncTransferByNetsuiteId | OAuth2 |
| POST | `/api/v1/bridge/inventory/transfer/:id` | updateTransfer | OAuth2 |

## 21. transfer_order

- Folder: `src/modules/transfer_order`
- Base path: `/api/v1/bridge/transfer-orders`

| Method | Endpoint | Handler | Auth |
|---|---|---|---|
| POST | `/api/v1/bridge/transfer-orders/get` | getAll | OAuth2 |
| POST | `/api/v1/bridge/transfer-orders/sync/:netsuite_id` | syncByNetsuiteId | OAuth2 |
| POST | `/api/v1/bridge/transfer-orders/item-receipt` | createItemReceipt | OAuth2 |
| POST | `/api/v1/bridge/transfer-orders/create` | create | OAuth2 |
| POST | `/api/v1/bridge/transfer-orders/update` | update | OAuth2 |

## 22. customform

- Folder: `src/modules/customform`
- Base path: `/api/v1/bridge/customform`

| Method | Endpoint | Handler | Auth |
|---|---|---|---|
| POST | `/api/v1/bridge/customform/get` | getAll | OAuth2 |
| POST | `/api/v1/bridge/customform/create` | create | OAuth2 |
| GET | `/api/v1/bridge/customform/:id` | getById | OAuth2 |
| PUT | `/api/v1/bridge/customform/:id` | update | OAuth2 |
| DELETE | `/api/v1/bridge/customform/:id` | remove | OAuth2 |

## 23. subsidiary

- Folder: `src/modules/subsidiary`
- Base path: `/api/v1/bridge/subsidiary`

| Method | Endpoint | Handler | Auth |
|---|---|---|---|
| POST | `/api/v1/bridge/subsidiary/get` | getAll | OAuth2 |
| POST | `/api/v1/bridge/subsidiary/sync/netsuite/:netsuite_id` | syncByNetSuiteId | OAuth2 |
| POST | `/api/v1/bridge/subsidiary/create` | create | OAuth2 |
| GET | `/api/v1/bridge/subsidiary/:id` | getById | OAuth2 |
| PUT | `/api/v1/bridge/subsidiary/:id` | update | OAuth2 |
| DELETE | `/api/v1/bridge/subsidiary/:id` | remove | OAuth2 |

## 24. currency

- Folder: `src/modules/currency`
- Base path: `/api/v1/bridge/currency`

| Method | Endpoint | Handler | Auth |
|---|---|---|---|
| POST | `/api/v1/bridge/currency/get` | getAll | OAuth2 |
| POST | `/api/v1/bridge/currency/create` | create | OAuth2 |
| GET | `/api/v1/bridge/currency/:id` | getById | OAuth2 |
| PUT | `/api/v1/bridge/currency/:id` | update | OAuth2 |
| DELETE | `/api/v1/bridge/currency/:id` | remove | OAuth2 |

## 25. term

- Folder: `src/modules/term`
- Base path: `/api/v1/bridge/term`

| Method | Endpoint | Handler | Auth |
|---|---|---|---|
| POST | `/api/v1/bridge/term/get` | getAll | OAuth2 |
| POST | `/api/v1/bridge/term/sync` | syncTerms | OAuth2 |
| POST | `/api/v1/bridge/term/create` | create | OAuth2 |
| GET | `/api/v1/bridge/term/:id` | getById | OAuth2 |
| PUT | `/api/v1/bridge/term/:id` | update | OAuth2 |
| DELETE | `/api/v1/bridge/term/:id` | remove | OAuth2 |

## 26. log_activities

- Folder: `src/modules/log_activities`
- Base path: `/api/v1/bridge/log_activities`

| Method | Endpoint | Handler | Auth |
|---|---|---|---|
| POST | `/api/v1/bridge/log_activities/get` | getAll | OAuth2 |

## 27. custbody_me_project_location

- Folder: `src/modules/custbody_me_project_location`
- Base path: `/api/v1/bridge/custbody_me_project_location`

| Method | Endpoint | Handler | Auth |
|---|---|---|---|
| POST | `/api/v1/bridge/custbody_me_project_location/get` | getAll | OAuth2 |
| POST | `/api/v1/bridge/custbody_me_project_location/create` | create | OAuth2 |
| GET | `/api/v1/bridge/custbody_me_project_location/:id` | getById | OAuth2 |
| PUT | `/api/v1/bridge/custbody_me_project_location/:id` | update | OAuth2 |
| DELETE | `/api/v1/bridge/custbody_me_project_location/:id` | remove | OAuth2 |

## 28. custbody_me_saving_type

- Folder: `src/modules/custbody_me_saving_type`
- Base path: `/api/v1/bridge/custbody_me_saving_type`

| Method | Endpoint | Handler | Auth |
|---|---|---|---|
| POST | `/api/v1/bridge/custbody_me_saving_type/get` | getAll | OAuth2 |
| POST | `/api/v1/bridge/custbody_me_saving_type/create` | create | OAuth2 |
| GET | `/api/v1/bridge/custbody_me_saving_type/:id` | getById | OAuth2 |
| PUT | `/api/v1/bridge/custbody_me_saving_type/:id` | update | OAuth2 |
| DELETE | `/api/v1/bridge/custbody_me_saving_type/:id` | remove | OAuth2 |

## 29. class

- Folder: `src/modules/class`
- Base path: `/api/v1/bridge/class`

| Method | Endpoint | Handler | Auth |
|---|---|---|---|
| POST | `/api/v1/bridge/class/get` | getAll | OAuth2 |
| POST | `/api/v1/bridge/class/create` | create | OAuth2 |
| GET | `/api/v1/bridge/class/:id` | getById | OAuth2 |
| PUT | `/api/v1/bridge/class/:id` | update | OAuth2 |
| DELETE | `/api/v1/bridge/class/:id` | remove | OAuth2 |

## 30. project_segmentations

- Folder: `src/modules/project_segmentations`
- Base path: `/api/v1/bridge/project-segmentations`

| Method | Endpoint | Handler | Auth |
|---|---|---|---|
| POST | `/api/v1/bridge/project-segmentations/get` | getAll | OAuth2 |
| POST | `/api/v1/bridge/project-segmentations/create` | create | OAuth2 |
| GET | `/api/v1/bridge/project-segmentations/:id` | getById | OAuth2 |
| PUT | `/api/v1/bridge/project-segmentations/:id` | update | OAuth2 |
| DELETE | `/api/v1/bridge/project-segmentations/:id` | remove | OAuth2 |

## 31. department

- Folder: `src/modules/department`
- Base path: `/api/v1/bridge/department`

| Method | Endpoint | Handler | Auth |
|---|---|---|---|
| POST | `/api/v1/bridge/department/get` | getAll | OAuth2 |
| POST | `/api/v1/bridge/department/create` | create | OAuth2 |
| GET | `/api/v1/bridge/department/:id` | getById | OAuth2 |
| PUT | `/api/v1/bridge/department/:id` | update | OAuth2 |
| DELETE | `/api/v1/bridge/department/:id` | remove | OAuth2 |

## 32. taxcode

- Folder: `src/modules/taxcode`
- Base path: `/api/v1/bridge/taxcode`

| Method | Endpoint | Handler | Auth |
|---|---|---|---|
| POST | `/api/v1/bridge/taxcode/get` | getAll | OAuth2 |
| POST | `/api/v1/bridge/taxcode/create` | create | OAuth2 |
| GET | `/api/v1/bridge/taxcode/:id` | getById | OAuth2 |
| PUT | `/api/v1/bridge/taxcode/:id` | update | OAuth2 |
| DELETE | `/api/v1/bridge/taxcode/:id` | remove | OAuth2 |

## 33. componen

- Folder: `src/modules/componen`
- Base path: `/api/v1/bridge/componen`

| Method | Endpoint | Handler | Auth |
|---|---|---|---|
| GET | `/api/v1/bridge/componen` | getAll | OAuth2 |

## 34. custbody_me_pr_type

- Folder: `src/modules/custbody_me_pr_type`
- Base path: `/api/v1/bridge/custbody_me_pr_type`

| Method | Endpoint | Handler | Auth |
|---|---|---|---|
| POST | `/api/v1/bridge/custbody_me_pr_type/get` | getAll | OAuth2 |
| POST | `/api/v1/bridge/custbody_me_pr_type/create` | create | OAuth2 |
| GET | `/api/v1/bridge/custbody_me_pr_type/:id` | getById | OAuth2 |
| PUT | `/api/v1/bridge/custbody_me_pr_type/:id` | update | OAuth2 |
| DELETE | `/api/v1/bridge/custbody_me_pr_type/:id` | remove | OAuth2 |

## 35. invoice_sales_order

- Folder: `src/modules/invoice_sales_order`
- Base path: `/api/v1/bridge/invoice-sales-orders`

| Method | Endpoint | Handler | Auth |
|---|---|---|---|
| POST | `/api/v1/bridge/invoice-sales-orders/get` | getAll | OAuth2 |

## 36. outbox

- Folder: `src/modules/outbox`
- Base path: `/api/v1/bridge/outbox-events`

| Method | Endpoint | Handler | Auth |
|---|---|---|---|
| GET | `/api/v1/bridge/outbox-events` | getList | OAuth2 |
| POST | `/api/v1/bridge/outbox-events/get-list` | getList | OAuth2 |
| POST | `/api/v1/bridge/outbox-events/replay` | replay | OAuth2 |
| GET | `/api/v1/bridge/outbox-events/:id` | getDetail | OAuth2 |

## 37. bank

- Folder: `src/modules/bank`
- Base path: `/api/v1/bridge/bank`

| Method | Endpoint | Handler | Auth |
|---|---|---|---|
| POST | `/api/v1/bridge/bank/get` | getAll | OAuth2 |

## 38. receive

- Folder: `src/modules/receive`
- Base path: `/api/v1/bridge/receives`

| Method | Endpoint | Handler | Auth |
|---|---|---|---|
| POST | `/api/v1/bridge/receives/get-list` | getList | OAuth2 |
| GET | `/api/v1/bridge/receives/sync/:id` | syncById | OAuth2 |
| POST | `/api/v1/bridge/receives/update/:id` | updateReceive | OAuth2 |

## 39. fulfillment

- Folder: `src/modules/fulfillment`
- Base path: `/api/v1/bridge/fulfillments`

| Method | Endpoint | Handler | Auth |
|---|---|---|---|
| POST | `/api/v1/bridge/fulfillments/get-list` | getList | OAuth2 |
| GET | `/api/v1/bridge/fulfillments/sync/:id` | syncById | OAuth2 |
| POST | `/api/v1/bridge/fulfillments/update/:id` | updateFulfillment | OAuth2 |

## 40. logging

- Folder: `src/modules/logging`
- Base path: `/api/v1/bridge/logging`

| Method | Endpoint | Handler | Auth |
|---|---|---|---|
| POST | `/api/v1/bridge/logging/activity/get` | getActivities | OAuth2 |
| POST | `/api/v1/bridge/logging/activity/retry` | retryActivity | OAuth2 |

## 41. attach_file

- Folder: `src/modules/attach_file`
- Base path: `/api/v1/bridge/attach_file`

| Method | Endpoint | Handler | Auth |
|---|---|---|---|
| GET | `/api/v1/bridge/attach_file` | getFiles | OAuth2 |
| POST | `/api/v1/bridge/attach_file` | createFiles | OAuth2 |
| PUT | `/api/v1/bridge/attach_file/:id` | updateFile | OAuth2 |
| DELETE | `/api/v1/bridge/attach_file/:id` | deleteFile | OAuth2 |
| PUT | `/api/v1/bridge/attach_file/delete/:id` | deleteFile | OAuth2 |
