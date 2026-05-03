import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";

interface TermsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAgree: () => void;
  title: string;
  userType: "resident" | "bhw";
}

export function TermsModal({ open, onOpenChange, onAgree, title, userType }: TermsModalProps) {
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const [checked, setChecked] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      const isBottom = scrollTop + clientHeight >= scrollHeight - 10;
      setScrolledToBottom(isBottom);
    }
  };

  const handleAgree = () => {
    if (checked) {
      onAgree();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[90vw] max-w-4xl h-[85vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-2xl font-bold">{title}</DialogTitle>
        </DialogHeader>
        
        <div 
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-6 py-4"
          style={{ scrollBehavior: 'smooth' }}
        >
          <div className="space-y-4 text-sm text-gray-600">
            <h3 className="font-bold text-gray-800">Terms and Conditions</h3>
            <p>Last updated: April 30, 2026</p>
            
            <h4 className="font-semibold text-gray-800">1. Acceptance of Terms</h4>
            <p>By creating an account and using KomuniCare, you agree to be bound by these Terms and Conditions.</p>
            
            <h4 className="font-semibold text-gray-800">2. Data Privacy (RA 10173)</h4>
            <p>Your personal information is collected and processed in accordance with the Data Privacy Act of 2012 (RA 10173). Barangay New Kalalake Health Center is committed to protecting your privacy and ensuring the security of your personal data.</p>
            
            <h4 className="font-semibold text-gray-800">3. Information We Collect</h4>
            <p>We collect personal information such as name, email, phone number, address, health records, and valid ID for verification purposes.</p>
            
            <h4 className="font-semibold text-gray-800">4. Use of Information</h4>
            <p>Your information will be used for health monitoring, appointment scheduling, emergency response, and community health programs.</p>
            
            <h4 className="font-semibold text-gray-800">5. Data Sharing</h4>
            <p>Your information may be shared with authorized Barangay Health Workers and health center staff for legitimate health service purposes.</p>
            
            <h4 className="font-semibold text-gray-800">6. Data Security</h4>
            <p>We implement appropriate security measures to protect your personal information from unauthorized access, disclosure, or misuse.</p>
            
            <h4 className="font-semibold text-gray-800">7. Your Rights Under Data Privacy Act</h4>
            <p>You have the right to be informed, to access, to correct, to object, to erasure or blocking, to damages, and to data portability.</p>
            
            <h4 className="font-semibold text-gray-800">8. Account Responsibility</h4>
            <p>You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.</p>
            
            <h4 className="font-semibold text-gray-800">9. Prohibited Activities</h4>
            <p>You agree not to misuse the system, attempt unauthorized access, or interfere with the proper functioning of KomuniCare.</p>
            
            <h4 className="font-semibold text-gray-800">10. Amendments</h4>
            <p>We reserve the right to modify these terms at any time. Continued use of the system constitutes acceptance of updated terms.</p>
            
            <h4 className="font-semibold text-gray-800">11. Contact Information</h4>
            <p>For privacy concerns or data requests, contact us at:</p>
            <p>Email: healthcenter@newkalalake.gov.ph<br />Phone: 047 224-8264<br />Address: Barangay New Kalalake Health Center, Olongapo City</p>
            
            {userType === "bhw" && (
              <>
                <h4 className="font-semibold text-gray-800">12. BHW Code of Conduct</h4>
                <p>As a Barangay Health Worker, you agree to maintain confidentiality of resident information, act professionally, and serve the community with integrity.</p>
              </>
            )}
          </div>
        </div>
        
        <div className="border-t px-6 py-4">
          <div className="flex items-center gap-2 mb-4">
            <Checkbox 
              id="agree" 
              checked={checked}
              onCheckedChange={(c) => setChecked(c === true)}
              disabled={!scrolledToBottom}
            />
            <label htmlFor="agree" className="text-sm text-gray-700">
              I have read and agree to the Terms & Conditions and Privacy Policy
            </label>
          </div>
          
          <Button 
            onClick={handleAgree} 
            disabled={!checked}
            className="w-full bg-green-700 hover:bg-green-800"
          >
            Agree & Continue
          </Button>
          
          {!scrolledToBottom && (
            <p className="text-xs text-gray-400 text-center mt-3">
              Please scroll to the bottom to read the full terms
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}