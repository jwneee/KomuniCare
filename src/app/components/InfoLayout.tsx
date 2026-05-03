import { Outlet, Link, useNavigate } from "react-router";
import { Facebook, Twitter, Instagram, Phone, Mail, Menu, X, ChevronDown } from "lucide-react";
import { useState } from "react";

export function InfoLayout() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoginDropdownOpen, setIsLoginDropdownOpen] = useState(false);

  const handleNavigateAndScroll = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>, targetId: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    
    if (window.location.pathname !== "/") {
      navigate("/");
      setTimeout(() => {
        const target = document.querySelector(targetId);
        if (target) {
          const targetPosition = target.getBoundingClientRect().top + window.pageYOffset;
          const offsetPosition = targetPosition - 80;
          window.scrollTo({ top: offsetPosition, behavior: "smooth" });
        }
      }, 100);
    } else {
      const target = document.querySelector(targetId);
      if (target) {
        const targetPosition = target.getBoundingClientRect().top + window.pageYOffset;
        const offsetPosition = targetPosition - 80;
        window.scrollTo({ top: offsetPosition, behavior: "smooth" });
      }
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Bar */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo / Brand */}
            <Link to="/" className="flex items-center gap-3">
              <img 
                src="/logo.png" 
                alt="Barangay New Kalalake Health Center Logo"
                className="w-12 h-12 object-contain rounded-full"
              />
              <div className="flex flex-col">
                <span className="font-bold text-xl text-gray-900 tracking-tight">KomuniCare</span>
                <p className="text-xs text-gray-500 hidden sm:block">Barangay New Kalalake Health Center</p>
              </div>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <a 
                href="/#home" 
                onClick={(e) => handleNavigateAndScroll(e, "#home")} 
                className="text-gray-600 hover:text-green-600 transition font-medium text-sm"
              >
                Home
              </a>
              <a 
                href="/#about" 
                onClick={(e) => handleNavigateAndScroll(e, "#about")} 
                className="text-gray-600 hover:text-green-600 transition font-medium text-sm"
              >
                About
              </a>
              <a 
                href="/#services" 
                onClick={(e) => handleNavigateAndScroll(e, "#services")} 
                className="text-gray-600 hover:text-green-600 transition font-medium text-sm"
              >
                Services
              </a>
              <a 
                href="/#contact" 
                onClick={(e) => handleNavigateAndScroll(e, "#contact")} 
                className="text-gray-600 hover:text-green-600 transition font-medium text-sm"
              >
                Contact
              </a>
              
              {/* Resources Dropdown */}
              <div className="relative group">
                <button className="flex items-center gap-1 text-gray-600 hover:text-green-600 transition font-medium text-sm">
                  Resources <ChevronDown className="w-3 h-3" />
                </button>
                <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <Link to="/about-barangay" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-green-600 rounded-t-lg">
                    About Our Barangay
                  </Link>
                  <Link to="/barangay-officials" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-green-600">
                    Barangay Officials
                  </Link>
                  <Link to="/bhw-list" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-green-600">
                    Barangay Health Workers
                  </Link>
                  <Link to="/privacy-policy" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-green-600">
                    Privacy Policy
                  </Link>
                  <Link to="/terms" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-green-600 rounded-b-lg border-t border-gray-100">
                    Terms & Conditions
                  </Link>
                </div>
              </div>

              {/* Login Dropdown */}
              <div 
                className="relative"
                onMouseEnter={() => setIsLoginDropdownOpen(true)}
                onMouseLeave={() => setIsLoginDropdownOpen(false)}
              >
                <button className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-full transition font-medium text-sm">
                  Login <ChevronDown className="w-3 h-3" />
                </button>
                {isLoginDropdownOpen && (
                  <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-100 z-50">
                    <button
                      onClick={() => navigate("/resident/signin")}
                      className="w-full text-left px-5 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600 rounded-t-lg transition"
                    >
                      Login as Resident
                    </button>
                    <button
                      onClick={() => navigate("/bhw/signin")}
                      className="w-full text-left px-5 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600 rounded-b-lg transition border-t border-gray-100"
                    >
                      Login as Health Worker
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition"
            >
              {mobileMenuOpen ? <X className="w-6 h-6 text-gray-600" /> : <Menu className="w-6 h-6 text-gray-600" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-20 left-0 right-0 bg-white shadow-lg border-b border-gray-100 z-40">
            <div className="flex flex-col py-2">
              <a href="/#home" onClick={(e) => handleNavigateAndScroll(e, "#home")} className="px-6 py-3 text-gray-600 hover:bg-gray-50 hover:text-green-600 transition">Home</a>
              <a href="/#about" onClick={(e) => handleNavigateAndScroll(e, "#about")} className="px-6 py-3 text-gray-600 hover:bg-gray-50 hover:text-green-600 transition">About</a>
              <a href="/#services" onClick={(e) => handleNavigateAndScroll(e, "#services")} className="px-6 py-3 text-gray-600 hover:bg-gray-50 hover:text-green-600 transition">Services</a>
              <a href="/#contact" onClick={(e) => handleNavigateAndScroll(e, "#contact")} className="px-6 py-3 text-gray-600 hover:bg-gray-50 hover:text-green-600 transition">Contact</a>
              <Link to="/about-barangay" onClick={() => setMobileMenuOpen(false)} className="px-6 py-3 text-gray-600 hover:bg-gray-50 hover:text-green-600 transition">About Our Barangay</Link>
              <Link to="/barangay-officials" onClick={() => setMobileMenuOpen(false)} className="px-6 py-3 text-gray-600 hover:bg-gray-50 hover:text-green-600 transition">Barangay Officials</Link>
              <Link to="/bhw-list" onClick={() => setMobileMenuOpen(false)} className="px-6 py-3 text-gray-600 hover:bg-gray-50 hover:text-green-600 transition">Barangay Health Workers</Link>
              <Link to="/privacy-policy" onClick={() => setMobileMenuOpen(false)} className="px-6 py-3 text-gray-600 hover:bg-gray-50 hover:text-green-600 transition">Privacy Policy</Link>
              <Link to="/terms" onClick={() => setMobileMenuOpen(false)} className="px-6 py-3 text-gray-600 hover:bg-gray-50 hover:text-green-600 transition border-t border-gray-100 mt-1">Terms & Conditions</Link>
              
              {/* Mobile Login Options */}
              <div className="border-t border-gray-100 mt-2 pt-2">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate("/resident/signin");
                  }}
                  className="w-full text-left px-6 py-3 text-green-600 font-medium hover:bg-green-50 transition"
                >
                  Login as Resident
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate("/bhw/signin");
                  }}
                  className="w-full text-left px-6 py-3 text-green-600 font-medium hover:bg-green-50 transition"
                >
                  Login as Health Worker
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      <main>
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-12 pb-8 border-b border-gray-800">
            
            {/* Column 1: Barangay Info */}
            <div>
              <Link to="/" className="flex items-center gap-3 mb-4">
                <img 
                  src="/logo.png" 
                  alt="Logo" 
                  className="w-10 h-10 object-contain rounded-full bg-white p-1"
                />
                <span className="font-bold text-white text-xl">KomuniCare</span>
              </Link>
              <p className="text-sm text-gray-400 mb-4 leading-relaxed">
                Barangay New Kalalake Health Center — providing quality healthcare services to every resident.
              </p>
              <div className="flex gap-4">
                <a 
                  href="https://www.facebook.com/profile.php?id=100065236850871" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-white transition"
                >
                  <Facebook className="w-5 h-5" />
                </a>
                <Twitter className="w-5 h-5 hover:text-white cursor-pointer transition" />
                <Instagram className="w-5 h-5 hover:text-white cursor-pointer transition" />
              </div>
            </div>

            {/* Column 2: Quick Links */}
            <div>
              <h4 className="text-white font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="/#home" onClick={(e) => handleNavigateAndScroll(e, "#home")} className="hover:text-white transition block">Home</a></li>
                <li><a href="/#about" onClick={(e) => handleNavigateAndScroll(e, "#about")} className="hover:text-white transition block">About Us</a></li>
                <li><a href="/#services" onClick={(e) => handleNavigateAndScroll(e, "#services")} className="hover:text-white transition block">Services</a></li>
                <li><a href="/#contact" onClick={(e) => handleNavigateAndScroll(e, "#contact")} className="hover:text-white transition block">Contact</a></li>
                <li><Link to="/privacy-policy" className="hover:text-white transition block">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-white transition block">Terms & Conditions</Link></li>
              </ul>
            </div>

            {/* Column 3: Quick Contact */}
            <div>
              <h4 className="text-white font-semibold mb-4">Quick Contact</h4>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-3">
                  <Phone className="w-4 h-4 flex-shrink-0" />
                  <span>047 224-8264</span>
                </li>
                <li className="flex items-center gap-3">
                  <Mail className="w-4 h-4 flex-shrink-0" />
                  <span>healthcenter@newkalalake.gov.ph</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Copyright */}
          <div className="pt-8 text-center text-xs text-gray-500">
            <p>&copy; 2026 Barangay New Kalalake Health Center. All rights reserved.</p>
            <p className="mt-1">Powered by KomuniCare</p>
          </div>
        </div>
      </footer>
    </div>
  );
}