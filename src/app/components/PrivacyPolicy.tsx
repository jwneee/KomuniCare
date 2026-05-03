import { Shield, Database, Cookie, Clock, UserCheck } from "lucide-react";

export function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="space-y-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl px-8 py-12 text-white text-center">
          <Shield className="w-16 h-16 mx-auto mb-4" />
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Privacy Policy</h1>
          <p className="text-green-100">Barangay New Kalalake Health Center - KomuniCare System</p>
          <p className="text-green-200 text-sm mt-4">Last Updated: April 30, 2026</p>
        </div>

        {/* Who We Are */}
        <div className="border-l-4 border-green-600 pl-4">
          <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Database className="w-5 h-5 text-green-600" />
            Who We Are
          </h2>
          <p className="text-gray-600">
            KomuniCare is a barangay health and wellness platform operated by the Barangay New Kalalake Health Center. 
            Our website address is: <a href="https://komunicare-4ff27.web.app" className="text-green-600 hover:underline">https://komunicare-4ff27.web.app</a>
          </p>
        </div>

        {/* What Personal Data We Collect */}
        <div className="border-l-4 border-green-600 pl-4">
          <h2 className="text-xl font-bold text-gray-900 mb-3">What Personal Data We Collect</h2>
          <p className="text-gray-600 mb-3">When you register for KomuniCare, we collect the following information:</p>
          <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
            <li>Full Name</li>
            <li>Email Address</li>
            <li>Phone Number</li>
            <li>Complete Address</li>
            <li>Health Records and Logs</li>
            <li>Appointment History</li>
            <li>Task and Reward Information</li>
          </ul>
        </div>

        {/* How We Use Your Information */}
        <div className="border-l-4 border-green-600 pl-4">
          <h2 className="text-xl font-bold text-gray-900 mb-3">How We Use Your Information</h2>
          <p className="text-gray-600">Your information is used for the following purposes:</p>
          <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4 mt-2">
            <li>Health monitoring and record-keeping</li>
            <li>Appointment scheduling and management</li>
            <li>Emergency response and SOS alerts</li>
            <li>Task and reward system</li>
            <li>Health program announcements</li>
          </ul>
        </div>

        {/* Cookies */}
        <div className="border-l-4 border-green-600 pl-4">
          <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Cookie className="w-5 h-5 text-green-600" />
            Cookies
          </h2>
          <p className="text-gray-600">
            KomuniCare uses cookies to authenticate users and maintain session state. These cookies are essential 
            for the proper functioning of the application.
          </p>
        </div>

        {/* How Long We Retain Your Data */}
        <div className="border-l-4 border-green-600 pl-4">
          <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Clock className="w-5 h-5 text-green-600" />
            How Long We Retain Your Data
          </h2>
          <p className="text-gray-600">
            We retain your personal data for as long as your account is active. If you request account deletion, 
            your data will be removed within 30 days.
          </p>
        </div>

        {/* Your Rights */}
        <div className="border-l-4 border-green-600 pl-4 bg-green-50 rounded-r-lg">
          <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-green-600" />
            Your Rights Under RA 10173 (Data Privacy Act)
          </h2>
          <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
            <li>Right to be informed about your data being collected</li>
            <li>Right to access your personal information</li>
            <li>Right to correct any inaccurate data</li>
            <li>Right to request deletion of your data</li>
          </ul>
        </div>

        {/* Footer Note */}
        <div className="text-center pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Barangay New Kalalake Health Center is committed to protecting your privacy and personal data.
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Barangay New Kalalake Health Center • KomuniCare System v1.0
          </p>
        </div>
      </div>
    </div>
  );
}