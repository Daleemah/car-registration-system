const { User } = require('../models/userModel');
const { Registration } = require('../models/registrationModel');
const { ActivityLogger } = require('./activityLogService');
const mongoose = require('mongoose');

class AdminDashboardService {
  /**
   * Get dashboard statistics
   */
  async getDashboardStats() {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfYear = new Date(today.getFullYear(), 0, 1);

    const [
      totalUsers,
      totalStaff,
      totalAdmins,
      newUsersToday,
      newUsersThisWeek,
      newUsersThisMonth,
      totalRegistrations,
      pendingRegistrations,
      approvedRegistrations,
      rejectedRegistrations,
      underReviewRegistrations,
      newRegistrationsToday,
      newRegistrationsThisWeek,
      newRegistrationsThisMonth,
      activeRegistrations,
      expiredRegistrations,
      expiringIn30Days,
      totalRevenue,
      revenueThisMonth,
      revenueThisYear,
      pendingPayments,
    ] = await Promise.all([
      // User stats
      User.countDocuments(),
      User.countDocuments({ role: 'staff' }),
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({ createdAt: { $gte: startOfDay } }),
      User.countDocuments({ createdAt: { $gte: startOfWeek } }),
      User.countDocuments({ createdAt: { $gte: startOfMonth } }),
      
      // Registration stats
      Registration.countDocuments(),
      Registration.countDocuments({ status: 'submitted' }),
      Registration.countDocuments({ status: 'approved' }),
      Registration.countDocuments({ status: 'rejected' }),
      Registration.countDocuments({ status: 'under_review' }),
      Registration.countDocuments({ createdAt: { $gte: startOfDay } }),
      Registration.countDocuments({ createdAt: { $gte: startOfWeek } }),
      Registration.countDocuments({ createdAt: { $gte: startOfMonth } }),
      Registration.countDocuments({ status: 'approved', expiresAt: { $gt: new Date() } }),
      Registration.countDocuments({ status: 'approved', expiresAt: { $lt: new Date() } }),
      Registration.countDocuments({ 
        status: 'approved', 
        expiresAt: { 
          $gte: new Date(), 
          $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) 
        } 
      }),
      
      // Revenue stats
      Registration.aggregate([
        { $match: { paymentVerified: true } },
        { $group: { _id: null, total: { $sum: '$feeAmount' } } }
      ]),
      Registration.aggregate([
        { $match: { paymentVerified: true, createdAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$feeAmount' } } }
      ]),
      Registration.aggregate([
        { $match: { paymentVerified: true, createdAt: { $gte: startOfYear } } },
        { $group: { _id: null, total: { $sum: '$feeAmount' } } }
      ]),
      Registration.countDocuments({ paymentVerified: false, paymentReference: { $exists: true } }),
    ]);

    return {
      users: {
        total: totalUsers,
        staff: totalStaff,
        admins: totalAdmins,
        newToday: newUsersToday,
        newThisWeek: newUsersThisWeek,
        newThisMonth: newUsersThisMonth,
      },
      registrations: {
        total: totalRegistrations,
        pending: pendingRegistrations,
        approved: approvedRegistrations,
        rejected: rejectedRegistrations,
        underReview: underReviewRegistrations,
        newToday: newRegistrationsToday,
        newThisWeek: newRegistrationsThisWeek,
        newThisMonth: newRegistrationsThisMonth,
        active: activeRegistrations,
        expired: expiredRegistrations,
        expiringIn30Days: expiringIn30Days,
      },
      revenue: {
        total: totalRevenue[0]?.total || 0,
        thisMonth: revenueThisMonth[0]?.total || 0,
        thisYear: revenueThisYear[0]?.total || 0,
        pendingPayments: pendingPayments,
      },
      lastUpdated: new Date(),
    };
  }

  /**
   * Get recent activities
   */
  async getRecentActivities(limit = 20) {
    const recentRegistrations = await Registration.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('applicantId', 'fullName email')
      .populate('adminReview.reviewedBy', 'fullName')
      .populate('staffReview.reviewedBy', 'fullName')
      .select('status vehicle createdAt applicantId feeAmount');

    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('fullName email role createdAt isActive');

    return {
      recentRegistrations,
      recentUsers,
    };
  }

  /**
   * Get registration trends (daily/weekly/monthly)
   */
  async getRegistrationTrends(period = 'monthly') {
    let groupBy = {};
    let dateFormat = '';
    
    switch(period) {
      case 'daily':
        groupBy = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        };
        dateFormat = '%Y-%m-%d';
        break;
      case 'weekly':
        groupBy = {
          year: { $year: '$createdAt' },
          week: { $week: '$createdAt' }
        };
        dateFormat = '%Y-W%V';
        break;
      case 'monthly':
      default:
        groupBy = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        };
        dateFormat = '%Y-%m';
        break;
    }

    const trends = await Registration.aggregate([
      {
        $group: {
          _id: groupBy,
          count: { $sum: 1 },
          approved: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
          rejected: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'submitted'] }, 1, 0] } },
          revenue: { $sum: { $cond: [{ $eq: ['$paymentVerified', true] }, '$feeAmount', 0] } },
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.week': 1 } },
      { $limit: 12 }
    ]);

    return trends;
  }

  /**
   * Get vehicle class distribution
   */
  async getVehicleClassDistribution() {
    const distribution = await Registration.aggregate([
      {
        $group: {
          _id: '$vehicle.vehicleClass',
          count: { $sum: 1 },
          totalRevenue: { $sum: { $cond: [{ $eq: ['$paymentVerified', true] }, '$feeAmount', 0] } }
        }
      },
      { $sort: { count: -1 } }
    ]);

    return distribution;
  }

  /**
   * Get top users by registrations
   */
  async getTopUsers(limit = 10) {
    const topUsers = await Registration.aggregate([
      {
        $group: {
          _id: '$applicantId',
          registrationCount: { $sum: 1 },
          totalPaid: { $sum: { $cond: [{ $eq: ['$paymentVerified', true] }, '$feeAmount', 0] } }
        }
      },
      { $sort: { registrationCount: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          _id: 1,
          fullName: '$user.fullName',
          email: '$user.email',
          registrationCount: 1,
          totalPaid: 1
        }
      }
    ]);

    return topUsers;
  }

  /**
   * Get revenue breakdown by period
   */
  async getRevenueBreakdown() {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfYear = new Date(today.getFullYear(), 0, 1);

    const [daily, weekly, monthly, yearly, byVehicleClass] = await Promise.all([
      // Daily revenue (last 7 days)
      Registration.aggregate([
        { $match: { paymentVerified: true, createdAt: { $gte: new Date(today.setDate(today.getDate() - 7)) } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            amount: { $sum: '$feeAmount' },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      
      // Weekly revenue (last 4 weeks)
      Registration.aggregate([
        { $match: { paymentVerified: true, createdAt: { $gte: new Date(today.setDate(today.getDate() - 28)) } } },
        {
          $group: {
            _id: { $isoWeek: '$createdAt' },
            amount: { $sum: '$feeAmount' },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      
      // Monthly revenue (last 12 months)
      Registration.aggregate([
        { $match: { paymentVerified: true, createdAt: { $gte: new Date(today.getFullYear() - 1, today.getMonth(), 1) } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
            amount: { $sum: '$feeAmount' },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      
      // Yearly revenue
      Registration.aggregate([
        { $match: { paymentVerified: true } },
        {
          $group: {
            _id: { $year: '$createdAt' },
            amount: { $sum: '$feeAmount' },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      
      // Revenue by vehicle class
      this.getVehicleClassDistribution(),
    ]);

    return {
      daily,
      weekly,
      monthly,
      yearly,
      byVehicleClass,
    };
  }

  /**
   * Get user activity summary
   */
  async getUserActivitySummary() {
    const activeUsers = await User.countDocuments({ isActive: true });
    const inactiveUsers = await User.countDocuments({ isActive: false });
    
    const usersByRole = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
          active: { $sum: { $cond: ['$isActive', 1, 0] } }
        }
      }
    ]);

    return {
      total: activeUsers + inactiveUsers,
      active: activeUsers,
      inactive: inactiveUsers,
      byRole: usersByRole,
    };
  }

  /**
   * Export data to CSV format
   */
  async exportData(type, filters = {}) {
    let data = [];
    let headers = [];

    switch(type) {
      case 'registrations':
        const registrations = await Registration.find(filters)
          .populate('applicantId', 'fullName email phone')
          .lean();
        
        headers = ['ID', 'Plate Number', 'VIN', 'Make', 'Model', 'Year', 'Owner', 'Email', 'Phone', 'Status', 'Fee', 'Created At', 'Expires At'];
        data = registrations.map(r => ({
          ID: r._id,
          'Plate Number': r.plateNumber || 'Not issued',
          VIN: r.vehicle.vin,
          Make: r.vehicle.make,
          Model: r.vehicle.model,
          Year: r.vehicle.year,
          Owner: r.owner.fullName,
          Email: r.owner.email || r.applicantId?.email,
          Phone: r.owner.phone,
          Status: r.status,
          Fee: r.feeAmount,
          'Created At': r.createdAt,
          'Expires At': r.expiresAt || 'N/A'
        }));
        break;

      case 'users':
        const users = await User.find(filters).lean();
        headers = ['ID', 'Name', 'Email', 'Phone', 'Role', 'Status', 'Created At'];
        data = users.map(u => ({
          ID: u._id,
          Name: u.fullName,
          Email: u.email,
          Phone: u.phone,
          Role: u.role,
          Status: u.isActive ? 'Active' : 'Inactive',
          'Created At': u.createdAt
        }));
        break;

      case 'revenue':
        const payments = await Registration.find({ paymentVerified: true, ...filters })
          .populate('applicantId', 'fullName email')
          .lean();
        
        headers = ['ID', 'Plate Number', 'Owner', 'Amount', 'Reference', 'Paid At', 'Status'];
        data = payments.map(p => ({
          ID: p._id,
          'Plate Number': p.plateNumber || 'Not issued',
          Owner: p.owner.fullName,
          Amount: p.feeAmount,
          Reference: p.paymentReference,
          'Paid At': p.createdAt,
          Status: 'Completed'
        }));
        break;
    }

    return { headers, data };
  }

  /**
   * Get system health status
   */
  async getSystemHealth() {
    const dbState = mongoose.connection.readyState;
    const dbStatus = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    }[dbState];

    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentErrors = await ActivityLogger.getAllActivities({
      collection: 'ErrorLog',
      startDate: last24Hours,
      limit: 100
    });

    return {
      database: {
        status: dbStatus,
        isConnected: dbState === 1,
      },
      server: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        nodeVersion: process.version,
      },
      errors: {
        last24Hours: recentErrors.total || 0,
        unresolved: await require('../models/errorLogModel').countDocuments({ resolved: false }),
      },
      timestamp: new Date(),
    };
  }
}

module.exports = new AdminDashboardService();