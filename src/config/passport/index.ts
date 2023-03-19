import { googleStategey } from './strategies';

const passportConfig = (passport: any) => {
  passport.use(googleStategey);
};

export default passportConfig;
