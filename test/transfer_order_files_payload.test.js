const test = require("node:test");
const assert = require("node:assert/strict");

const {
  normalizeTransferOrderPayloadForBridge,
} = require("../src/modules/transfer_orders/service");

test("normalizeTransferOrderPayloadForBridge converts legacy file fields to bridge format", () => {
  const payload = {
    customform: 135,
    files: [
      {
        netsuiteId: "temp-001",
        fileUrl: "https://cloud.inlinegroupdc.com/s/xR34c667kEKZRsj",
        fileName: "Invoice Vendor",
      },
    ],
  };

  assert.deepEqual(normalizeTransferOrderPayloadForBridge(payload), {
    customform: 135,
    files: [
      {
        file_name: "Invoice Vendor",
        file_url: "https://cloud.inlinegroupdc.com/s/xR34c667kEKZRsj",
      },
    ],
  });
});

test("normalizeTransferOrderPayloadForBridge preserves already normalized files", () => {
  const payload = {
    files: [
      {
        file_name: "Invoice Vendor",
        file_url: "https://cloud.inlinegroupdc.com/s/xR34c667kEKZRsj",
      },
    ],
  };

  assert.deepEqual(normalizeTransferOrderPayloadForBridge(payload), {
    files: [
      {
        file_name: "Invoice Vendor",
        file_url: "https://cloud.inlinegroupdc.com/s/xR34c667kEKZRsj",
      },
    ],
  });
});
