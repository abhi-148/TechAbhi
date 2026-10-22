import bcrypt from 'bcryptjs';
// Always run a bcrypt compare, even when the account does not exist, so response time
// does not reveal which emails are registered.
const DUMMY_HASH = bcrypt.hashSync('timing-equaliser-not-a-real-password', 12);
export async function checkPassword(password, hash) {
  const ok = await bcrypt.compare(String(password || ''), hash || DUMMY_HASH);
  return !!hash && ok;
}
