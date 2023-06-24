export function verifyEmailFormat(link: string): string {
  return `
  <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #f2f2f2;
          }

          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            padding: 40px;
            border-radius: 5px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }

          h1 {
            color: #333333;
            font-size: 24px;
            margin: 0;
            text-align: center;
            margin-bottom: 20px;
          }

          p {
            color: #555555;
            font-size: 16px;
            line-height: 1.5;
            margin-bottom: 10px;
          }

          a {
            display: inline-block;
            padding: 12px 20px;
            background-color: #4CAF50;
            color: #ffffff;
            font-size: 16px;
            text-decoration: none;
            border-radius: 4px;
            transition: background-color 0.3s;
          }

          a:hover {
            background-color: #45a049;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Verify Your COLABS Account</h1>
          <p>Dear User,</p>
          <p>Thank you for signing up for Colabs. To complete your registration, verify your email address by clicking on the "Verify Me" link below:</p>
          <a href="${link}">Verify Me</a>
          <p>Please note that this link is valid for a limited time period. If you encounter any issues or have any questions, please contact our support team.</p>
          <p>Thank you for choosing Colabs!</p>
          <p>Best regards,</p>
          <p>The Colabs Team</p>
        </div>
      </body>
    </html>
`;
}

export function forgotPasswordFormat(link: string): string {
  return `
  <html>
  <head>
    <style>
      body {
        font-family: Arial, sans-serif;
        background-color: #f2f2f2;
      }

      .container {
        max-width: 600px;
        margin: 0 auto;
        background-color: #ffffff;
        padding: 40px;
        border-radius: 5px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      h1 {
        color: #333333;
        font-size: 24px;
        margin: 0;
        text-align: center;
        margin-bottom: 20px;
      }

      p {
        color: #555555;
        font-size: 16px;
        line-height: 1.5;
        margin-bottom: 10px;
      }

      a {
        display: inline-block;
        padding: 12px 20px;
        background-color: #4CAF50;
        color: #ffffff;
        font-size: 16px;
        text-decoration: none;
        border-radius: 4px;
        transition: background-color 0.3s;
      }

      a:hover {
        background-color: #45a049;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>Reset Your Colabs Account Password</h1>
      <p>Dear User,</p>
      <p>Click the link below to reset your Colabs account password:</p>
      <a href="${link}">Reset Password</a>
      <p>If you did not request a password reset, please ignore this email.</p>
      <p>Thank you!</p>
      <p>Best regards,</p>
      <p>The Colabs Team</p>
    </div>
  </body>
</html>
`;
}

// todo add other email format to handle other email types
export function acceptJobApplicationFormat(title: any, link: string): string {
  return `
  <html>
  <head>
    <style>
      body {
        font-family: Arial, sans-serif;
        background-color: #f2f2f2;
      }

      .container {
        max-width: 600px;
        margin: 0 auto;
        background-color: #ffffff;
        padding: 40px;
        border-radius: 5px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      h1 {
        color: #333333;
        font-size: 24px;
        margin: 0;
        text-align: center;
        margin-bottom: 20px;
      }

      p {
        color: #555555;
        font-size: 16px;
        line-height: 1.5;
        margin-bottom: 10px;
      }

      a {
        display: inline-block;
        padding: 12px 20px;
        background-color: #4CAF50;
        color: #ffffff;
        font-size: 16px;
        text-decoration: none;
        border-radius: 4px;
        transition: background-color 0.3s;
      }

      a:hover {
        background-color: #45a049;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>Job Application Approved!</h1>
      <p>Dear Applicant,</p>
      <p>Your job application for "${title}" has been approved!</p>
      <a href="${link}">Take me to the job</a>
      <p>We congratulate you on this achievement and look forward to working with you. If you have any questions or need further assistance, please don't hesitate to contact us.</p>
      <p>Best regards,</p>
      <p>The Colabs Team</p>
    </div>
  </body>
</html>
     `;
}

export function rejectJobApplicationFormat(title: any, link: string): string {
  return `<html>
  <head>
    <style>
      body {
        font-family: Arial, sans-serif;
        background-color: #f2f2f2;
      }

      .container {
        max-width: 600px;
        margin: 0 auto;
        background-color: #ffffff;
        padding: 40px;
        border-radius: 5px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      h1 {
        color: #333333;
        font-size: 24px;
        margin: 0;
        text-align: center;
        margin-bottom: 20px;
      }

      p {
        color: #555555;
        font-size: 16px;
        line-height: 1.5;
        margin-bottom: 10px;
      }

      a {
        display: inline-block;
        padding: 12px 20px;
        background-color: #4CAF50;
        color: #ffffff;
        font-size: 16px;
        text-decoration: none;
        border-radius: 4px;
        transition: background-color 0.3s;
      }

      a:hover {
        background-color: #45a049;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>Job Application Rejected</h1>
      <p>Dear Applicant,</p>
      <p>We regret to inform you that your job application for "${title}" has been rejected.</p>
      <p>The employer noted that you are not the right fit for this job.</p>
      <a href="${link}">Take me to other job opportunities</a>
      <p>We appreciate your interest in our organization and encourage you to explore other job openings on our platform. If you have any questions or need further assistance, please don't hesitate to contact us.</p>
      <p>Best regards,</p>
      <p>The Colabs Team</p>
    </div>
  </body>
</html>
        `;
}
