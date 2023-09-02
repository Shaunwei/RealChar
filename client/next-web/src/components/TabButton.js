import { Button } from '@nextui-org/button';

export default function TabButton({
  isSelected,
  isDisabled=false,
  handlePress,
  children
}) {
  let styles;
  if (isSelected) {
    styles = "bg-tab";
  } else {
    styles = "bg-transparent";
  }
  return (
    <Button
      isBlock
      isDisabled={isDisabled}
      radius="full"
      className={`h-11 w-full font-medium text-lg justify-center py-4 text-foreground hover:opacity-80 ${styles}`}
      onPress={handlePress}
    >
      {children}
    </Button>
  );
}
