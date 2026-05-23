const Document = require('../models/Document');


// 📌 Submit document
const submitDocument = async (req, res) => {
  try {
    const document = await Document.create({
      vehicleId: req.body.vehicleId,
      documentType: req.body.documentType,
      fileUrl: req.body.fileUrl,
      submittedBy: req.body.submittedBy,
    });

    res.status(201).json(document);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// 📌 Get documents for a vehicle
const getVehicleDocuments = async (req, res) => {
  try {
    const documents = await Document.find({
      vehicleId: req.params.vehicleId
    });

    res.json(documents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// 📌 Verify document
const verifyDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    document.status = "verified";
    await document.save();

    res.json(document);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// 📌 Reject document
const rejectDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    document.status = "rejected";
    await document.save();

    res.json(document);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// 📌 Delete all documents (TEMP TOOL)
const deleteAllDocuments = async (req, res) => {
  try {
    await Document.deleteMany({});
    res.json({ message: "All documents deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ✅ EXPORTS (always last)
module.exports = {
  submitDocument,
  getVehicleDocuments,
  verifyDocument,
  rejectDocument,
  deleteAllDocuments
};
