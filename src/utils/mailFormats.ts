export function verifyEmailFormat(link: string): string {
  return `
   <p>Click the link below to Verify your COLABS account</p>
   <a href="${link}">
        Verify Me
   </a>
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
