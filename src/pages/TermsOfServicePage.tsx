import { Header } from "../components/Header";
import Footer from "../components/Footer";

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="prose prose-lg">
          <h1>Terms of Service</h1>
          <p>Last updated: September 02, 2025</p>

          <h2>1. Agreement to Terms</h2>
          <p>
            By using our services, you agree to be bound by these Terms of
            Service. If you do not agree to these terms, please do not use
            our services.
          </p>

          <h2>2. Changes to Terms or Services</h2>
          <p>
            We may modify the Terms at any time, in our sole discretion. If
            we do so, we’ll let you know either by posting the modified Terms
            on the Site or through other communications.
          </p>

          <h2>3. Who May Use the Services</h2>
          <p>
            You may use the Services only if you are 18 years or older and
            are not barred from using the Services under applicable law.
          </p>

          <h2>4. Content on the Services</h2>
          <p>
            For purposes of these Terms, “Content” means text, graphics,
            images, music, software, audio, video, works of authorship of
            any kind, and information or other materials that are posted,
            generated, provided or otherwise made available through the
            Services.
          </p>

          <h2>5. General Prohibitions</h2>
          <p>
            You agree not to do any of the following:
          </p>
          <ul>
            <li>
              Post, upload, publish, submit or transmit any Content that:
              (i) infringes, misappropriates or violates a third party’s
              patent, copyright, trademark, trade secret, moral rights or
              other intellectual property rights, or rights of publicity or
              privacy; (ii) violates, or encourages any conduct that would
              violate, any applicable law or regulation or would give rise
              to civil liability; (iii) is fraudulent, false, misleading or
              deceptive; (iv) is defamatory, obscene, pornographic, vulgar
              or offensive; (v) promotes discrimination, bigotry, racism,
              hatred, harassment or harm against any individual or group;
              (vi) is violent or threatening or promotes violence or actions
              that are threatening to any person or entity; or (vii)
              promotes illegal or harmful activities or substances.
            </li>
          </ul>

          <h2>6. Termination</h2>
          <p>
            We may terminate your access to and use of the Services, at our
            sole discretion, at any time and without notice to you.
          </p>

          <h2>7. Disclaimers</h2>
          <p>
            The Services and Content are provided “AS IS,” without warranty
            of any kind.
          </p>

          <h2>8. Limitation of Liability</h2>
          <p>
            Neither we nor any other party involved in creating, producing,
            or delivering the Services or Content will be liable for any
            incidental, special, exemplary or consequential damages.
          </p>

          <h2>9. Governing Law</h2>
          <p>
            These Terms and any action related thereto will be governed by
            the laws of the jurisdiction in which our company is
            established, without regard to its conflict of laws provisions.
          </p>

          <h2>10. Contact Information</h2>
          <p>
            If you have any questions about these Terms, please contact us.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
