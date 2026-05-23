const Document = require('../models/Document');

const submitDocument = async (req, res) => {
  try {

    const document = await Document.create({
      vehicleId: req.body.vehicleId,
      documentType: req.body.documentType,
      fileUrl: req.body.fileUrl,
      submittedBy: req.user._id      
    });

    res.status(201).json(document);

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }
};

const getVehicleDocuments = async (req, res) => {

  try {

    const documents = await Document.find({
      vehicleId: req.params.vehicleId
    });

    res.json(documents);

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }
};

const verifyDocument = async (req, res) => {

  try {

    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        message: 'Document not found'
      });
    }

    document.status = 'verified';

    await document.save();

    res.json(document);

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }
};

const rejectDocument = async (req, res) => {

  try {

    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        message: 'Document not found'
      });
    }

    document.status = 'rejected';

    await document.save();

    res.json(document);

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }
};

module.exports = {
  submitDocument,
  getVehicleDocuments,
  verifyDocument,
  rejectDocument
};0

