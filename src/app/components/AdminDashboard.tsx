import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Users, Briefcase, Search, Eye, Calendar, Phone, MapPin, Mail } from "lucide-react";
import { toast, Toaster } from "sonner";
import { db, auth } from "../firebase";
import { collection, getDocs, doc, getDoc, query, orderBy } from "firebase/firestore";

interface Resident {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  residentId: string;
  registeredAt: string;
  verified: boolean;
}

interface BHW {
  id: string;
  name: string;
  email: string;
  personalEmail: string;
  idNumber: string;
  barangay: string;
  phone: string;
  registeredAt: string;
  isAdmin: boolean;
  verified: boolean;
}

export default function AdminDashboard() {
  const [residents, setResidents] = useState<Resident[]>([]);
  const [bhws, setBhws] = useState<BHW[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchResident, setSearchResident] = useState("");
  const [searchBHW, setSearchBHW] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminStatus();
    loadData();
  }, []);

  const checkAdminStatus = async () => {
    const user = auth.currentUser;
    if (user) {
      const bhwDoc = await getDoc(doc(db, "bhws", user.uid));
      setIsAdmin(bhwDoc.data()?.isAdmin === true);
    }
  };

  const loadData = async () => {
    try {
      // Load residents
      const residentsSnap = await getDocs(query(collection(db, "residents"), orderBy("registeredAt", "desc")));
      const residentsList = residentsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Resident));
      setResidents(residentsList);

      // Load BHWs
      const bhwsSnap = await getDocs(query(collection(db, "bhws"), orderBy("registeredAt", "desc")));
      const bhwsList = bhwsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as BHW));
      setBhws(bhwsList);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const filteredResidents = residents.filter(r =>
    r.name?.toLowerCase().includes(searchResident.toLowerCase()) ||
    r.residentId?.toLowerCase().includes(searchResident.toLowerCase()) ||
    r.email?.toLowerCase().includes(searchResident.toLowerCase())
  );

  const filteredBHWs = bhws.filter(b =>
    b.name?.toLowerCase().includes(searchBHW.toLowerCase()) ||
    b.idNumber?.toLowerCase().includes(searchBHW.toLowerCase()) ||
    b.email?.toLowerCase().includes(searchBHW.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <Card className="p-8 text-center">
          <p className="text-red-600 font-semibold">Access Denied</p>
          <p className="text-gray-500 text-sm mt-2">Admin only. Please login as admin.</p>
        </Card>
      </div>
    );
  }

  if (loading) {
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
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage residents and health workers</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="p-5 shadow-sm rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-1">Total Residents</p>
              <p className="text-2xl font-bold text-green-600">{residents.length}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </Card>
        <Card className="p-5 shadow-sm rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-1">Total BHWs</p>
              <p className="text-2xl font-bold text-[#0B0B45]">{bhws.length}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-[#0B0B45]" />
            </div>
          </div>
        </Card>
      </div>

      <Tabs defaultValue="residents">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="residents" className="flex items-center gap-2">
            <Users className="w-4 h-4" /> Residents ({residents.length})
          </TabsTrigger>
          <TabsTrigger value="bhws" className="flex items-center gap-2">
            <Briefcase className="w-4 h-4" /> BHWs ({bhws.length})
          </TabsTrigger>
        </TabsList>

        {/* Residents Tab */}
        <TabsContent value="residents" className="space-y-4 mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by name, Resident ID, or email..."
              value={searchResident}
              onChange={(e) => setSearchResident(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="space-y-3">
            {filteredResidents.length === 0 ? (
              <Card className="p-8 text-center text-gray-400">No residents found</Card>
            ) : (
              filteredResidents.map((resident) => (
                <Card key={resident.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-800">{resident.name}</h3>
                        <Badge className="bg-green-100 text-green-700 text-xs">Verified</Badge>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 mt-2 text-sm text-gray-500">
                        <p className="flex items-center gap-1"><span className="font-mono text-xs bg-gray-100 px-1 rounded">ID:</span> {resident.residentId}</p>
                        <p className="flex items-center gap-1"><Mail className="w-3 h-3" /> {resident.email}</p>
                        <p className="flex items-center gap-1"><Phone className="w-3 h-3" /> {resident.phone}</p>
                        <p className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {resident.address}</p>
                        <p className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Registered: {formatDate(resident.registeredAt)}</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="shrink-0">
                      <Eye className="w-4 h-4 mr-1" /> View
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* BHWs Tab */}
        <TabsContent value="bhws" className="space-y-4 mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by name, BHW ID, or email..."
              value={searchBHW}
              onChange={(e) => setSearchBHW(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="space-y-3">
            {filteredBHWs.length === 0 ? (
              <Card className="p-8 text-center text-gray-400">No BHWs found</Card>
            ) : (
              filteredBHWs.map((bhw) => (
                <Card key={bhw.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-800">{bhw.name}</h3>
                        {bhw.isAdmin && (
                          <Badge className="bg-blue-100 text-blue-700 text-xs">Admin</Badge>
                        )}
                        <Badge className="bg-green-100 text-green-700 text-xs">Verified</Badge>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 mt-2 text-sm text-gray-500">
                        <p className="flex items-center gap-1"><span className="font-mono text-xs bg-gray-100 px-1 rounded">BHW ID:</span> {bhw.idNumber}</p>
                        <p className="flex items-center gap-1"><Mail className="w-3 h-3" /> {bhw.email}</p>
                        <p className="flex items-center gap-1"><Phone className="w-3 h-3" /> {bhw.phone}</p>
                        <p className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {bhw.barangay}</p>
                        <p className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Registered: {formatDate(bhw.registeredAt)}</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="shrink-0">
                      <Eye className="w-4 h-4 mr-1" /> View
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}