const asyncHandler = require("../utils/asyncHandler");
const dashboardService = require("../services/adminDashboardService");



//  OVERVIEW 
const getOverview = asyncHandler(async (req, res) => {
  const data = await dashboardService.getOverviewStats();

  res.json({
    success: true,
    data,
  });
});



//  MONTHLY 
const getMonthly = asyncHandler(async (req, res) => {
  const data = await dashboardService.getMonthlyRegistrations();

  res.json({
    success: true,
    data,
  });
});



//  TOP MODELS...most registered cars
const getTopModels = asyncHandler(async (req, res) => {
  const data = await dashboardService.getTopVehicleModels();

  res.json({
    success: true,
    data,
  });
});



//  STATUS BREAKDOWN 
const getStatus = asyncHandler(async (req, res) => {
  const data = await dashboardService.getStatusBreakdown();

  res.json({
    success: true,
    data,
  });
});

module.exports = {
  getOverview,
  getMonthly,
  getTopModels,
  getStatus,
};