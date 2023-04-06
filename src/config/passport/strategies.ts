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
import { Employer, Freelancer } from '../../models';
import { Request } from '../../types';

const googleStategey = new GoogleStrategy(
  {
    clientID: googleClientId,
    clientSecret: googleClientSecret,
    callbackURL: googleCallbackUrl,
    scope: ['profile', 'email'],
    passReqToCallback: true,
  },
  async (req: Request, _accessToken: string, _refreshToken: string, profile: Profile, done: VerifyCallback) => {
    const { type } = JSON.parse(req.query.state as string);
    let newUser = {};
    if (type === 'freelancer') newUser = await Freelancer.createWithGoogle(profile);
    if (type === 'employer') newUser = await Employer.createWithGoogle(profile);
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
    passReqToCallback: true,
  },
  async (
    req: Request,
    _accessToken: string,
    _refreshToken: string,
    profile: GithubProfile & { emails: { value: string; type: string }[] },
    done: VerifyCallback,
  ) => {
    const { type } = JSON.parse(req.query.state as string);
    let newUser = {};
    if (type === 'freelancer') newUser = await Freelancer.createWithGithub(profile);
    if (type === 'employer') newUser = await Employer.createWithGithub(profile);
    if (newUser) {
      return done(null, newUser);
    } else {
      return done(null, false);
    }
  },
);

export { googleStategey, githubStategey };
