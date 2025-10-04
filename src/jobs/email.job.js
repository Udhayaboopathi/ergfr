'use strict';

const { EmailJob, Session, Quiz, User, Question, Answer } = require('../models');
const logger = require('../utils/logger');
const sendgrid = require('@sendgrid/mail');
const nodemailer = require('nodemailer');

// Set up SendGrid if API key is provided
if (process.env.SENDGRID_API_KEY) {
  sendgrid.setApiKey(process.env.SENDGRID_API_KEY);
}

// Create SMTP transporter if credentials are provided
let smtpTransport;
if (process.env.SMTP_HOST) {
  smtpTransport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

/**
 * Send email using available transport (SendGrid or SMTP)
 * @param {Object} emailData - Email data
 * @returns {Promise<boolean>} Success status
 */
const sendEmail = async (emailData) => {
  try {
    // Try SendGrid first if available
    if (process.env.SENDGRID_API_KEY) {
      await sendgrid.send(emailData);
      return true;
    } 
    
    // Fall back to SMTP if available
    else if (smtpTransport) {
      await smtpTransport.sendMail({
        from: emailData.from,
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text
      });
      return true;
    } 
    
    // No email transport available
    else {
      logger.warn('No email transport configured (SendGrid or SMTP)');
      return false;
    }
  } catch (error) {
    logger.error('Failed to send email:', error);
    return false;
  }
};

/**
 * Define and register email jobs with Agenda
 * @param {Agenda} agenda - Agenda instance
 */
module.exports = function(agenda) {
  // Process email job queue
  agenda.define('send result email', async (job) => {
    try {
      const { emailJobId } = job.attrs.data;
      
      // Find email job
      const emailJob = await EmailJob.findById(emailJobId);
      if (!emailJob) {
        throw new Error(`Email job ${emailJobId} not found`);
      }

      // Skip if already sent or too many attempts
      if (emailJob.status === 'sent' || emailJob.attempts >= 5) {
        return;
      }

      // Get related data
      const [session, quiz] = await Promise.all([
        Session.findById(emailJob.sessionId).populate('userId'),
        Quiz.findById(emailJob.quizId)
      ]);

      if (!session || !quiz || !session.userId) {
        throw new Error('Required data not found');
      }

      // Get answers and questions
      const answers = await Answer.find({ sessionId: session._id });
      const questionIds = answers.map(a => a.questionId);
      const questions = await Question.find({ _id: { $in: questionIds } });

      // Generate email content
      const emailContent = await generateResultEmail(session, quiz, answers, questions);

      // Send email
      const user = session.userId;
      const success = await sendEmail({
        to: user.email,
        from: process.env.EMAIL_FROM || 'noreply@quizapp.com',
        subject: `Your Results: ${quiz.title}`,
        html: emailContent.html,
        text: emailContent.text
      });

      // Update job status
      emailJob.attempts += 1;
      emailJob.lastTriedAt = new Date();
      emailJob.status = success ? 'sent' : 'failed';
      if (!success) {
        emailJob.error = 'Failed to send email';
      }
      await emailJob.save();
    } catch (error) {
      logger.error('Error processing email job:', error);
      
      // Update job status if possible
      try {
        const { emailJobId } = job.attrs.data;
        if (emailJobId) {
          const emailJob = await EmailJob.findById(emailJobId);
          if (emailJob) {
            emailJob.attempts += 1;
            emailJob.lastTriedAt = new Date();
            emailJob.status = 'failed';
            emailJob.error = error.message;
            await emailJob.save();
          }
        }
      } catch (updateError) {
        logger.error('Error updating email job status:', updateError);
      }
    }
  });
};

/**
 * Generate HTML and text content for result email
 * @param {Object} session - Session document with user
 * @param {Object} quiz - Quiz document
 * @param {Array} answers - Array of answer documents
 * @param {Array} questions - Array of question documents
 * @returns {Object} HTML and text email content
 */
const generateResultEmail = async (session, quiz, answers, questions) => {
  const user = session.userId;
  const questionsMap = new Map(questions.map(q => [q._id.toString(), q]));
  
  // Get the total number of questions
  const totalQuestions = session.questionOrder.length;
  
  // Count correct answers
  const correctAnswers = answers.filter(a => a.isCorrect).length;
  
  // Create HTML version
  let html = `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #4a4a4a;">Quiz Results: ${quiz.title}</h2>
          <p>Hello ${user.name},</p>
          <p>Thank you for participating in our quiz. Here are your results:</p>
          
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
            <p><strong>Name:</strong> ${user.name}</p>
            <p><strong>Team:</strong> ${user.teamName}</p>
            <p><strong>Score:</strong> ${session.score} points</p>
            <p><strong>Correct Answers:</strong> ${correctAnswers} out of ${totalQuestions}</p>
            <p><strong>Total Time:</strong> ${Math.round(session.totalTimeMs / 1000)} seconds</p>
          </div>
          
          <h3 style="color: #4a4a4a; border-bottom: 1px solid #eee; padding-bottom: 10px;">Question Details</h3>
  `;
  
  // Add question details
  for (const answer of answers) {
    const question = questionsMap.get(answer.questionId.toString());
    if (!question) continue;
    
    // Find the selected option
    const selectedOption = question.options.find(
      o => o._id.toString() === answer.selectedOptionId.toString()
    );
    
    // Find the correct option
    const correctOption = question.options.find(
      o => o._id.toString() === question.correctOptionId.toString()
    );
    
    // Skip if missing data
    if (!selectedOption || !correctOption) continue;
    
    html += `
      <div style="margin-bottom: 20px; border-left: 3px solid ${answer.isCorrect ? '#4CAF50' : '#F44336'}; padding-left: 10px;">
        <p><strong>Q: ${question.text}</strong></p>
        <p>Your answer: ${selectedOption.text} ${answer.isCorrect ? '✓' : '✗'}</p>
        ${!answer.isCorrect ? `<p>Correct answer: ${correctOption.text}</p>` : ''}
        <p>Time taken: ${Math.round(answer.timeTakenMs / 1000)} seconds</p>
      </div>
    `;
  }
  
  html += `
          <p style="margin-top: 30px;">Thank you again for participating!</p>
        </div>
      </body>
    </html>
  `;
  
  // Create text version
  let text = `
    Quiz Results: ${quiz.title}
    
    Hello ${user.name},
    
    Thank you for participating in our quiz. Here are your results:
    
    Name: ${user.name}
    Team: ${user.teamName}
    Score: ${session.score} points
    Correct Answers: ${correctAnswers} out of ${totalQuestions}
    Total Time: ${Math.round(session.totalTimeMs / 1000)} seconds
    
    Question Details:
    ----------------
  `;
  
  for (const answer of answers) {
    const question = questionsMap.get(answer.questionId.toString());
    if (!question) continue;
    
    // Find the selected option
    const selectedOption = question.options.find(
      o => o._id.toString() === answer.selectedOptionId.toString()
    );
    
    // Find the correct option
    const correctOption = question.options.find(
      o => o._id.toString() === question.correctOptionId.toString()
    );
    
    // Skip if missing data
    if (!selectedOption || !correctOption) continue;
    
    text += `
    Q: ${question.text}
    Your answer: ${selectedOption.text} ${answer.isCorrect ? '(Correct)' : '(Incorrect)'}
    ${!answer.isCorrect ? `Correct answer: ${correctOption.text}` : ''}
    Time taken: ${Math.round(answer.timeTakenMs / 1000)} seconds
    
    `;
  }
  
  text += `
    Thank you again for participating!
  `;
  
  return { html, text };
};

module.exports.generateResultEmail = generateResultEmail;