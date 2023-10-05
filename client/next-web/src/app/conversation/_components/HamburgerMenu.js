import {
  motion,
  useCycle,
  AnimatePresence
} from 'framer-motion';
import {
  Button,
  Select,
  SelectItem,
  SelectSection,
  Switch,
} from '@nextui-org/react';
import { RxHamburgerMenu, RxCross2 } from 'react-icons/rx';
import { BiSolidLockAlt } from 'react-icons/bi';
import styles from './HamburgerMenu.module.css';
import { useAppStore } from '@/lib/store';
import { useAuthContext } from '@/context/AuthContext';

export default function HamburgerMenu() {
  const [open, cycleOpen] = useCycle(false, true);
  const sideVariants = {
    closed: {
      opacity: 0,
      transition: {
        staggerChildren: 0.1,
        staggerDirection: -1,
      }
    },
    open: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        staggerDirection: 1,
      }
    }
  };
  const {
    models,
    selectedModel,
    handleModelChange,
    preferredLanguage,
    languageList,
    handleLanguageChange,
    enableGoogle,
    enableQuivr,
    handleGoogle,
    handleQuivr
  } = useAppStore();
  const { user } = useAuthContext();

  return (
    <>
    <AnimatePresence>
    {open && (
    <motion.aside
      className={styles.backdrop}
      initial={{ width: 0 }}
      animate={{ width: "100vw"}}
      exit={{
        width: 0,
        transition: {
          delay: 0.1,
          duration: 0.3
        }
      }}
    >
      <motion.div
        className={styles.menu}
        initial="closed"
        animate="open"
        exit="closed"
        variants={sideVariants}
      >
        <section className="p-6 pt-20">
          <header className="text-lg my-3">System settings</header>
          <section>
            <header className="text-sm font-light my-3">Large language model(LLM)</header>
            {user == null ? (
              <Select
                labelPlacement="outside"
                aria-label="model select"
                selectedKeys={selectedModel}
                disabledKeys={['locked', models[0].id]}
                onChange={handleModelChange}
                radius="sm"
                classNames={{
                  base: 'w-full',
                  trigger: 'bg-white/10 data-[hover=true]:bg-white/20',
                  value: 'font-light pl-4 text-base',
                  popover: 'bg-dropdown',
                }}
              >
                <SelectSection>
                  <SelectItem key={models[0].id} textValue={models[0].name}
                    classNames={{
                      base: 'data-[hover=true]:bg-default/40 data-[selectable=true]:focus:bg-default/40'
                    }}
                  >
                    <div className="font-light flex flex-col">
                      <span>{models[0].name}</span>
                      <span className="text-tiny whitespace-normal text-white/50">{models[0].tooltip}</span>
                    </div>
                  </SelectItem>
                </SelectSection>
                <SelectSection>
                  <SelectItem
                    key="locked"
                    classNames={{
                      selectedIcon: 'hidden'
                    }}
                  >
                    <span className="text-small flex flex-row items-center gap-1"><BiSolidLockAlt />Sign in needed</span>
                  </SelectItem>
                </SelectSection>
              </Select>
            ) : (
              <Select
                labelPlacement="outside"
                aria-label="model select"
                selectedKeys={selectedModel}
                onChange={handleModelChange}
                radius="sm"
                classNames={{
                  base: 'w-full',
                  trigger: 'bg-white/10 data-[hover=true]:bg-white/20',
                  value: 'font-light pl-4 text-base',
                  popover: 'bg-dropdown',
                }}
              >
                <SelectSection>
                {models.map((item) => (
                  <SelectItem key={item.id} textValue={item.name}
                    classNames={{
                      base: 'data-[hover=true]:bg-default/40 data-[selectable=true]:focus:bg-default/40 data-[selected=true]:pointer-events-none'
                    }}
                  >
                    <div className="font-light flex flex-col">
                      <span>{item.name}</span>
                      <span className="text-tiny whitespace-normal text-white/50">{item.tooltip}</span>
                    </div>
                  </SelectItem>
                ))}
                </SelectSection>
              </Select>
            )}

          </section>
          <section>
            <header className="text-sm font-light my-3">Preferred language</header>
            <Select
              labelPlacement="outside"
              aria-label="language select"
              selectedKeys={preferredLanguage}
              onChange={handleLanguageChange}
              radius="sm"
              classNames={{
                trigger: 'bg-white/10 data-[hover=true]:bg-white/20',
                value: 'font-light pl-4 text-base',
                popover: 'bg-dropdown',
              }}
            >
              <SelectSection>
            {languageList.map((item) => (
              <SelectItem key={item} textValue={item}
                classNames={{
                  base: 'data-[hover=true]:bg-default/40 data-[selectable=true]:focus:bg-default/40 data-[selected=true]:pointer-events-none'
                }}
              >
                <div className="font-light">{item}</div>
              </SelectItem>
            ))}
              </SelectSection>
            </Select>
          </section>
          <section>
            <header className="text-sm font-light my-3">Advanced options</header>
            <div className="flex flex-row gap-4 justify-between my-3">
              <p>Enable google search</p>
              <Switch
                size="sm"
                isSelected={enableGoogle}
                onValueChange={handleGoogle}
                aria-label="google search"
              />
            </div>
            <div className="flex flex-row gap-4 justify-between my-3">
              <p>Enable Quivr Second Brain</p>
              <Switch
                size="sm"
                isSelected={enableQuivr}
                onValueChange={handleQuivr}
                aria-label="google search"
              />
            </div>
          </section>
        </section>
      </motion.div>
    </motion.aside>
    )}
    </AnimatePresence>
    <Button
      isIconOnly
      variant="light"
      className="min-w-8 z-50"
      onPress={cycleOpen}
    >
      {open ? (
        <RxCross2 size="1.75em"/>
      ) : (
        <RxHamburgerMenu size="1.75em"/>
      )}
    </Button>
    </>
  );
}
