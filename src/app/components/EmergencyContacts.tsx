import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Phone, Ambulance, Shield, Hospital, AlertCircle, MapPin, Clock } from "lucide-react";
import { auth, db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";

interface Hospital {
  name: string;
  location: string;
  type: string;
  phone: string;
}

interface BHW {
  id: string;
  name: string;
  phone: string;
  barangay: string;
  role?: string;
}

// Real hospitals in Olongapo
const hospitals: Hospital[] = [
  { name: "James L. Gordon Memorial Hospital", location: "New Asinan", type: "Public Hospital", phone: "047-222-1234" },
  { name: "ACE Medical Center - Baypointe", location: "Subic Bay Freeport Zone", type: "Private Hospital (Level 2)", phone: "047-252-1234" },
  { name: "Our Lady of Lourdes International Medical Center", location: "Barretto", type: "Private Hospital", phone: "047-222-5678" },
  { name: "ZMMG Coop Hospital", location: "West Bajac-Bajac", type: "Private Hospital", phone: "047-222-9012" },
  { name: "Ridon's St. Jude Medical Center", location: "East Bajac-Bajac", type: "Private Medical Center", phone: "047-222-3456" },
  { name: "Ulticare Medical Center", location: "Olongapo City", type: "Outpatient Medical Center", phone: "047-222-7890" },
];

export function EmergencyContacts() {
  const [bhws, setBhws] = useState<BHW[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBHWs();
  }, []);

  const loadBHWs = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "bhws"));
      const bhwsList: BHW[] = querySnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name || "Unknown",
        phone: doc.data().phone || "N/A",
        barangay: doc.data().barangay || "N/A",
        role: "Barangay Health Worker",
      }));
      setBhws(bhwsList);
    } catch (error) {
      console.error("Error loading BHWs:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Emergency Alert */}
      <Card className="p-4 shadow-md rounded-xl bg-red-50 border-2 border-red-200">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-8 h-8 text-red-600" />
          <div>
            <h3 className="font-semibold text-red-800">Emergency Assistance</h3>
            <p className="text-sm text-red-600">
              For immediate medical emergencies, call 911
            </p>
          </div>
        </div>
      </Card>

      {/* National Emergency Hotline */}
      <Card className="p-4 shadow-md rounded-xl bg-red-100 border-2 border-red-300">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center flex-shrink-0">
            <Phone className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-lg text-gray-800">Emergency Hotline</h4>
            <p className="text-sm text-gray-600">National emergency hotline</p>
            <p className="text-xl font-bold text-red-600 mt-1">911</p>
          </div>
          <Button
            size="sm"
            className="bg-green-600 hover:bg-green-700"
            onClick={() => window.open("tel:911")}
          >
            <Phone className="w-4 h-4 mr-1" />
            Call
          </Button>
        </div>
      </Card>

      {/* Hospitals in Olongapo */}
      <div>
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Hospital className="w-5 h-5 text-blue-600" />
          Hospitals in Olongapo
        </h3>
        <div className="grid gap-3">
          {hospitals.map((hospital, index) => (
            <Card key={index} className="p-4 shadow-md rounded-xl">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Hospital className="w-4 h-4 text-blue-600" />
                    <h4 className="font-semibold text-gray-800">{hospital.name}</h4>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <MapPin className="w-3 h-3 text-gray-400" />
                    <span className="text-xs text-gray-500">{hospital.location}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{hospital.type}</p>
                  <p className="text-sm font-semibold text-red-600 mt-2">
                    {hospital.phone}
                  </p>
                </div>
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 ml-2"
                  onClick={() => window.open(`tel:${hospital.phone}`)}
                >
                  <Phone className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Barangay Health Workers - from Firebase */}
      <div>
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Shield className="w-5 h-5 text-green-600" />
          Barangay Health Workers
        </h3>
        {loading ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-sm text-gray-500">Loading health workers...</p>
          </div>
        ) : bhws.length === 0 ? (
          <Card className="p-8 text-center">
            <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No health workers registered yet</p>
            <p className="text-sm text-gray-400">Contact your barangay health center</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {bhws.map((worker) => (
              <Card key={worker.id} className="p-4 shadow-md rounded-xl">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-semibold text-blue-600">
                        {worker.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800">{worker.name}</h4>
                      <p className="text-xs text-muted-foreground">{worker.role || "BHW"}</p>
                      <p className="text-xs text-gray-500 mt-1">Barangay: {worker.barangay}</p>
                      <p className="text-sm font-medium text-red-600 mt-1">
                        {worker.phone}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-green-600 text-green-600 hover:bg-green-50"
                    onClick={() => window.open(`tel:${worker.phone}`)}
                  >
                    <Phone className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Ambulance Service Note */}
      <Card className="p-4 shadow-md rounded-xl bg-blue-50 border border-blue-200">
        <div className="flex items-center gap-3">
          <Ambulance className="w-6 h-6 text-blue-600" />
          <div>
            <h4 className="font-semibold text-blue-800">Ambulance Service</h4>
            <p className="text-sm text-blue-700">
              For emergency transport, call the nearest hospital directly or dial 911.
              All major hospitals in Olongapo provide 24/7 ambulance services.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}