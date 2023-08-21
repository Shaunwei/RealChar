import { Button } from '@nextui-org/button';
import signIn from '@/firebase/auth/signin';

export default function SignIn() {
  return (
    <>
      <Button onClick={handleSignIn}>Sign in</Button>
    </>
  )
}