import { Input } from '@nextui-org/input';
import { FiSearch } from 'react-icons/fi';
import NewsCard from './NewsCard';
import RecommendCard from './RecommendCard';

export default function SideColumn() {

  return (
    <>
      <Input
        type="text"
        aria-label="Search"
        placeholder="Search"
        labelPlacement="outside"
        size="lg"
        radius="full"
        startContent={<FiSearch size="1.25em"/>}
        classNames={{
          base: "text-real-dark-6",
          inputWrapper: "bg-real-dark-search/50 min-h-10 h-10",
          input: "placeholder:text-real-dark-6 pl-3"
        }}
      />
      <NewsCard/>
      <RecommendCard/>
    </>
  );
}
