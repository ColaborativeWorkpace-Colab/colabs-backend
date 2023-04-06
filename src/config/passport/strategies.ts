import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import {
  googleClientId,
  googleCallbackUrl,
  googleClientSecret,
  githubCallbackUrl,
  githubClientId,
  githubClientSecret,
} from '..';
import { Profile, VerifyCallback } from 'passport-google-oauth20';
import { Strategy as GithubStrategy, Profile as GithubProfile } from 'passport-github2';
import { Freelancer, User } from '../../models';

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

const githubStategey = new GithubStrategy(
  {
    clientID: githubClientId,
    clientSecret: githubClientSecret,
    callbackURL: githubCallbackUrl,
  },
  async (
    _accessToken: string,
    _refreshToken: string,
    profile: GithubProfile & { emails: { value: string; type: string }[] },
    done: VerifyCallback,
  ) => {
    const newUser = await Freelancer.createWithGithub(profile);
    if (newUser) {
      return done(null, newUser);
    } else {
      return done(null, false);
    }
  },
);

export { googleStategey, githubStategey };
