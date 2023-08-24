'use client'
import { VscGithub } from 'react-icons/vsc';
import { FaDiscord, FaTwitter } from 'react-icons/fa';
import { Link } from '@nextui-org/link';
import { useAuthContext } from '@/context/AuthContext';

export default function Ctabox() {
  const { user } = useAuthContext();
  return (
    <div className="bg-white">
    <div className="mx-auto max-w-7xl py-24 sm:px-6 sm:py-32 lg:px-8">
      <div className="relative isolate overflow-hidden bg-gray-900 px-6 pt-16 shadow-2xl sm:rounded-3xl sm:px-16 md:pt-24 lg:flex lg:gap-x-20 lg:px-24 lg:pt-0">
        <svg
          viewBox="0 0 1024 1024"
          className="absolute left-1/2 top-1/2 -z-10 h-[64rem] w-[64rem] -translate-y-1/2 [mask-image:radial-gradient(closest-side,white,transparent)] sm:left-full sm:-ml-80 lg:left-1/2 lg:ml-0 lg:-translate-x-1/2 lg:translate-y-0"
          aria-hidden="true"
        >
          <circle cx={412} cy={712} r={812} fill="url(#759c1415-0410-454c-8f7c-9a820de03641)" fillOpacity="0.4" />
          <defs>
            <radialGradient id="759c1415-0410-454c-8f7c-9a820de03641">
              <stop stopColor="#2069ff" />
              <stop offset={1} stopColor="#2069ff" />
            </radialGradient>
          </defs>
        </svg>
        <div className="mx-auto max-w-md text-center lg:mx-0 lg:flex-auto lg:py-32 lg:text-left">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Create Or Interact with a AI character 
            <br />
            
          </h2>
          <p className="mt-6 text-lg leading-8 text-gray-300">
          Step into the Realm of Creativity: Design, Customize, and Engage with Your Own AI Character - Your World, Your Rules!
          </p>
          {user==null ? (
          <div className="mt-10 flex items-center justify-center gap-x-6 lg:justify-start">
            <p
              
              className="rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
             Sign in to Get started
            </p>
          </div>
          ) : (<>
          <div className="mt-10 flex items-center justify-center gap-x-6 lg:justify-start">
           <p
              
              className="rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
             Get Started below
            </p>
          </div>
          </>)}
        </div>
        <div className="relative mt-16 h-80 lg:mt-8">
          <img
            className="absolute left-0 top-0 w-[57rem] max-w-none rounded-md bg-white/5 ring-1 ring-white/10"
            src="https://i.ibb.co/pRdZpnb/bgimage.png"
            alt="App screenshot"
            width={1824}
            height={1080}
          />
        </div>
      </div>
    </div>
  </div>
  )
}
