export function verifyEmailFormat(link: string): string {
  return `
   <p>Click the link below to Verify your COLABS account</p>
   <a href="${link}">
        Verify Me
   </a>
`;
}
