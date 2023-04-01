import { Request, Response } from 'express';
import argon2 from 'argon2';
import { addNewUser, getUserByUsername } from '../models/UserModel';
import { parseDatabaseError } from '../utils/db-utils';

async function registerUser(req: Request, res: Response): Promise<void> {
  // Implement the registration code
  const { username, password } = req.body as AuthRequest;
  const passwordHash = await argon2.hash(password);
  // Make sure to check if the user with the given username exists before attempting to add the account
  const user = await getUserByUsername(username);
  if (user) {
    res.sendStatus(409);
    return;
  }

  try {
    const newUser = await addNewUser(username, passwordHash);
    console.log(newUser);
    res.sendStatus(201);
  } catch (err) {
    console.error(err);
    const databaseErrorMessage = parseDatabaseError(err);
    res.status(500).json(databaseErrorMessage);
  }
}

async function logIn(req: Request, res: Response): Promise<void> {
  const { username, password } = req.body as AuthRequest;
  const user = await getUserByUsername(username);

  if (!user) {
    res.sendStatus(404);
    return;
  }

  const { passwordHash } = user;

  if (!(await argon2.verify(passwordHash, password))) {
    res.sendStatus(404);
    return;
  }

  // clear the session
  await req.session.clearSession();

  req.session.authenticatedUser = {
    userId: user.userId,
    isPro: user.isPro,
    isAdmin: user.isAdmin,
    username: user.username,
  };
  req.session.loggedIn = true;
  res.sendStatus(200);
}

export { registerUser, logIn };
