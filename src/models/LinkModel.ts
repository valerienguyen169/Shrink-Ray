import { createHash } from 'crypto';
import { AppDataSource } from '../dataSource';
import { Link } from '../entities/Link';
import { User } from '../entities/User';

const linkRepository = AppDataSource.getRepository(Link);

async function getLinkById(linkId: string): Promise<Link | null> {
  const linkData = await linkRepository.findOne({
    where: { linkId },
    relations: ['user'] });
  return linkData;
}

function createLinkId(originalUrl: string, userId: string): string {
  const md5 = createHash('md5');
  md5.update(originalUrl + userId);
  const urlHash = md5.digest('base64url');
  const linkId = urlHash.substring(0, 9);
  return linkId;
}

async function createNewLink(originalUrl: string, linkId: string, creator: User): Promise<Link> {
  let newLink = new Link();
  newLink.originalUrl = originalUrl;
  newLink.linkId = linkId;
  newLink.user = creator;
  newLink.lastAccessedOn = new Date();

  newLink = await linkRepository.save(newLink);

  return newLink;
}

async function updateLinkVisits(link: Link): Promise<Link> {
  // Increment the link's number of hits property
  const updatedLink = link;
  updatedLink.numHits += 1;

  // Create a new date object and assign it to the link's `lastAccessedOn` property.
  const now = new Date();
  updatedLink.lastAccessedOn = now;

  // Update the link's numHits and lastAccessedOn in the database
  await linkRepository
    .createQueryBuilder()
    .update(Link)
    .set({ numHits: updatedLink.numHits, lastAccessedOn: updatedLink.lastAccessedOn })
    .where({ linkId: updatedLink.linkId })
    .execute();

  // return the updated link
  return updatedLink;
}

async function getLinksByUserId(userId: string): Promise<Link[]> {
  const links = await linkRepository
    .createQueryBuilder('link')
    .where({ user: { userId } }) // NOTES: This is how you do nested WHERE clauses
    .leftJoin('link.user', 'user')
    .select(['link.linkId', 'link.originalUrl', 'user.userId', 'user.username', 'user.isAdmin'])
    .getMany();

  return links;
}

async function getLinksByUserIdForOwnAccount(userId: string): Promise<Link[]> {
  const links = await linkRepository
    .createQueryBuilder('link')
    .where({ user: { userId } })
    .leftJoin('link.user', 'user')
    .select([
      'user.userId',
      'user.username',
      'user.isPro',
      'user.isAdmin',
      'link.linkId',
      'link.originalUrl',
      'link.numHits',
      'link.lastAccessedOn',
    ])
    .getMany();

  return links;
}

async function deleteLinkById(linkId: string): Promise<void> {
  await linkRepository
    .createQueryBuilder('link')
    .delete()
    .where( { linkId } )
    .execute();
}

export {
  getLinkById,
  createLinkId,
  createNewLink,
  updateLinkVisits,
  getLinksByUserId,
  getLinksByUserIdForOwnAccount,
  deleteLinkById,
};
