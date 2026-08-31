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

test("getTransferOrderFinalizeTargets includes inline storagePath files for temp records", () => {
  const {
    getTransferOrderFinalizeTargets,
  } = require("../src/modules/transfer_orders/service");

  const targets = getTransferOrderFinalizeTargets("temp-003", [
    {
      netsuiteId: "temp-003",
      fileUrl: "https://cloud.inlinegroupdc.com/s/tmmi7w6gTEbwdGL",
      storagePath: "/Temp/1788150994439_tempto003.jpg",
      fileName: "tempto003",
    },
  ]);

  assert.deepEqual(targets, [
    {
      storage_path: "/Temp/1788150994439_tempto003.jpg",
      share_url: "https://cloud.inlinegroupdc.com/s/tmmi7w6gTEbwdGL",
      file_name: "tempto003",
      netsuite_id: "temp-003",
    },
  ]);
});
