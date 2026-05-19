const cron = require('node-cron');
const { Registration } = require('../models/registrationModel');
const { User } = require('../models/userModel');
const { ActivityLogger } = require('./activityLogService');
const nodemailer = require('nodemailer');

class ExpiryNotificationService {
  constructor() {
    this.transporter = null;
    this.initEmailTransporter();
  }

  /**
   * Initialize email transporter
   */
  initEmailTransporter() {
    if (process.env.SMTP_HOST) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      });
    }
  }

  /**
   * Check for expiring registrations and send notifications
   */
  async checkExpiringRegistrations() {
    const today = new Date();
    const warningDays = [30, 14, 7, 3, 1]; // Send warnings at these intervals
    
    const results = {
      checked: 0,
      notificationsSent: 0,
      errors: []
    };

    for (const days of warningDays) {
      const expiryDate = new Date();
      expiryDate.setDate(today.getDate() + days);
      
      // Set to start and end of day
      const startOfDay = new Date(expiryDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(expiryDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      // Find registrations expiring in exactly `days` days
      const expiringRegistrations = await Registration.find({
        status: 'approved',
        expiresAt: {
          $gte: startOfDay,
          $lte: endOfDay
        },
        [`notificationSent.days_${days}`]: { $exists: false } // Don't send duplicate notifications
      }).populate('applicantId', 'fullName email phone');
      
      results.checked += expiringRegistrations.length;
      
      for (const registration of expiringRegistrations) {
        try {
          await this.sendExpiryWarning(registration, days);
          
          // Track that notification was sent
          if (!registration.notificationSent) {
            registration.notificationSent = new Map();
          }
          registration.notificationSent.set(`days_${days}`, {
            sentAt: new Date(),
            daysBefore: days
          });
          await registration.save();
          
          results.notificationsSent++;
          
          // Log activity
          await ActivityLogger.log(
            registration,
            'expiry_warning_sent',
            registration.applicantId._id,
            `Expiry warning sent: Registration expires in ${days} days`,
            registration.status,
            registration.status,
            {
              additionalData: { daysBefore: days, expiryDate: registration.expiresAt }
            }
          );
        } catch (error) {
          results.errors.push({
            registrationId: registration._id,
            error: error.message
          });
          console.error(`Failed to send expiry warning for ${registration._id}:`, error);
        }
      }
    }
    
    return results;
  }

  /**
   * Send expiry warning email
   */
  async sendExpiryWarning(registration, daysBefore) {
    const user = registration.applicantId;
    const expiryDate = new Date(registration.expiresAt).toLocaleDateString();
    const vehicleInfo = `${registration.vehicle.make} ${registration.vehicle.model} (${registration.vehicle.color})`;
    
    // Email content
    const emailSubject = `Vehicle Registration Expiry Warning - ${daysBefore} Days Remaining`;
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Vehicle Registration Expiry Warning</h2>
        <p>Dear ${user.fullName},</p>
        <p>This is to notify you that your vehicle registration for <strong>${vehicleInfo}</strong> will expire in <strong style="color: #e74c3c;">${daysBefore} days</strong>.</p>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Registration Details:</h3>
          <p><strong>Plate Number:</strong> ${registration.plateNumber}</p>
          <p><strong>Expiry Date:</strong> ${expiryDate}</p>
          <p><strong>Vehicle:</strong> ${vehicleInfo}</p>
          <p><strong>VIN:</strong> ${registration.vehicle.vin}</p>
        </div>
        
        <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
          <p style="margin: 0;"><strong>⚠️ Important:</strong> Please renew your registration before the expiry date to avoid penalties and maintain legal compliance.</p>
        </div>
        
        <div style="margin: 20px 0;">
          <a href="${process.env.APP_URL || 'http://localhost:3000'}/renew/${registration._id}" 
             style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Renew Now
          </a>
        </div>
        
        <p>If you have already renewed, please ignore this message.</p>
        <p>Thank you,<br>Vehicle Registration Authority</p>
      </div>
    `;
    
    const emailText = `
      Vehicle Registration Expiry Warning - ${daysBefore} Days Remaining
      
      Dear ${user.fullName},
      
      Your vehicle registration for ${vehicleInfo} will expire in ${daysBefore} days.
      
      Registration Details:
      - Plate Number: ${registration.plateNumber}
      - Expiry Date: ${expiryDate}
      - Vehicle: ${vehicleInfo}
      - VIN: ${registration.vehicle.vin}
      
      IMPORTANT: Please renew your registration before the expiry date to avoid penalties.
      
      Renew here: ${process.env.APP_URL || 'http://localhost:3000'}/renew/${registration._id}
      
      Thank you,
      Vehicle Registration Authority
    `;
    
    // Send email if configured
    if (this.transporter && user.email) {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@vehicle-registration.com',
        to: user.email,
        subject: emailSubject,
        text: emailText,
        html: emailHtml
      });
    }
    
    console.log(`Expiry warning sent for ${registration.plateNumber} (${daysBefore} days remaining) to ${user.email}`);
  }

  /**
   * Check for already expired registrations
   */
  async checkExpiredRegistrations() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const expiredRegistrations = await Registration.find({
      status: 'approved',
      expiresAt: { $lt: today },
      expiryNotified: { $ne: true }
    }).populate('applicantId', 'fullName email phone');
    
    const results = {
      expired: expiredRegistrations.length,
      notificationsSent: 0
    };
    
    for (const registration of expiredRegistrations) {
      try {
        await this.sendExpiredNotification(registration);
        registration.expiryNotified = true;
        await registration.save();
        
        results.notificationsSent++;
      } catch (error) {
        console.error(`Failed to send expiry notification for ${registration._id}:`, error);
      }
    }
    
    return results;
  }

  /**
   * Send notification for already expired registrations
   */
  async sendExpiredNotification(registration) {
    const user = registration.applicantId;
    const expiryDate = new Date(registration.expiresAt).toLocaleDateString();
    const daysOverdue = Math.floor((Date.now() - new Date(registration.expiresAt)) / (1000 * 60 * 60 * 24));
    const vehicleInfo = `${registration.vehicle.make} ${registration.vehicle.model}`;
    
    const emailSubject = `URGENT: Vehicle Registration Has Expired`;
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc3545;">⚠️ URGENT: Registration Expired</h2>
        <p>Dear ${user.fullName},</p>
        <p>Your vehicle registration for <strong>${vehicleInfo}</strong> has <strong style="color: #dc3545;">EXPIRED</strong>.</p>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Plate Number:</strong> ${registration.plateNumber}</p>
          <p><strong>Expired Since:</strong> ${expiryDate} (${daysOverdue} days overdue)</p>
        </div>
        
        <div style="background-color: #f8d7da; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #dc3545;">
          <p style="margin: 0;"><strong>⚠️ Legal Notice:</strong> Driving with an expired registration is illegal and may result in fines or penalties.</p>
        </div>
        
        <div style="margin: 20px 0;">
          <a href="${process.env.APP_URL || 'http://localhost:3000'}/renew/${registration._id}" 
             style="background-color: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Renew Immediately
          </a>
        </div>
        
        <p>Please renew your registration as soon as possible to avoid legal consequences.</p>
        <p>Thank you,<br>Vehicle Registration Authority</p>
      </div>
    `;
    
    if (this.transporter && user.email) {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@vehicle-registration.com',
        to: user.email,
        subject: emailSubject,
        html: emailHtml
      });
    }
    
    console.log(`Expired notification sent for ${registration.plateNumber}`);
  }

  /**
   * Get expiry statistics
   */
  async getExpiryStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const next7Days = new Date(today);
    next7Days.setDate(today.getDate() + 7);
    
    const next30Days = new Date(today);
    next30Days.setDate(today.getDate() + 30);
    
    const stats = {
      totalActive: await Registration.countDocuments({ status: 'approved' }),
      expiringIn7Days: await Registration.countDocuments({
        status: 'approved',
        expiresAt: {
          $gte: today,
          $lte: next7Days
        }
      }),
      expiringIn30Days: await Registration.countDocuments({
        status: 'approved',
        expiresAt: {
          $gte: today,
          $lte: next30Days
        }
      }),
      alreadyExpired: await Registration.countDocuments({
        status: 'approved',
        expiresAt: { $lt: today }
      })
    };
    
    return stats;
  }

  /**
   * Start the cron jobs
   */
  startCronJobs() {
    // Run daily at 9:00 AM
    cron.schedule('0 9 * * *', async () => {
      console.log('Running expiry check cron job...', new Date().toISOString());
      try {
        const results = await this.checkExpiringRegistrations();
        console.log(`Sent ${results.notificationsSent} expiry warnings`);
        
        const expiredResults = await this.checkExpiredRegistrations();
        console.log(`Found ${expiredResults.expired} expired registrations, sent ${expiredResults.notificationsSent} notifications`);
        
        if (results.errors.length > 0) {
          console.error('Errors during expiry check:', results.errors);
        }
      } catch (error) {
        console.error('Expiry check cron job failed:', error);
      }
    });
    
    // Run weekly on Monday at 10:00 AM for summary report
    cron.schedule('0 10 * * 1', async () => {
      console.log('Running weekly expiry summary...');
      try {
        const stats = await this.getExpiryStats();
        await this.sendAdminSummaryReport(stats);
      } catch (error) {
        console.error('Weekly summary failed:', error);
      }
    });
    
    console.log('Expiry notification cron jobs started');
    console.log('- Daily expiry check: 9:00 AM');
    console.log('- Weekly admin report: Monday 10:00 AM');
  }

  /**
   * Send weekly summary report to admin
   */
  async sendAdminSummaryReport(stats) {
    if (!this.transporter) return;
    
    const admins = await User.find({ role: 'admin' }).select('email');
    
    const emailHtml = `
      <h2>Weekly Registration Expiry Report</h2>
      <p>Report generated on: ${new Date().toLocaleDateString()}</p>
      <ul>
        <li>Total Active Registrations: <strong>${stats.totalActive}</strong></li>
        <li>Expiring in 7 days: <strong style="color: #e74c3c;">${stats.expiringIn7Days}</strong></li>
        <li>Expiring in 30 days: <strong style="color: #f39c12;">${stats.expiringIn30Days}</strong></li>
        <li>Already Expired: <strong style="color: #dc3545;">${stats.alreadyExpired}</strong></li>
      </ul>
      <p>Please review the expiring registrations and follow up as needed.</p>
    `;
    
    for (const admin of admins) {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@vehicle-registration.com',
        to: admin.email,
        subject: 'Weekly Registration Expiry Report',
        html: emailHtml
      });
    }
  }
}

module.exports = new ExpiryNotificationService();