const { Registration } = require("../models/registrationModel");
const { User } = require("../models/userModel");

//  OVERVIEW STATS 
const getOverviewStats = async () => {
  const [
    totalUsers,
    totalStaff,
    totalAdmins,
    totalRegistrations,
    pendingApplications,
    approvedApplications,
    rejectedApplications,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: "staff" }),
    User.countDocuments({ role: "admin" }),
    Registration.countDocuments(),
    Registration.countDocuments({ status: { $in: ["submitted", "under_review"] } }),
    Registration.countDocuments({ status: "approved" }),
    Registration.countDocuments({ status: "rejected" }),
  ]);

  return {
    totalUsers,
    totalStaff,
    totalAdmins,
    totalRegistrations,
    pendingApplications,
    approvedApplications,
    rejectedApplications,
  };
};



//  MONTHLY REGISTRATIONS 
const getMonthlyRegistrations = async () => {
  return Registration.aggregate([
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
    {
      $project: {
        _id: 0,
        month: {
          $concat: [
            { $toString: "$_id.month" },
            "-",
            { $toString: "$_id.year" },
          ],
        },
        count: 1,
      },
    },
  ]);
};



// TOP VEHICLE MODELS...MOST REGISTERED
const getTopVehicleModels = async () => {
  return Registration.aggregate([
    {
      $group: {
        _id: "$vehicle.model",
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
    { $limit: 10 },
    {
      $project: {
        _id: 0,
        model: "$_id",
        count: 1,
      },
    },
  ]);
};



//  STATUS BREAKDOWN 
const getStatusBreakdown = async () => {
  const result = await Registration.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  const formatted = {};
  result.forEach((item) => {
    formatted[item._id] = item.count;
  });

  return formatted;
};

module.exports = {
  getOverviewStats,
  getMonthlyRegistrations,
  getTopVehicleModels,
  getStatusBreakdown,
};