import { Request, Response } from 'express';
import {
  getLinkById,
  createLinkId,
  createNewLink,
  updateLinkVisits,
  getLinksByUserId,
  getLinksByUserIdForOwnAccount,
  deleteLinkById,
} from '../models/LinkModel';
import { getUserById } from '../models/UserModel';
import { parseDatabaseError } from '../utils/db-utils';

async function shortenUrl(req: Request, res: Response): Promise<void> {
  if (!req.session.loggedIn) {
    res.redirect('/login');
    return;
  }

  // Get the userId from `req.session`
  const { authenticatedUser } = req.session;

  const user = await getUserById(authenticatedUser.userId);
  if (!user) {
    res.sendStatus(404);
    return;
  }

  if ((!user.isPro || !user.isAdmin) && user.links.length >= 5) {
    res.sendStatus(403);
    return;
  }

  const { originalUrl } = req.body as NewLinkRequest;

  const linkId = createLinkId(originalUrl, user.userId);

  try {
    const newLink = await createNewLink(originalUrl, linkId, user);
    newLink.user.passwordHash = undefined;
    res.status(201).json(newLink);
  } catch (err) {
    console.error(err);
    const databaseErrorMessage = parseDatabaseError(err);
    res.status(500).json(databaseErrorMessage);
  }
}

async function getOriginalUrl(req: Request, res: Response): Promise<void> {
  // Retrieve the link data using the targetLinkId from the path parameter
  const { targetLinkId } = req.params;

  let link = await getLinkById(targetLinkId);

  // Check if you got back `null`
  // send the appropriate response
  if (!link) {
    res.sendStatus(404);
    return;
  }

  // Call the appropriate function to increment the number of hits and the last accessed date
  link = await updateLinkVisits(link);

  // Redirect the client to the original URL
  res.redirect(301, link.originalUrl);
}

async function getLinkData(req: Request, res: Response): Promise<void> {
  const { targetedUserId } = req.params;
  const user = await getUserById(targetedUserId);

  if (!user) {
    res.sendStatus(404);
    return;
  }

  const { userId, isAdmin } = req.session.authenticatedUser;

  let links;
  if (targetedUserId === userId || isAdmin) {
    links = await getLinksByUserIdForOwnAccount(userId);
  } else {
    links = await getLinksByUserId(userId);
  }

  res.json(links);
}

async function deleteLink(req: Request, res: Response): Promise<void> {
  const { targetedUserId, targetLinkId } = req.params;
  const { loggedIn } = req.session;
  const { userId, isAdmin } = req.session.authenticatedUser;

  if (!loggedIn) {
    res.redirect('/login');
    return;
  }

  if (userId !== targetedUserId && !isAdmin) {
    res.sendStatus(403);
    return;
  }

  const link = await getLinkById(targetLinkId);

  if (!link) {
    res.sendStatus(404);
    return;
  }

  await deleteLinkById(targetLinkId);

  res.sendStatus(200);
}

export { shortenUrl, getOriginalUrl, getLinkData, deleteLink };
