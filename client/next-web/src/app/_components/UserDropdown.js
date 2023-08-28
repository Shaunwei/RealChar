import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem 
} from '@nextui-org/dropdown';
import { Avatar } from '@nextui-org/avatar';
import signout from '@/firebase/auth/signout';

export default function UserDropdown({ user }) {
  async function handleMenuClick(key) {
    console.log(key);
    switch(key) {
      case 'profile':
        return;
      case 'create':
        return;
      case 'delete':
        return;
      case 'logout':
        const { result, error } = await signout();
        if (error) {
          console.log(error);
          return;
        }
        return;
      default:
        return;
    }
  }
  return (
    <Dropdown placement="bottom-end">
      <DropdownTrigger aria-label="Dropdown trigger">
        <Avatar
          as="button"
          name={user.displayName}
          src={user.photoURL}
        />
      </DropdownTrigger>
      <DropdownMenu
        aria-label="Profile Actions" 
        variant="flat"
        onAction={handleMenuClick}>
        <DropdownItem key="profile" className="h-14 gap-2">
          <p className="">Signed in as</p>
          <p className="">{user.email}</p>
        </DropdownItem>
        <DropdownItem key="create">Create a character</DropdownItem>
        <DropdownItem key="delete">Delete a character</DropdownItem>
        <DropdownItem key="logout" color="danger">Log Out</DropdownItem>
      </DropdownMenu>
    </Dropdown>
  );
}
