import Header from '../_components/Header';
import Footer from '../_components/Footer';

export default function TermsOfService() {
  return (
    <>
      <Header />
      <div className="py-5 px-4 flex flex-col gap-3 md:w-unit-9xl md:mx-auto md:gap-5 lg:w-[892px] lg:gap-8">
        <h1 className="text-2xl font-medium">Terms of Service for RealChar</h1>
        <p>
          <strong>Effective Date:</strong> 08/18/2023
        </p>

        <h2 className="text-xl font-medium">Introduction</h2>
        <p>
          Welcome to RealChar. These terms and conditions outline the rules and
          regulations for the use of RealChar&apos;s website and services. By
          accessing this website and using our services, we assume you accept
          these terms and conditions in full. Do not continue to use
          RealChar&apos;s website and services if you do not accept all of the
          terms and conditions stated on this page.
        </p>

        <h2 className="text-xl font-medium">License</h2>
        <p>
          Unless otherwise stated, RealChar owns the intellectual property rights
          for all material on RealChar. All intellectual property rights are
          reserved. You may access this from RealChar for your own personal use
          subjected to restrictions set in these terms and conditions.
        </p>

        <h2 className="text-xl font-medium">User Responsibilities</h2>
        <ul>
          <li>
            <strong>Account Security:</strong> You are responsible for maintaining
            the confidentiality of your account and password.
          </li>
          <li>
            <strong>Content:</strong> You are responsible for all content that you
            upload, post, email or otherwise transmit via the service.
          </li>
        </ul>

        <h2 className="text-xl font-medium">Service Usage</h2>
        <ul>
          <li>Use of the website and services is at your own risk.</li>
          <li>
            You agree not to access the service by any means other than through
            the interfaces provided by RealChar.
          </li>
        </ul>

        <h2 className="text-xl font-medium">Indemnification</h2>
        <p>
          You agree to indemnify, defend and hold harmless RealChar, its officers,
          directors, employees, agents and third parties, for any losses, costs,
          liabilities and expenses (including reasonable attorneys&apos; fees)
          relating to or arising out of your use of or inability to use the site
          services, your violation of any terms of this agreement or your
          violation of any rights of a third party, or your violation of any
          applicable laws, rules or regulations.
        </p>

        <h2 className="text-xl font-medium">Termination</h2>
        <p>
          RealChar reserves the right to terminate your access to the site and the
          services, without any advance notice.
        </p>

        <h2 className="text-xl font-medium">Contact Us</h2>
        <p>
          If you have any questions about these Terms of Service, please contact
          us at support@realchar.ai.
        </p>
      </div>
      <Footer/>
    </>
  )
}