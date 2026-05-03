import { Shield, FileText, Scale, Lock, UserCheck, Bell, Database, Globe, Mail, Phone, Users } from "lucide-react";

export function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="space-y-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl px-8 py-12 text-white text-center">
          <Shield className="w-16 h-16 mx-auto mb-4" />
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Terms & Conditions</h1>
          <p className="text-green-100">Barangay New Kalalake Health Center - KomuniCare System</p>
        </div>

        <div className="border-l-4 border-green-600 pl-4">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-5 h-5 text-green-600" />
            <h2 className="text-xl font-bold text-gray-900">1. Acceptance of Terms</h2>
          </div>
          <p className="text-gray-600 leading-relaxed">
            By creating an account and using KomuniCare, you agree to be bound by these Terms and Conditions. 
            If you do not agree to these terms, please do not use the system. These terms apply to all residents, 
            Barangay Health Workers (BHWs), and administrators of Barangay New Kalalake.
          </p>
        </div>

        <div className="border-l-4 border-green-600 pl-4">
          <div className="flex items-center gap-2 mb-3">
            <Database className="w-5 h-5 text-green-600" />
            <h2 className="text-xl font-bold text-gray-900">2. Data Privacy (RA 10173)</h2>
          </div>
          <p className="text-gray-600 leading-relaxed">
            Your personal information is collected and processed in accordance with the Data Privacy Act of 2012 (RA 10173). 
            Barangay New Kalalake Health Center is committed to protecting your privacy and ensuring the security of your personal data.
          </p>
        </div>

        <div className="border-l-4 border-green-600 pl-4">
          <div className="flex items-center gap-2 mb-3">
            <Database className="w-5 h-5 text-green-600" />
            <h2 className="text-xl font-bold text-gray-900">3. Information We Collect</h2>
          </div>
          <p className="text-gray-600 leading-relaxed mb-2">We collect the following personal information:</p>
          <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
            <li>Full name and basic profile information</li>
            <li>Email address and phone number</li>
            <li>Residential address (must be within Barangay New Kalalake)</li>
            <li>Valid government ID for verification</li>
            <li>Health records and medical history</li>
            <li>Appointment schedules and health monitoring data</li>
            <li>Emergency contact information</li>
          </ul>
        </div>

        <div className="border-l-4 border-green-600 pl-4">
          <div className="flex items-center gap-2 mb-3">
            <Globe className="w-5 h-5 text-green-600" />
            <h2 className="text-xl font-bold text-gray-900">4. Use of Information</h2>
          </div>
          <p className="text-gray-600 leading-relaxed">Your information will be used for the following legitimate purposes:</p>
          <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4 mt-2">
            <li>Health monitoring and tracking</li>
            <li>Appointment scheduling and management</li>
            <li>Emergency response and contact tracing</li>
            <li>Community health program implementation</li>
            <li>Vaccination campaigns and health advisories</li>
            <li>Communication of important health announcements</li>
          </ul>
        </div>

        <div className="border-l-4 border-green-600 pl-4">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-5 h-5 text-green-600" />
            <h2 className="text-xl font-bold text-gray-900">5. Data Sharing</h2>
          </div>
          <p className="text-gray-600 leading-relaxed">
            Your information may be shared with authorized Barangay Health Workers (BHWs), health center staff, 
            and barangay officials for legitimate health service purposes. We do not sell or share your personal 
            information with third parties for marketing purposes.
          </p>
        </div>

        <div className="border-l-4 border-green-600 pl-4">
          <div className="flex items-center gap-2 mb-3">
            <Lock className="w-5 h-5 text-green-600" />
            <h2 className="text-xl font-bold text-gray-900">6. Data Security</h2>
          </div>
          <p className="text-gray-600 leading-relaxed">
            We implement appropriate security measures to protect your personal information from unauthorized access, 
            disclosure, alteration, or misuse. These measures include encryption, secure authentication, regular security audits, 
            staff training, and secure backup systems.
          </p>
        </div>

        <div className="border-l-4 border-green-600 pl-4">
          <div className="flex items-center gap-2 mb-3">
            <Scale className="w-5 h-5 text-green-600" />
            <h2 className="text-xl font-bold text-gray-900">7. Your Rights Under Data Privacy Act</h2>
          </div>
          <p className="text-gray-600 leading-relaxed">As a data subject, you have the following rights under RA 10173:</p>
          <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4 mt-2">
            <li><strong>Right to be informed</strong> - Know how your data is being processed</li>
            <li><strong>Right to access</strong> - Request a copy of your personal data</li>
            <li><strong>Right to correct</strong> - Update or correct inaccurate data</li>
            <li><strong>Right to object</strong> - Object to the processing of your data</li>
            <li><strong>Right to erasure or blocking</strong> - Request deletion of your data</li>
            <li><strong>Right to damages</strong> - Claim damages for unauthorized processing</li>
            <li><strong>Right to data portability</strong> - Obtain and transfer your data</li>
          </ul>
        </div>

        <div className="border-l-4 border-green-600 pl-4">
          <div className="flex items-center gap-2 mb-3">
            <UserCheck className="w-5 h-5 text-green-600" />
            <h2 className="text-xl font-bold text-gray-900">8. Account Responsibility</h2>
          </div>
          <p className="text-gray-600 leading-relaxed">
            You are responsible for maintaining the confidentiality of your account credentials. You agree to keep your password secure, 
            notify the health center of unauthorized use, provide accurate information, update your information when changes occur, 
            and log out after each session.
          </p>
        </div>

        <div className="border-l-4 border-green-600 pl-4">
          <div className="flex items-center gap-2 mb-3">
            <Bell className="w-5 h-5 text-green-600" />
            <h2 className="text-xl font-bold text-gray-900">9. Prohibited Activities</h2>
          </div>
          <p className="text-gray-600 leading-relaxed">
            You agree not to misuse the KomuniCare system. Prohibited activities include attempting unauthorized access, 
            sharing account credentials, providing false information, interfering with system functions, bypassing security measures, 
            using the system for illegal purposes, or harassing health workers.
          </p>
        </div>

        <div className="border-l-4 border-green-600 pl-4">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-5 h-5 text-green-600" />
            <h2 className="text-xl font-bold text-gray-900">10. Amendments to Terms</h2>
          </div>
          <p className="text-gray-600 leading-relaxed">
            We reserve the right to modify these terms at any time. Registered users will be notified of significant changes 
            via email or through the system. Continued use of the system after changes constitutes acceptance of the updated terms.
          </p>
        </div>

        <div className="border-l-4 border-green-600 pl-4">
          <div className="flex items-center gap-2 mb-3">
            <Mail className="w-5 h-5 text-green-600" />
            <h2 className="text-xl font-bold text-gray-900">11. Contact Information</h2>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <p><strong>Barangay New Kalalake Health Center</strong></p>
            <p className="flex items-center gap-2"><Mail className="w-4 h-4 text-green-600" /> Email: healthcenter@newkalalake.gov.ph</p>
            <p className="flex items-center gap-2"><Phone className="w-4 h-4 text-green-600" /> Phone: 047 224-8264</p>
            <p className="flex items-center gap-2"><Phone className="w-4 h-4 text-green-600" /> Mobile: 0907 265 0471</p>
            <p>Address: Ground Floor Barangay New Kalalake Multi Purpose Hall, 14th St. Corner Murphy Street, New Kalalake, Olongapo City</p>
          </div>
        </div>

        <div className="border-l-4 border-green-600 pl-4 bg-green-50 rounded-r-lg">
          <div className="flex items-center gap-2 mb-3">
            <UserCheck className="w-5 h-5 text-green-600" />
            <h2 className="text-xl font-bold text-gray-900">12. BHW Code of Conduct</h2>
          </div>
          <p className="text-gray-600 leading-relaxed">
            As a Barangay Health Worker (BHW), you agree to maintain strict confidentiality of resident health information, 
            act professionally with integrity, serve the community with compassion, follow health protocols, report concerns, 
            participate in training, and never exploit resident information for personal gain.
          </p>
        </div>

        <div className="text-center pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            By using KomuniCare, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.

          </p>
        </div>
      </div>
    </div>
  );
}