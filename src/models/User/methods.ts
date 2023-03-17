import { IUserDocument, IUserModel } from 'src/types';
import generateToken from '../../utils/generateToken';
import bcrypt from 'bcryptjs';

const modelMethods = {
  /**
   *
   * @param this
   * @param enteredPassword
   * @returns bool
   */
  async matchPassword(this: IUserDocument, enteredPassword: string) {
    return await bcrypt.compare(enteredPassword, this.password);
  },

  /**
   *
   * @param this
   * @returns
   */
  async cleanUser(this: IUserDocument) {
    const user = this.toObject();
    delete user.password;
    delete user.__v;
    delete user.createdAt;
    delete user.updatedAt;

    return user;
  },
};

const staticMethods = {
  /**
   *
   * @param this
   * @param password
   * @param email
   * @returns
   */
  async authUser(this: IUserModel, password: string, email: string) {
    const user = await this.findOne({ email });
    if (user && (await user.matchPassword(password))) {
      const cleanUser = await user.cleanUser();
      return { ...cleanUser, token: generateToken(user._id) };
    } else {
      throw new Error('Invalid email or password');
    }
  },
};
export { modelMethods, staticMethods };
