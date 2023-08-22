import { Button } from '@nextui-org/button';
import signIn from '@/firebase/auth/signin';

export default function SignIn() {
  async function handleSignIn() {
    const { result, error } = await signIn();
    if (error) {
      console.log(error);
      return;
    }
  }

  return <Button onClick={handleSignIn}>Sign in</Button>;
}
