import { User2 } from "lucide-react";

interface BHW {
  name: string;
  position: string;
  yearsOfService?: number;
}

const bhws: BHW[] = [
  { name: "Maria Cecilia Lumabi", position: "Barangay Health Worker", yearsOfService: 3 },
  { name: "Juan Dela Cruz", position: "Barangay Health Worker", yearsOfService: 5 },
  { name: "Maria Santos", position: "Barangay Health Worker", yearsOfService: 2 },
  { name: "Pedro Reyes", position: "Barangay Health Worker", yearsOfService: 4 },
  { name: "Ana Martinez", position: "Barangay Health Worker", yearsOfService: 1 },
  { name: "Ramon Garcia", position: "Barangay Health Worker", yearsOfService: 6 },
  { name: "Luz Fernandez", position: "Barangay Health Worker", yearsOfService: 3 },
  { name: "Rogelio Cruz", position: "Barangay Health Worker", yearsOfService: 2 },
];

export function BHWList() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2 border-l-4 border-green-600 pl-3">Barangay Health Workers</h2>
        <p className="text-gray-500 text-sm mb-6 ml-3">Dedicated health workers serving New Kalalake</p>
        
        <div className="space-y-3">
          {bhws.map((bhw, index) => (
            <div key={index} className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-0">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                <User2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-800">{bhw.name}</p>
                <p className="text-sm text-gray-500">{bhw.position} • {bhw.yearsOfService} year{bhw.yearsOfService !== 1 ? "s" : ""} of service</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}