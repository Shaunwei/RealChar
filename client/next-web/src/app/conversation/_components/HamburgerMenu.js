import { Button } from '@nextui-org/button';
import { RxHamburgerMenu } from 'react-icons/rx';

export default function HamburgerMenu() {
  return (
    <Button
      variant="light"
      className="min-w-8"
    >        
      <RxHamburgerMenu size="1.75em"/>
    </Button>
  );
}