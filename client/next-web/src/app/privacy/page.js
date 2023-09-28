import Header from '../_components/Header';
import Footer from '../_components/Footer';
export default function Privacy() {
  return (
    <>
      <Header />
      <div className="py-5 px-4 flex flex-col gap-3 md:w-unit-9xl md:mx-auto md:gap-5 lg:w-[892px] lg:gap-8">
        <h1 className="text-2xl font-medium">Privacy Notice for RealChar</h1>
        <p>
          <strong>Effective Date:</strong> 08/18/2023
        </p>

        <h2 className="text-xl font-medium">Introduction</h2>
        <p>
          Thank you for using RealChar. We respect your privacy and want to
          protect your personal data. This privacy notice will inform you as to
          how we look after your personal data when you visit our website
          (regardless of where you visit it from) and tell you about your privacy
          rights and how the law protects you.
        </p>

        <h2 className="text-xl font-medium">Data We Collect</h2>
        <p>
          We may collect, use, store, and transfer different kinds of personal
          data about you, which we have grouped together as follows:
        </p>
        <ul>
          <li>
            <strong>Contact Data:</strong> Includes email address and unique user
            ID
          </li>
          <li>
            <strong>Usage Data:</strong> Information about how you use our
            website, products, and services.
          </li>
        </ul>

        <h2 className="text-xl font-medium">How We Use Your Data</h2>
        <p>
          We will only use your personal data for the purpose for which we
          collected it which include the following:
        </p>
        <ul>
          <li>To register you as a new customer.</li>
          <li>To process and deliver your request.</li>
          <li>To manage our relationship with you.</li>
          <li>
            To make suggestions and recommendations to you about goods or services
            that may be of interest to you.
          </li>
        </ul>

        <h2 className="text-xl font-medium">Data Security</h2>
        <p>
          We have put in place appropriate security measures to prevent your
          personal data from being accidentally lost, used, or accessed in an
          unauthorized way. In addition, we limit access to your personal data to
          those employees, agents, contractors, and other third parties who have a
          business need to know.
        </p>

        <h2 className="text-xl font-medium">Data Retention</h2>
        <p>
          We will only retain your personal data for as long as necessary to
          fulfill the purposes we collected it for, including for the purposes of
          satisfying any legal, accounting, or reporting requirements.
        </p>

        <h2 className="text-xl font-medium">Your Legal Rights</h2>
        <p>
          Under certain circumstances, you have rights under data protection laws
          in relation to your personal data, including the right to request
          access, correction, erasure, restriction, transfer, or to object to
          processing.
        </p>

        <h2 className="text-xl font-medium">Contact Us</h2>
        <p>
          For any questions about this privacy notice or our privacy practices,
          please contact us at privacy@realchar.ai.
        </p>
      </div>
      <Footer />
    </>
  );
}