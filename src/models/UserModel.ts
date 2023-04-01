import { AppDataSource } from '../dataSource';
import { User } from '../entities/User';

const userRepository = AppDataSource.getRepository(User);

async function getUserByUsername(username: string): Promise<User | null> {
  // TODO: Get the user by where the username matches the parameter
  // This should also retrieve the `links` relation
  const userData = await userRepository.findOne({
    where: { username },
    relations: ['links'],
  });
  return userData;
}

async function addNewUser(username: string, passwordHash: string): Promise<User | null> {
  // TODO: Add the new user to the database
  let newUser = new User();
  newUser.username = username;
  newUser.passwordHash = passwordHash;
  newUser = await userRepository.save(newUser);
  return newUser;
}

async function getUserById(userId: string): Promise<User | null> {
  const userData = await userRepository.findOne({
    where: { userId },
    relations: ['links'],
  });
  return userData;
}

async function updateUsername(userId: string, newUsername: string): Promise<void> {
  await userRepository
    .createQueryBuilder()
    .update(User)
    .set({ username: newUsername })
    .where({ userId })
    .execute();
}

async function getAllUser(): Promise<User[]> {
  return await userRepository.find();
}

export {
  getUserByUsername,
  addNewUser,
  getUserById,
  updateUsername,
  getAllUser,
};
