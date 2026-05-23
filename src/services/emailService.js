const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initTransporter();
  }

  initTransporter() {
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
      console.log('📧 Email service initialized');
    } else {
      console.log('⚠️ Email service not configured. Emails will be logged to console.');
    }
  }

  /**
   * Generic email sender
   */
  async sendEmail(to, subject, html, text = null) {
    const emailContent = {
      from: process.env.SMTP_FROM || 'noreply@capstonevehicle-registration.com',
      to,
      subject,
      html,
    };
    
    if (text) emailContent.text = text;
    
    // If transporter is not configured, log the email
    if (!this.transporter) {
      console.log('📧 EMAIL WOULD BE SENT:');
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Content: ${html.substring(0, 500)}...`);
      return { success: true, mocked: true };
    }
    
    try {
      const info = await this.transporter.sendMail(emailContent);
      console.log(`✅ Email sent to ${to}: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Email sending failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send welcome email after user registration
   */
  async sendWelcomeEmail(user) {
    const subject = 'Welcome to Vehicle Registration System';
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #4CAF50; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">Welcome ${user.fullName}!</h1>
        </div>
        
        <div style="padding: 20px; background-color: #f9f9f9;">
          <p>Dear ${user.fullName},</p>
          
          <p>Thank you for registering with the <strong>Vehicle Registration System</strong>. Your account has been successfully created.</p>
          
          <div style="background-color: #e8f4f8; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #2c3e50;">Account Details:</h3>
            <p><strong>Name:</strong> ${user.fullName}</p>
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Role:</strong> ${user.role}</p>
            <p><strong>Phone:</strong> ${user.phone || 'Not provided'}</p>
          </div>
          
          <p>You can now:</p>
          <ul>
            <li>Register your vehicle(s)</li>
            <li>Track registration status</li>
            <li>Renew your vehicle registration</li>
            <li>Receive expiry notifications</li>
          </ul>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.APP_URL || 'http://localhost:3000'}/login" 
               style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Login to Your Account
            </a>
          </div>
          
          <hr style="margin: 20px 0;">
          
          <p style="color: #666; font-size: 12px;">If you did not create this account, please ignore this email or contact support.</p>
        </div>
        
        <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
          <p>&copy; 2024 Vehicle Registration System. All rights reserved.</p>
        </div>
      </div>
    `;
    
    return await this.sendEmail(user.email, subject, html);
  }

  /**
   * Send car registration confirmation email
   */
  async sendCarRegistrationConfirmation(registration, user) {
    const subject = `Vehicle Registration Confirmation - ${registration.plateNumber || 'Pending'}`;
    
    const vehicleInfo = `${registration.vehicle.make} ${registration.vehicle.model} (${registration.vehicle.year})`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #2196F3; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">Vehicle Registration Received</h1>
        </div>
        
        <div style="padding: 20px; background-color: #f9f9f9;">
          <p>Dear ${user.fullName},</p>
          
          <p>Your vehicle registration application has been successfully submitted and is now under review.</p>
          
          <div style="background-color: #e8f4f8; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #2c3e50;">Registration Details:</h3>
            <p><strong>Registration ID:</strong> ${registration._id}</p>
            <p><strong>Vehicle:</strong> ${vehicleInfo}</p>
            <p><strong>VIN:</strong> ${registration.vehicle.vin}</p>
            <p><strong>Color:</strong> ${registration.vehicle.color}</p>
            <p><strong>Engine Capacity:</strong> ${registration.vehicle.engineCapacity}cc</p>
            <p><strong>Status:</strong> <span style="color: #ff9800;">${registration.status.toUpperCase()}</span></p>
            <p><strong>Fee Amount:</strong> ₦${registration.feeAmount.toLocaleString()}</p>
          </div>
          
          <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <p style="margin: 0;"><strong>📋 Next Steps:</strong></p>
            <ol style="margin: 10px 0 0 20px;">
              <li>Your application will be reviewed by our staff</li>
              <li>You will receive email updates on the status</li>
              <li>Once approved, your plate number will be issued</li>
              <li>Make payment to complete the registration</li>
            </ol>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.APP_URL || 'http://localhost:3000'}/registrations/${registration._id}" 
               style="background-color: #2196F3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Track Registration Status
            </a>
          </div>
          
          <hr style="margin: 20px 0;">
          
          <p style="color: #666; font-size: 12px;">You will receive another email once your registration is approved or if additional information is needed.</p>
        </div>
        
        <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
          <p>&copy; 2024 Vehicle Registration System. All rights reserved.</p>
        </div>
      </div>
    `;
    
    return await this.sendEmail(user.email, subject, html);
  }

  /**
   * Send registration status update email
   */
  async sendRegistrationStatusUpdate(registration, user, status, notes = '') {
    let statusColor = '#ff9800';
    let statusTitle = 'Status Update';
    
    switch(status) {
      case 'approved':
        statusColor = '#4CAF50';
        statusTitle = '✅ Registration Approved!';
        break;
      case 'rejected':
        statusColor = '#dc3545';
        statusTitle = '❌ Registration Rejected';
        break;
      case 'under_review':
        statusColor = '#2196F3';
        statusTitle = '📋 Registration Under Review';
        break;
    }
    
    const subject = `Vehicle Registration ${status.toUpperCase()} - ${registration.plateNumber || registration._id}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: ${statusColor}; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">${statusTitle}</h1>
        </div>
        
        <div style="padding: 20px; background-color: #f9f9f9;">
          <p>Dear ${user.fullName},</p>
          
          <p>Your vehicle registration application has been <strong>${status.toUpperCase()}</strong>.</p>
          
          <div style="background-color: #e8f4f8; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Registration Details:</h3>
            <p><strong>Vehicle:</strong> ${registration.vehicle.make} ${registration.vehicle.model}</p>
            <p><strong>VIN:</strong> ${registration.vehicle.vin}</p>
            ${registration.plateNumber ? `<p><strong>Plate Number:</strong> ${registration.plateNumber}</p>` : ''}
            <p><strong>Status:</strong> <span style="color: ${statusColor}; font-weight: bold;">${status.toUpperCase()}</span></p>
          </div>
          
          ${notes ? `
            <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0;"><strong>📝 Notes:</strong> ${notes}</p>
            </div>
          ` : ''}
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.APP_URL || 'http://localhost:3000'}/registrations/${registration._id}" 
               style="background-color: ${statusColor}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              View Details
            </a>
          </div>
        </div>
        
        <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
          <p>&copy; 2024 Vehicle Registration System. All rights reserved.</p>
        </div>
      </div>
    `;
    
    return await this.sendEmail(user.email, subject, html);
  }

  /**
   * Send payment confirmation email
   */
  async sendPaymentConfirmation(registration, user, amount, reference) {
    const subject = `Payment Confirmation - Vehicle Registration`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #28a745; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">💰 Payment Confirmed!</h1>
        </div>
        
        <div style="padding: 20px; background-color: #f9f9f9;">
          <p>Dear ${user.fullName},</p>
          
          <p>Your payment has been successfully received and processed.</p>
          
          <div style="background-color: #e8f4f8; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Payment Details:</h3>
            <p><strong>Amount:</strong> ₦${amount.toLocaleString()}</p>
            <p><strong>Reference:</strong> ${reference}</p>
            <p><strong>Vehicle:</strong> ${registration.vehicle.make} ${registration.vehicle.model}</p>
            <p><strong>Plate Number:</strong> ${registration.plateNumber || 'Pending'}</p>
          </div>
          
          <p>Thank you for your payment!</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.APP_URL || 'http://localhost:3000'}/receipt/${reference}" 
               style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Download Receipt
            </a>
          </div>
        </div>
        
        <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
          <p>&copy; 2024 Vehicle Registration System. All rights reserved.</p>
        </div>
      </div>
    `;
    
    return await this.sendEmail(user.email, subject, html);
  }
}

module.exports = new EmailService();