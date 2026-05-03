import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { CheckCircle, XCircle, Eye, Loader2, Users, Briefcase, Copy, Check } from "lucide-react";
import { toast, Toaster } from "sonner";
import { db, auth } from "../firebase";
import { collection, updateDoc, doc, query, where, getDoc, setDoc, onSnapshot } from "firebase/firestore";

interface PendingResident {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  idPhoto: string;
  idType: string;
  status: string;
  submittedAt: any;
  password: string;
  uid: string;
}

interface PendingBHW {
  id: string;
  name: string;
  personalEmail: string;
  barangay: string;
  phone: string;
  idPhoto: string;
  profilePhoto: string;
  status: string;
  submittedAt: any;
  uid: string;
  password: string;
}

const generateResidentId = async (): Promise<string> => {
  const currentYear = new Date().getFullYear();
  const q = query(collection(db, "residents"));
  const snapshot = await getDocs(q);
  const count = snapshot.size + 1;
  return `RES-${currentYear}-${String(count).padStart(3, "0")}`;
};

const generateBHWId = async (): Promise<string> => {
  const currentYear = new Date().getFullYear();
  const q = query(collection(db, "bhws"));
  const snapshot = await getDocs(q);
  const count = snapshot.size + 1;
  return `BHW-${currentYear}-${String(count).padStart(3, "0")}`;
};

export function BHWPendingApprovals() {
  const [pendingResidents, setPendingResidents] = useState<PendingResident[]>([]);
  const [pendingBHWs, setPendingBHWs] = useState<PendingBHW[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("residents");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [credentialsData, setCredentialsData] = useState<{ type: "resident" | "bhw"; residentId?: string; bhwId?: string; personalEmail: string; name: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  // REAL-TIME: Pending residents listener
  useEffect(() => {
    const residentsQuery = query(collection(db, "pending_residents"), where("status", "==", "pending"));
    const unsubscribe = onSnapshot(residentsQuery, (snapshot) => {
      const residents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), uid: doc.data().uid || "" } as PendingResident));
      setPendingResidents(residents);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // REAL-TIME: Pending BHWs listener
  useEffect(() => {
    const bhwsQuery = query(collection(db, "pending_bhws"), where("status", "==", "pending"));
    const unsubscribe = onSnapshot(bhwsQuery, (snapshot) => {
      const bhws = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PendingBHW));
      setPendingBHWs(bhws);
    });
    return () => unsubscribe();
  }, []);

  const checkAdminStatus = async () => {
    const user = auth.currentUser;
    if (user) {
      const bhwDoc = await getDoc(doc(db, "bhws", user.uid));
      setIsAdmin(bhwDoc.data()?.isAdmin === true);
    }
  };

  const approveResident = async (resident: PendingResident) => {
    setProcessingId(resident.id);
    try {
      const residentId = await generateResidentId();

      await setDoc(doc(db, "residents", resident.uid), {
        name: resident.name,
        email: resident.email,
        phone: resident.phone,
        address: resident.address,
        idPhoto: resident.idPhoto,
        residentId: residentId,
        registeredAt: new Date().toISOString(),
        role: "resident",
        verified: true,
        verifiedBy: auth.currentUser?.uid,
        verifiedAt: new Date(),
      });

      await updateDoc(doc(db, "pending_residents", resident.id), { 
        status: "approved", 
        reviewedBy: auth.currentUser?.uid, 
        reviewedAt: new Date(),
        generatedResidentId: residentId,
      });

      setCredentialsData({
        type: "resident",
        residentId: residentId,
        personalEmail: resident.email,
        name: resident.name,
        password: resident.password,
      });
      setShowCredentialsModal(true);

      toast.success(`${resident.name} has been approved!`);
    } catch (error: any) {
      console.error("Error approving resident:", error);
      toast.error(error.message || "Failed to approve resident");
    } finally {
      setProcessingId(null);
    }
  };

  const approveBHW = async (bhw: PendingBHW) => {
    setProcessingId(bhw.id);
    try {
      const bhwIdNumber = await generateBHWId();

      await setDoc(doc(db, "bhws", bhw.uid), {
        name: bhw.name,
        idNumber: bhwIdNumber,
        personalEmail: bhw.personalEmail,
        email: bhw.personalEmail,
        barangay: bhw.barangay,
        phone: bhw.phone,
        idPhoto: bhw.idPhoto,
        profilePhoto: bhw.profilePhoto,
        registeredAt: new Date().toISOString(),
        role: "bhw",
        isAdmin: false,
        verified: true,
        verifiedBy: auth.currentUser?.uid,
        verifiedAt: new Date(),
      });

      await updateDoc(doc(db, "pending_bhws", bhw.id), { 
        status: "approved", 
        reviewedBy: auth.currentUser?.uid, 
        reviewedAt: new Date(),
        generatedIdNumber: bhwIdNumber,
      });

      setCredentialsData({
        type: "bhw",
        bhwId: bhwIdNumber,
        personalEmail: bhw.personalEmail,
        name: bhw.name,
        password: bhw.password,
      });
      setShowCredentialsModal(true);

      toast.success(`${bhw.name} has been approved!`);
    } catch (error: any) {
      console.error("Error approving BHW:", error);
      toast.error(error.message || "Failed to approve BHW");
    } finally {
      setProcessingId(null);
    }
  };

  const rejectResident = async (resident: PendingResident) => {
    setProcessingId(resident.id);
    try {
      await updateDoc(doc(db, "pending_residents", resident.id), { status: "rejected", reviewedBy: auth.currentUser?.uid, reviewedAt: new Date() });
      toast.success(`${resident.name} has been rejected.`);
    } catch (error) {
      console.error("Error rejecting resident:", error);
      toast.error("Failed to reject resident");
    } finally {
      setProcessingId(null);
    }
  };

  const rejectBHW = async (bhw: PendingBHW) => {
    setProcessingId(bhw.id);
    try {
      await updateDoc(doc(db, "pending_bhws", bhw.id), { status: "rejected", reviewedBy: auth.currentUser?.uid, reviewedAt: new Date() });
      toast.success(`${bhw.name} has been rejected.`);
    } catch (error) {
      console.error("Error rejecting BHW:", error);
      toast.error("Failed to reject BHW");
    } finally {
      setProcessingId(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A";
    const date = timestamp?.toDate?.() || new Date(timestamp);
    return date.toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" });
  };

  if (loading && pendingResidents.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0B0B45]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />
      <div>
        <h1 className="text-2xl font-bold">Pending Approvals</h1>
        <p className="text-muted-foreground text-sm">Review and verify resident and BHW registrations</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="residents" className="flex items-center gap-2">
            <Users className="w-4 h-4" /> Residents ({pendingResidents.length})
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="bhws" className="flex items-center gap-2">
              <Briefcase className="w-4 h-4" /> BHWs ({pendingBHWs.length})
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="residents" className="space-y-4 mt-4">
          {pendingResidents.length === 0 ? (
            <Card className="p-8 text-center"><CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" /><p>No pending resident registrations</p></Card>
          ) : (
            pendingResidents.map((resident) => (
              <Card key={resident.id} className="p-5">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{resident.name}</h3>
                    <p className="text-sm text-gray-500">{resident.email}</p>
                    <p className="text-sm text-gray-500">{resident.phone}</p>
                    <p className="text-sm text-gray-500">{resident.address}</p>
                    <p className="text-xs text-gray-400 mt-2">Submitted: {formatDate(resident.submittedAt)}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setSelectedPhoto(resident.idPhoto)}><Eye className="w-4 h-4 mr-1" /> View ID</Button>
                    <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => approveResident(resident)} disabled={processingId === resident.id}>
                      {processingId === resident.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-1" />} Approve
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => rejectResident(resident)} disabled={processingId === resident.id}>
                      <XCircle className="w-4 h-4 mr-1" /> Reject
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </TabsContent>

        {isAdmin && (
          <TabsContent value="bhws" className="space-y-4 mt-4">
            {pendingBHWs.length === 0 ? (
              <Card className="p-8 text-center"><CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" /><p>No pending BHW registrations</p></Card>
            ) : (
              pendingBHWs.map((bhw) => (
                <Card key={bhw.id} className="p-5">
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{bhw.name}</h3>
                      <p className="text-sm text-gray-500">Email: {bhw.personalEmail}</p>
                      <p className="text-sm text-gray-500">Barangay: {bhw.barangay}</p>
                      <p className="text-sm text-gray-500">Contact: {bhw.phone}</p>
                      <p className="text-xs text-gray-400 mt-2">Submitted: {formatDate(bhw.submittedAt)}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setSelectedPhoto(bhw.idPhoto)}><Eye className="w-4 h-4 mr-1" /> View ID</Button>
                      <Button variant="outline" size="sm" onClick={() => setSelectedPhoto(bhw.profilePhoto)}><Eye className="w-4 h-4 mr-1" /> View Photo</Button>
                      <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => approveBHW(bhw)} disabled={processingId === bhw.id}>
                        {processingId === bhw.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-1" />} Approve
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => rejectBHW(bhw)} disabled={processingId === bhw.id}>
                        <XCircle className="w-4 h-4 mr-1" /> Reject
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>
        )}
      </Tabs>

      <Dialog open={showCredentialsModal} onOpenChange={setShowCredentialsModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {credentialsData?.type === "resident" ? "✅ Resident Account Approved!" : "✅ BHW Account Approved!"}
            </DialogTitle>
          </DialogHeader>
          {credentialsData && (
            <div className="space-y-4">
              <p className="text-gray-600">Please send these credentials to <span className="font-semibold">{credentialsData.name}</span>:</p>
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                {credentialsData.type === "resident" ? (
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Resident ID:</span>
                    <code className="bg-white px-2 py-1 rounded border">{credentialsData.residentId}</code>
                    <button onClick={() => copyToClipboard(credentialsData.residentId!)} className="text-gray-400 hover:text-gray-600">
                      {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                ) : (
                  <div className="flex justify-between items-center">
                    <span className="font-medium">BHW ID:</span>
                    <code className="bg-white px-2 py-1 rounded border">{credentialsData.bhwId}</code>
                    <button onClick={() => copyToClipboard(credentialsData.bhwId!)} className="text-gray-400 hover:text-gray-600">
                      {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="font-medium">Email:</span>
                  <code className="bg-white px-2 py-1 rounded border text-sm">{credentialsData.personalEmail}</code>
                  <button onClick={() => copyToClipboard(credentialsData.personalEmail)} className="text-gray-400 hover:text-gray-600">
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Password:</span>
                  <code className="bg-white px-2 py-1 rounded border">[Use the password they created]</code>
                </div>
              </div>
              <p className="text-sm text-gray-500">
                Login URL: <span className="font-mono text-xs">
                  {credentialsData.type === "resident" 
                    ? "https://komunicare-4ff27.web.app/resident/signin" 
                    : "https://komunicare-4ff27.web.app/bhw/signin"}
                </span>
              </p>
              <Button onClick={() => setShowCredentialsModal(false)} className="w-full bg-green-600 hover:bg-green-700">
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent><DialogHeader><DialogTitle>Submitted ID / Photo</DialogTitle></DialogHeader><img src={selectedPhoto!} alt="Preview" className="w-full rounded-lg" /></DialogContent>
      </Dialog>
    </div>
  );
}

// Helper function needed for generate functions
import { getDocs } from "firebase/firestore";