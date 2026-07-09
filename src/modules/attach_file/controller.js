const service = require('./service');
const nextcloud = require('../../utils/nextcloud');
const path = require('path');

const getList = async (req, res) => {
  try {
    const { page = 1, limit = 10, sort_by = 'created_at', sort_order = 'desc', search = '', netsuite_id = '' } = req.body;
    
    const filters = {
      search,
      netsuite_id,
      sort_by,
      sort_order
    };

    const result = await service.getList(filters, page, limit);

    return res.status(200).json({
      success: true,
      data: result,
      message: 'Data berhasil diambil'
    });
  } catch (error) {
    console.error('Error fetching attach files:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch data',
      error: error.message
    });
  }
};

const create = async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const { netsuite_id, file_name, type } = req.body;

    // Extract original extension
    const extension = path.extname(file.originalname);

    // Determine the base name to use
    let baseName = file_name || file.originalname;
    if (path.extname(baseName)) {
      baseName = path.basename(baseName, path.extname(baseName));
    }

    // Normalize characters to lowercase and replace spaces with underscore
    const normalizedBaseName = baseName.toLowerCase().replace(/\s+/g, '_');

    // Combine to form the finalized file name
    const fileName = `${Date.now()}_${normalizedBaseName}${extension}`;
    
    let uploadDir = nextcloud.NEXTCLOUD_UPLOAD_DIR;
    
    if (type === 'purchase_order' && netsuite_id) {
      const poRecord = await service.getPurchaseOrderByPoId(netsuite_id);
      if (poRecord) {
        const year = new Date().getFullYear();
        const folderName = poRecord.po_number || netsuite_id;
        uploadDir = `/NetSuite/PurchasingOrders/${year}/${folderName}`;
      }
    }
    
    const filePath = `${uploadDir}/${fileName}`;

    // Ensure upload dir exists
    await nextcloud.ensureDirectoryExists(uploadDir);

    // Upload to Nextcloud WebDAV
    await nextcloud.client.putFileContents(filePath, file.buffer);

    // Generate public share link
    const shareUrl = await nextcloud.generateShareLink(filePath);

    // If netsuite_id provided, save to DB now, else wait for finalize
    let result = {};
    if (netsuite_id) {
      result = await service.saveFileRecord({
        netsuite_id,
        file_name: fileName,
        storage_provider: 'nextcloud',
        storage_path: filePath,
        share_url: shareUrl,
        // type might be needed if there is a column for it, but not listed in schema provided, omitting unless needed
      });
    }

    return res.status(200).json({
      success: true,
      id: result?.id || null,
      netsuiteId: netsuite_id || null,
      fileUrl: shareUrl,
      storagePath: filePath,
      fileName: file_name
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to upload file to Nextcloud',
      error: error.message
    });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { fileUrl, file_name, netsuite_id, type } = req.body;
    const file = req.file; 

    // We can find record by ID since it's PUT /attach_file/:id
    const fileRecord = await service.getFileRecordById(id);

    if (!fileRecord) {
      return res.status(404).json({ success: false, message: 'File record not found' });
    }

    let finalStoragePath = fileRecord.storage_path;
    let finalShareUrl = fileRecord.share_url;
    let finalFileName = fileRecord.file_name;

    let dirPath = path.dirname(fileRecord.storage_path);
    if (type === 'purchase_order' && netsuite_id) {
      const poRecord = await service.getPurchaseOrderByPoId(netsuite_id);
      if (poRecord) {
        const year = new Date().getFullYear();
        const folderName = poRecord.po_number || netsuite_id;
        dirPath = `/NetSuite/PurchasingOrders/${year}/${folderName}`;
      }
    }

    // Ensure final dir exists if it changed
    await nextcloud.ensureDirectoryExists(dirPath);

    // SCENARIO: File was uploaded, replace existing file
    if (file) {
      const extension = path.extname(file.originalname);
      let baseName = file_name || file.originalname;
      if (path.extname(baseName)) {
        baseName = path.basename(baseName, path.extname(baseName));
      }
      const normalizedBaseName = baseName.toLowerCase().replace(/\s+/g, '_');
      finalFileName = `${Date.now()}_${normalizedBaseName}${extension}`;
      
      finalStoragePath = `${dirPath}/${finalFileName}`;

      await nextcloud.client.putFileContents(finalStoragePath, file.buffer);
      finalShareUrl = await nextcloud.generateShareLink(finalStoragePath);

      // Try to delete old file
      try {
        const exists = await nextcloud.client.exists(fileRecord.storage_path);
        if (exists) {
          await nextcloud.client.deleteFile(fileRecord.storage_path);
        }
      } catch (e) {
        console.warn(`Could not delete old file in Nextcloud: ${fileRecord.storage_path}`, e.message);
      }
    } else if (file_name || dirPath !== path.dirname(fileRecord.storage_path)) {
      // SCENARIO: Only file_name changes or directory changes
      const extension = path.extname(fileRecord.storage_path);
      let baseName = file_name || fileRecord.file_name;
      if (path.extname(baseName)) {
        baseName = path.basename(baseName, path.extname(baseName));
      }
      const normalizedBaseName = baseName.toLowerCase().replace(/\s+/g, '_');
      finalFileName = `${Date.now()}_${normalizedBaseName}${extension}`;
      
      finalStoragePath = `${dirPath}/${finalFileName}`;

      if (fileRecord.storage_path !== finalStoragePath) {
        try {
          await nextcloud.client.moveFile(fileRecord.storage_path, finalStoragePath);
          finalShareUrl = await nextcloud.generateShareLink(finalStoragePath);
        } catch (ncError) {
          console.error('Error renaming/moving in Nextcloud:', ncError);
          return res.status(500).json({ success: false, message: 'Failed to move file in Nextcloud', error: ncError.message });
        }
      }
    }

    const updateData = {};
    if (file || file_name || dirPath !== path.dirname(fileRecord.storage_path)) {
      updateData.file_name = finalFileName;
      updateData.storage_path = finalStoragePath;
      updateData.share_url = finalShareUrl;
    }

    if (netsuite_id) {
      updateData.netsuite_id = netsuite_id;
    }

    if (Object.keys(updateData).length > 0) {
      await service.updateFileRecord(id, updateData);
    }

    return res.status(200).json({
      success: true,
      message: 'File record updated successfully',
      data: {
        id,
        fileUrl: finalShareUrl,
        storagePath: finalStoragePath,
        fileName: finalFileName
      }
    });

  } catch (error) {
    console.error('Error updating file:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update file',
      error: error.message
    });
  }
};

const destroy = async (req, res) => {
  try {
    const { id } = req.params;

    const fileRecord = await service.getFileRecordById(id);
    if (!fileRecord) {
      return res.status(200).json({
        success: true,
        message: 'File deleted successfully'
      });
    }

    try {
      const exists = await nextcloud.client.exists(fileRecord.storage_path);
      if (exists) {
        await nextcloud.client.deleteFile(fileRecord.storage_path);
      }
    } catch (ncError) {
      console.error(`Failed to delete file from Nextcloud:`, ncError.message);
    }

    await service.deleteFileRecord(fileRecord.id);

    return res.status(200).json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting file:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete file',
      error: error.message
    });
  }
};

module.exports = {
  getList,
  create,
  update,
  destroy
};
