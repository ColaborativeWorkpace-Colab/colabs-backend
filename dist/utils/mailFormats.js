"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rejectJobApplicationFormat = exports.acceptJobApplicationFormat = exports.forgotPasswordFormat = exports.verifyEmailFormat = void 0;
function verifyEmailFormat(link) {
    return `
   <p>Click the link below to Verify your COLABS account</p>
   <a href="${link}">
        Verify Me
   </a>
`;
}
exports.verifyEmailFormat = verifyEmailFormat;
function forgotPasswordFormat(link) {
    return `
   <p>Click the link below to reset your COLABS account password</p>
   <a href="${link}">
        Reset Password
   </a>
`;
}
exports.forgotPasswordFormat = forgotPasswordFormat;
function acceptJobApplicationFormat(title, link) {
    return `
          <p>Your jobApplication for ${title} has been approved!.</p>
          <a href="${link}">
               Take me to job
          </a>
     `;
}
exports.acceptJobApplicationFormat = acceptJobApplicationFormat;
function rejectJobApplicationFormat(title, link) {
    return `
             <p>The employer noted that you are not the right fit for the job:  ${title}</p>
             <a href="${link}">
               Take me to job
          </a>
        `;
}
exports.rejectJobApplicationFormat = rejectJobApplicationFormat;
//# sourceMappingURL=mailFormats.js.map