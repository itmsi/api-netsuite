const axios = require("axios");
const authService = require("../auth/service");

/**
 * Hit bridge endpoint approval-all
 */
const approvalAll = async (body) => {
  try {
    const payload = {
      id: body.id,
      recordType: body.recordType,
      note: body.note,
      noteTitle: body.noteTitle,
      actionId: body.actionId,
      custbody_me_wf_next_approver_blank:
        body.custbody_me_wf_next_approver_blank,
    };

    const tokenResponse = await authService.getToken();
    const token = tokenResponse.data.access_token;

    const baseUrl = process.env.BRIDGE_BASE_URL || "http://localhost:9570";
    const url = `${baseUrl}/api/v1/bridge/approval-all`;

    const response = await axios.post(url, payload, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      timeout: 1500000,
    });

    const result = response.data;
    if (
      result &&
      (result.status === "error" || result.data?.status === "error")
    ) {
      result.success = false;
    }
    return result;
  } catch (error) {
    if (error.response) {
      throw {
        message:
          error.response.data?.message ||
          "Failed to process approval via bridge API",
        statusCode: error.response.status,
        errors: error.response.data,
      };
    }
    throw { message: error.message, statusCode: 500 };
  }
};

module.exports = {
  approvalAll,
};
