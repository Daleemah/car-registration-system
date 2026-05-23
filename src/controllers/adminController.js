const adminDashboardService = require('../services/adminDashboardService');
const { asyncHandler } = require('../utils/asyncHandler');
const json2csv = require('json2csv').parse;

// Get overview statistics (simplified)
const getOverviewStats = asyncHandler(async (req, res) => {
  const stats = await adminDashboardService.getOverviewStats();
  res.json({ success: true, data: stats });
});

// Get comprehensive dashboard statistics
const getDashboardStats = asyncHandler(async (req, res) => {
  const stats = await adminDashboardService.getDashboardStats();
  res.json({ success: true, data: stats });
});

// Get monthly registrations
const getMonthlyRegistrations = asyncHandler(async (req, res) => {
  const data = await adminDashboardService.getMonthlyRegistrations();
  res.json({ success: true, data });
});

// Get top vehicle models
const getTopVehicleModels = asyncHandler(async (req, res) => {
  const data = await adminDashboardService.getTopVehicleModels();
  res.json({ success: true, data });
});

// Get status breakdown
const getStatusBreakdown = asyncHandler(async (req, res) => {
  const data = await adminDashboardService.getStatusBreakdown();
  res.json({ success: true, data });
});

// Get registration trends
const getRegistrationTrends = asyncHandler(async (req, res) => {
  const { period = 'monthly' } = req.query;
  const trends = await adminDashboardService.getRegistrationTrends(period);
  res.json({ success: true, data: trends });
});

// Get vehicle class distribution
const getVehicleClassDistribution = asyncHandler(async (req, res) => {
  const distribution = await adminDashboardService.getVehicleClassDistribution();
  res.json({ success: true, data: distribution });
});

// Get top users
const getTopUsers = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;
  const topUsers = await adminDashboardService.getTopUsers(parseInt(limit));
  res.json({ success: true, data: topUsers });
});

// Get revenue breakdown
const getRevenueBreakdown = asyncHandler(async (req, res) => {
  const revenue = await adminDashboardService.getRevenueBreakdown();
  res.json({ success: true, data: revenue });
});

// Get recent activities
const getRecentActivities = asyncHandler(async (req, res) => {
  const { limit = 20 } = req.query;
  const activities = await adminDashboardService.getRecentActivities(parseInt(limit));
  res.json({ success: true, data: activities });
});

// Get user activity summary
const getUserActivitySummary = asyncHandler(async (req, res) => {
  const summary = await adminDashboardService.getUserActivitySummary();
  res.json({ success: true, data: summary });
});

// Export data
const exportData = asyncHandler(async (req, res) => {
  const { type, format = 'csv', ...filters } = req.query;
  
  if (!['registrations', 'users', 'revenue'].includes(type)) {
    return res.status(400).json({ 
      success: false, 
      message: 'Invalid export type. Choose: registrations, users, or revenue' 
    });
  }

  const { headers, data } = await adminDashboardService.exportData(type, filters);

  if (format === 'csv') {
    const csv = json2csv(data, { fields: headers });
    res.header('Content-Type', 'text/csv');
    res.attachment(`${type}_export_${Date.now()}.csv`);
    return res.send(csv);
  } else {
    res.json({ success: true, data: { headers, rows: data } });
  }
});

// Get system health
const getSystemHealth = asyncHandler(async (req, res) => {
  const health = await adminDashboardService.getSystemHealth();
  res.json({ success: true, data: health });
});

module.exports = {
  getOverviewStats,
  getDashboardStats,
  getMonthlyRegistrations,
  getTopVehicleModels,
  getStatusBreakdown,
  getRegistrationTrends,
  getVehicleClassDistribution,
  getTopUsers,
  getRevenueBreakdown,
  getRecentActivities,
  getUserActivitySummary,
  exportData,
  getSystemHealth,
};