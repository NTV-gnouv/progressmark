const nodemailer = require('nodemailer');
const config = require('../config');
const logger = require('./logger');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransporter({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.port === 465,
      auth: {
        user: config.email.user,
        pass: config.email.pass
      }
    });
  }

  /**
   * Send email
   */
  async sendEmail(to, subject, html, text) {
    try {
      const mailOptions = {
        from: config.email.from,
        to,
        subject,
        html,
        text
      };

      const result = await this.transporter.sendMail(mailOptions);
      logger.info('Email sent successfully', { to, subject, messageId: result.messageId });
      return result;
    } catch (error) {
      logger.error('Email sending failed:', error);
      throw error;
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email, resetToken) {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset Request</h2>
        <p>You requested a password reset for your ProgressMark account.</p>
        <p>Click the button below to reset your password:</p>
        <a href="${resetUrl}" style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Reset Password</a>
        <p>Or copy and paste this link: ${resetUrl}</p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this reset, please ignore this email.</p>
      </div>
    `;

    const text = `
      Password Reset Request
      
      You requested a password reset for your ProgressMark account.
      
      Click this link to reset your password: ${resetUrl}
      
      This link will expire in 1 hour.
      
      If you didn't request this reset, please ignore this email.
    `;

    return await this.sendEmail(email, 'Password Reset - ProgressMark', html, text);
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(email, name) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to ProgressMark!</h2>
        <p>Hi ${name},</p>
        <p>Welcome to ProgressMark! Your account has been created successfully.</p>
        <p>You can now start managing your projects and tasks with AI-powered evaluations.</p>
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" style="background-color: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Get Started</a>
        <p>If you have any questions, feel free to contact our support team.</p>
      </div>
    `;

    const text = `
      Welcome to ProgressMark!
      
      Hi ${name},
      
      Welcome to ProgressMark! Your account has been created successfully.
      
      You can now start managing your projects and tasks with AI-powered evaluations.
      
      Visit: ${process.env.FRONTEND_URL || 'http://localhost:3000'}
      
      If you have any questions, feel free to contact our support team.
    `;

    return await this.sendEmail(email, 'Welcome to ProgressMark!', html, text);
  }

  /**
   * Send group invitation email
   */
  async sendGroupInvitationEmail(email, groupName, inviterName, inviteToken) {
    const acceptUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/invite/accept?token=${inviteToken}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>You're invited to join ${groupName}</h2>
        <p>Hi there,</p>
        <p>${inviterName} has invited you to join the "${groupName}" group on ProgressMark.</p>
        <p>Click the button below to accept the invitation:</p>
        <a href="${acceptUrl}" style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Accept Invitation</a>
        <p>Or copy and paste this link: ${acceptUrl}</p>
        <p>This invitation will expire in 7 days.</p>
      </div>
    `;

    const text = `
      You're invited to join ${groupName}
      
      Hi there,
      
      ${inviterName} has invited you to join the "${groupName}" group on ProgressMark.
      
      Click this link to accept the invitation: ${acceptUrl}
      
      This invitation will expire in 7 days.
    `;

    return await this.sendEmail(email, `Invitation to join ${groupName}`, html, text);
  }
}

module.exports = new EmailService();
