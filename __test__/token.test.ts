import generateToken from '../src/utils/generateToken';

describe('generateToken', () => {
  it('should generate a valid token', () => {
    const token = generateToken('1');
    expect(token).toBeDefined();
  });
});
