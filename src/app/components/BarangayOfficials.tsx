import { User2 } from "lucide-react";

interface Official {
  name: string;
  position: string;
  image?: string;
}

const officials: Official[] = [
  // Punong Barangay 
  { name: "SHERWIN SIONZON", position: "PUNONG BARANGAY", image: "/barangay-officials/sionzon.png" },
  
  // Barangay Kagawads(6)
  { name: "MARLON ODUCA", position: "BARANGAY KAGAWAD (COMMITTEE ON HEALTH)", image: "/barangay-officials/oduca.png" },
  { name: "EDGARDO ABAIGAR", position: "BARANGAY KAGAWAD (COMMITTEE ON LIVELIHOOD)", image: "/barangay-officials/abaigar.png" },
  { name: "ROMULADO DABU", position: "BARANGAY KAGAWAD (COMMITTEE ON PEACE & ORDER)", image: "/barangay-officials/dabu.png" },
  { name: "MA. CLARA BASCOS", position: "BARANGAY KAGAWAD (COMMITTEE ON WOMEN & FAMILY)", image: "/barangay-officials/bascos.png" },
  { name: "PEPITO ORCULLO", position: "BARANGAY KAGAWAD (COMMITTEE ON EDUCATION)", image: "/barangay-officials/orcullo.png" },
  { name: "EDWIN ECLEO", position: "BARANGAY KAGAWAD (COMMITTEE ON COOPERATIVES)", image: "/barangay-officials/ecleo.png" },
  
  // Barangay Secretary 
  { name: "PERCY ROXAS", position: "BARANGAY SECRETARY", image: "/barangay-officials/roxas.png" },
];

export function BarangayOfficials() {
  const punongBarangay = officials[0];
  const kagawads = officials.slice(1, 7);
  const secretary = officials[7];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Punong Barangay */}
      <div className="mb-16 text-center">
        <div className="relative inline-block">
          <div className="w-40 h-40 md:w-48 md:h-48 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mx-auto border-4 border-green-500 shadow-lg overflow-hidden">
            {punongBarangay.image ? (
              <img 
                src={punongBarangay.image} 
                alt={punongBarangay.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <User2 className="w-20 h-20 text-gray-400" />
            )}
          </div>
        </div>
        <h2 className="text-xl md:text-2xl font-bold text-gray-800 mt-4">{punongBarangay.name}</h2>
        <p className="text-green-600 font-semibold text-sm md:text-base uppercase tracking-wide">{punongBarangay.position}</p>
      </div>

      {/* Barangay Kagawads (6) */}
      <div className="mb-12">
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-gray-800">Barangay Kagawads</h3>
          <div className="w-20 h-1 bg-green-500 mx-auto mt-2 rounded-full"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {kagawads.map((official, index) => (
            <div key={index} className="text-center group">
              <div className="relative inline-block">
                <div className="w-32 h-32 md:w-36 md:h-36 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mx-auto border-4 border-green-400 shadow-md overflow-hidden transition-transform duration-300 group-hover:scale-105">
                  {official.image ? (
                    <img 
                      src={official.image} 
                      alt={official.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User2 className="w-14 h-14 text-gray-400" />
                  )}
                </div>
              </div>
              <h4 className="font-bold text-gray-800 text-sm md:text-base mt-3">{official.name}</h4>
              <p className="text-green-600 text-xs md:text-sm font-medium px-2">{official.position}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Barangay Secretary */}
      <div className="text-center">
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-gray-800">Barangay Secretary</h3>
          <div className="w-20 h-1 bg-green-500 mx-auto mt-2 rounded-full"></div>
        </div>
        <div className="inline-block text-center">
          <div className="relative inline-block">
            <div className="w-32 h-32 md:w-36 md:h-36 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mx-auto border-4 border-green-400 shadow-md overflow-hidden">
              {secretary.image ? (
                <img 
                  src={secretary.image} 
                  alt={secretary.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User2 className="w-14 h-14 text-gray-400" />
              )}
            </div>
          </div>
          <h4 className="font-bold text-gray-800 text-lg mt-3">{secretary.name}</h4>
          <p className="text-green-600 font-medium">{secretary.position}</p>
        </div>
      </div>
    </div>
  );
}