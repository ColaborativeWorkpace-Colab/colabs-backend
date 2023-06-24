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
   <p>Click the link below to reset your COLABS account password</p>
   <a href="${link}">
        Reset Password
   </a>
`;
}

// todo add other email format to handle other email types
export function acceptJobApplicationFormat(title: any, link: string): string {
  return `
          <p>Your jobApplication for ${title} has been approved!.</p>
          <a href="${link}">
               Take me to job
          </a>
     `;
}

export function rejectJobApplicationFormat(title: any, link: string): string {
  return `
             <p>The employer noted that you are not the right fit for the job:  ${title}</p>
             <a href="${link}">
               Take me to job
          </a>
        `;
}
