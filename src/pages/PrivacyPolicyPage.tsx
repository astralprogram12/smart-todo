import { Header } from '../components/Header';
import Footer from '../components/Footer';

const PrivacyPolicyPage = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-4">Privacy Policy</h1>
        <div className="prose max-w-none">
          <p>
            This privacy notice for our company ("we," "us," or "our"), describes how and why we might collect, store, use, and/or share ("process") your information when you use our services ("Services"), such as when you:
          </p>
          <ul>
            <li>Visit our website, or any website of ours that links to this privacy notice</li>
            <li>Download and use our application(s), such as our mobile application, or any other application of ours that links to this privacy notice</li>
            <li>Engage with us in other related ways, including any sales, marketing, or events</li>
          </ul>
          <h2>Questions or concerns?</h2>
          <p>
            Reading this privacy notice will help you understand your privacy rights and choices. If you do not agree with our policies and practices, please do not use our Services. If you still have any questions or concerns, please contact us.
          </p>
          <h2>SUMMARY OF KEY POINTS</h2>
          <p>
            This summary provides key points from our privacy notice, but you can find out more details about any of these topics by using our table of contents below to find the section you are looking for.
          </p>
          <p>
            <strong>What personal information do we process?</strong> When you visit, use, or navigate our Services, we may process personal information depending on how you interact with us and the Services, the choices you make, and the products and features you use.
          </p>
          <p>
            <strong>Do we process any sensitive personal information?</strong> We do not process sensitive personal information.
          </p>
          <p>
            <strong>Do we receive any information from third parties?</strong> We may receive information from public databases, marketing partners, social media platforms, and other outside sources.
          </p>
          <p>
            <strong>How do we process your information?</strong> We process your information to provide, improve, and administer our Services, communicate with you, for security and fraud prevention, and to comply with law. We may also process your information for other purposes with your consent. We process your information only when we have a valid legal reason to do so.
          </p>
          <p>
            <strong>In what situations and with which parties do we share personal information?</strong> We may share information in specific situations and with specific third parties.
          </p>
          <p>
            <strong>What are your rights?</strong> Depending on where you are located geographically, the applicable privacy law may mean you have certain rights regarding your personal information.
          </p>
          <p>
            <strong>How do you exercise your rights?</strong> The easiest way to exercise your rights is by contacting us. We will consider and act upon any request in accordance with applicable data protection laws.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PrivacyPolicyPage;
