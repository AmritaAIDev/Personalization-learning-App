/**
 * Single source of truth for password strength, shared by the register DTO
 * validation and the environment-seeded admin account so both paths enforce
 * the same policy.
 */
export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_MAX_LENGTH = 128;
export const PASSWORD_PATTERN = /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
export const PASSWORD_POLICY_MESSAGE =
  'Password must be at least 12 characters and include an uppercase letter, lowercase letter, and number.';

export function isPasswordValid(password: string): boolean {
  return (
    password.length >= PASSWORD_MIN_LENGTH &&
    password.length <= PASSWORD_MAX_LENGTH &&
    PASSWORD_PATTERN.test(password)
  );
}
