import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import User, { IUser } from '../models/User';

// JWT Strategy
const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET!,
};

passport.use(
  new JwtStrategy(jwtOptions, async (payload, done) => {
    try {
      const user = await User.findById(payload.id).select('-password');
      if (user) {
        return done(null, user);
      }
      return done(null, false);
    } catch (error) {
      return done(error, false);
    }
  })
);

// Google OAuth Strategy - uniquement si les clés sont configurées
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL!,
      },
      async (accessToken: string, refreshToken: string, profile: any, done: any) => {
      try {
        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
          // Vérifier si un utilisateur avec cet email existe déjà
          const existingUser = await User.findOne({ email: profile.emails?.[0].value });
          
          if (existingUser) {
            // Lier le compte Google à l'utilisateur existant
            existingUser.googleId = profile.id;
            existingUser.isVerified = true;
            if (!existingUser.avatar && profile.photos?.[0].value) {
              existingUser.avatar = profile.photos[0].value;
            }
            await existingUser.save();
            return done(null, existingUser);
          }

          // Créer un nouvel utilisateur
          user = await User.create({
            googleId: profile.id,
            email: profile.emails?.[0].value,
            username: profile.displayName?.replace(/\s+/g, '_').toLowerCase() + '_' + Date.now(),
            displayName: profile.displayName,
            avatar: profile.photos?.[0].value,
            isVerified: true,
          });
        }

        return done(null, user);
      } catch (error) {
        return done(error as Error, undefined);
      }
    }
  )
);
}

// GitHub OAuth Strategy - uniquement si les clés sont configurées
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: process.env.GITHUB_CALLBACK_URL!,
    },
    async (accessToken: string, refreshToken: string, profile: any, done: any) => {
      try {
        let user = await User.findOne({ githubId: profile.id });

        if (!user) {
          // Vérifier si un utilisateur avec cet email existe déjà
          const existingUser = await User.findOne({ email: profile.emails?.[0].value });

          if (existingUser) {
            // Lier le compte GitHub à l'utilisateur existant
            existingUser.githubId = profile.id;
            existingUser.isVerified = true;
            if (!existingUser.avatar && profile.photos?.[0].value) {
              existingUser.avatar = profile.photos[0].value;
            }
            await existingUser.save();
            return done(null, existingUser);
          }

          // Créer un nouvel utilisateur
          user = await User.create({
            githubId: profile.id,
            email: profile.emails?.[0].value,
            username: profile.username || profile.displayName?.replace(/\s+/g, '_').toLowerCase() + '_' + Date.now(),
            displayName: profile.displayName || profile.username,
            avatar: profile.photos?.[0].value,
            isVerified: true,
          });
        }

        return done(null, user);
      } catch (error) {
        return done(error as Error, undefined);
      }
    }
  )
);
}

// Serialization pour les sessions
passport.serializeUser((user: any, done: any) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done: any) => {
  try {
    const user = await User.findById(id).select('-password');
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;
