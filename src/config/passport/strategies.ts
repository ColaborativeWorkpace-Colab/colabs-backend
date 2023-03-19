import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { googleClientId, googleCallbackUrl, googleClientSecret } from '..';
import { Profile, VerifyCallback } from 'passport-google-oauth20';
import { User } from '../../models';

const googleStategey = new GoogleStrategy(
  {
    clientID: googleClientId,
    clientSecret: googleClientSecret,
    callbackURL: googleCallbackUrl,
    scope: ['profile', 'email'],
  },
  async (_accessToken: string, _refreshToken: string, profile: Profile, done: VerifyCallback) => {
    const newUser = await User.createWithGoogle(profile);
    if (newUser) {
      return done(null, newUser);
    } else {
      return done(null, false);
    }
  },
);

export { googleStategey };
