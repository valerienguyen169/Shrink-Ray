import 'express-session';

declare module 'express-session' {
  export interface Session {
    clearSession(): Promise<void>; // DO NOT MODIFY THIS!

    // NOTES: Add your app's custom session properties here:
    authenticatedUser: {
      userId: string;
      isPro: boolean;
      isAdmin: boolean;
      username: string;
    };
    loggedIn: boolean;
  }
}
