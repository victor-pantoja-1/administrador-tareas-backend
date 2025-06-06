import * as bcrypt from 'bcryptjs';

export const hashPassword = async (password: string, salt: number): Promise<string> => {
  return await bcrypt.hash(password, salt);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  const compare = await bcrypt.compare(password, hash);
  return compare;
}