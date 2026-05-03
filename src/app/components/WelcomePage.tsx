import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router";
import { Button } from "./ui/button";
import { Phone, Mail, MapPin, Clock, Facebook, Twitter, Instagram, Menu, X, ChevronDown, ChevronLeft, ChevronRight, Calendar, Megaphone, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { db } from "../firebase";
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";

interface Announcement {
  id: string;
  title: string;
  content: string;
  fullContent?: string;
  imageUrl: string;
  type: "health_advisory" | "event" | "vaccination" | "general";
  date: Date;
  createdAt: any;
  active: boolean;
  link?: string;
  contactInfo?: string;
}

const typeColors = {
  health_advisory: { bg: "bg-blue-100", text: "text-blue-700", label: "Health Advisory" },
  event: { bg: "bg-green-100", text: "text-green-700", label: "Event" },
  vaccination: { bg: "bg-purple-100", text: "text-purple-700", label: "Vaccination" },
  general: { bg: "bg-gray-100", text: "text-gray-700", label: "General" },
};

export function WelcomePage() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      const q = query(
        collection(db, "announcements"),
        where("active", "==", true),
        orderBy("createdAt", "desc"),
        limit(10)
      );
      const snapshot = await getDocs(q);
      const announcementsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate?.() || new Date(doc.data().date),
      } as Announcement));
      setAnnouncements(announcementsList);
    } catch (error) {
      console.error("Error loading announcements:", error);
    } finally {
      setLoading(false);
    }
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % announcements.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + announcements.length) % announcements.length);
  };

  const openReadMore = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setModalOpen(true);
  };

  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>, targetId: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const target = document.querySelector(targetId);
    if (target) {
      const targetPosition = target.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = targetPosition - 80;
      window.scrollTo({ top: offsetPosition, behavior: "smooth" });
    }
  };

  const services = [
    {
      title: "General Check-up",
      description: "Complete health assessment, vital signs monitoring, and preventive care consultation.",
      image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&h=400&fit=crop",
      alt: "Doctor checking patient"
    },
    {
      title: "Vaccination Center",
      description: "Immunization programs for children, adults, and seniors. Free vaccines available.",
      image: "https://images.unsplash.com/photo-1581595219315-a187dd40c322?w=600&h=400&fit=crop",
      alt: "Vaccination process"
    },
    {
      title: "Blood Pressure Check",
      description: "Free blood pressure monitoring with health counseling and referrals if needed.",
      image: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=600&h=400&fit=crop",
      alt: "Blood pressure monitoring"
    },
    {
      title: "Maternal & Child Care",
      description: "Prenatal check-ups, postnatal care, and child health monitoring.",
      image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&h=400&fit=crop",
      alt: "Mother and baby care"
    },
    {
      title: "Dental Care",
      description: "Basic dental services, tooth extraction, and oral health education.",
      image: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=600&h=400&fit=crop",
      alt: "Dental checkup"
    },
    {
      title: "Emergency Response",
      description: "24/7 emergency hotline and immediate response to health emergencies.",
      image: "https://images.unsplash.com/photo-1516841273335-e39b37888115?w=600&h=400&fit=crop",
      alt: "Emergency response team"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Bar */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link to="/" className="flex items-center gap-3">
              <img src="/logo.png" alt="Logo" className="w-12 h-12 object-contain rounded-full" />
              <div className="flex flex-col">
                <span className="font-bold text-xl text-gray-900 tracking-tight">KomuniCare</span>
                <p className="text-xs text-gray-500">Barangay New Kalalake Health Center</p>
              </div>
            </Link>
            
            <div className="hidden md:flex items-center gap-8">
              <a href="#home" onClick={(e) => handleScroll(e, "#home")} className="text-gray-600 hover:text-green-600 transition font-medium text-sm">Home</a>
              <a href="#about" onClick={(e) => handleScroll(e, "#about")} className="text-gray-600 hover:text-green-600 transition font-medium text-sm">About</a>
              <a href="#services" onClick={(e) => handleScroll(e, "#services")} className="text-gray-600 hover:text-green-600 transition font-medium text-sm">Services</a>
              <a href="#contact" onClick={(e) => handleScroll(e, "#contact")} className="text-gray-600 hover:text-green-600 transition font-medium text-sm">Contact</a>
              
              {/* Resources Dropdown */}
              <div className="relative group">
                <button className="flex items-center gap-1 text-gray-600 hover:text-green-600 transition font-medium text-sm">
                  Resources <ChevronDown className="w-3 h-3" />
                </button>
                <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <Link to="/about-barangay" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-green-600 rounded-t-lg">About Our Barangay</Link>
                  <Link to="/barangay-officials" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-green-600">Barangay Officials</Link>
                  <Link to="/bhw-list" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-green-600">Barangay Health Workers</Link>
                  <Link to="/privacy-policy" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-green-600">Privacy Policy</Link>
                  <Link to="/terms" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-green-600 rounded-b-lg border-t border-gray-100">Terms & Conditions</Link>
                </div>
              </div>

              {/* Login Dropdown */}
              <div className="relative group">
                <button className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-full transition font-medium text-sm">
                  Login <ChevronDown className="w-3 h-3" />
                </button>
                <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <button onClick={() => navigate("/resident/signin")} className="w-full text-left px-5 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600 rounded-t-lg transition">Login as Resident</button>
                  <button onClick={() => navigate("/bhw/signin")} className="w-full text-left px-5 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600 rounded-b-lg transition border-t border-gray-100">Login as Health Worker</button>
                </div>
              </div>
            </div>

            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition">
              {mobileMenuOpen ? <X className="w-6 h-6 text-gray-600" /> : <Menu className="w-6 h-6 text-gray-600" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden absolute top-20 left-0 right-0 bg-white shadow-lg border-b border-gray-100 z-40">
            <div className="flex flex-col py-2">
              <a href="#home" onClick={(e) => handleScroll(e, "#home")} className="px-6 py-3 text-gray-600 hover:bg-gray-50 hover:text-green-600 transition">Home</a>
              <a href="#about" onClick={(e) => handleScroll(e, "#about")} className="px-6 py-3 text-gray-600 hover:bg-gray-50 hover:text-green-600 transition">About</a>
              <a href="#services" onClick={(e) => handleScroll(e, "#services")} className="px-6 py-3 text-gray-600 hover:bg-gray-50 hover:text-green-600 transition">Services</a>
              <a href="#contact" onClick={(e) => handleScroll(e, "#contact")} className="px-6 py-3 text-gray-600 hover:bg-gray-50 hover:text-green-600 transition">Contact</a>
              <Link to="/about-barangay" onClick={() => setMobileMenuOpen(false)} className="px-6 py-3 text-gray-600 hover:bg-gray-50 hover:text-green-600 transition">About Our Barangay</Link>
              <Link to="/barangay-officials" onClick={() => setMobileMenuOpen(false)} className="px-6 py-3 text-gray-600 hover:bg-gray-50 hover:text-green-600 transition">Barangay Officials</Link>
              <Link to="/bhw-list" onClick={() => setMobileMenuOpen(false)} className="px-6 py-3 text-gray-600 hover:bg-gray-50 hover:text-green-600 transition">Barangay Health Workers</Link>
              <Link to="/privacy-policy" onClick={() => setMobileMenuOpen(false)} className="px-6 py-3 text-gray-600 hover:bg-gray-50 hover:text-green-600 transition">Privacy Policy</Link>
              <Link to="/terms" onClick={() => setMobileMenuOpen(false)} className="px-6 py-3 text-gray-600 hover:bg-gray-50 hover:text-green-600 transition border-t border-gray-100 mt-1">Terms & Conditions</Link>
              
              <div className="border-t border-gray-100 mt-2 pt-2">
                <button onClick={() => { setMobileMenuOpen(false); navigate("/resident/signin"); }} className="w-full text-left px-6 py-3 text-green-600 font-medium hover:bg-green-50 transition">Login as Resident</button>
                <button onClick={() => { setMobileMenuOpen(false); navigate("/bhw/signin"); }} className="w-full text-left px-6 py-3 text-green-600 font-medium hover:bg-green-50 transition">Login as Health Worker</button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section id="home" className="relative min-h-screen bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('https://images.unsplash.com/photo-1584515933487-779824d29309?w=1920&h=1080&fit=crop')` }}>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center px-4">
          <div className="mb-6"><img src="/logo.png" alt="Logo" className="w-28 h-28 object-contain mx-auto rounded-full shadow-lg" /></div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-4">CARING FOR THE COMMUNITY</h1>
          <p className="text-lg md:text-2xl">Dedicated to residents of New Kalalake</p>
        </div>
      </section>

      {/* Announcements Carousel */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">News & Announcements</h2>
            <div className="w-16 h-1 bg-green-600 mx-auto rounded-full"></div>
            <p className="text-gray-500 mt-4">Stay updated with the latest health news and events</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div></div>
          ) : announcements.length === 0 ? (
            <div className="text-center py-12 text-gray-400">No announcements yet. Check back later!</div>
          ) : (
            <div className="relative">
              <div className="overflow-hidden rounded-2xl">
                <div className="flex transition-transform duration-500 ease-out" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
                  {announcements.map((announcement) => {
                    const typeStyle = typeColors[announcement.type] || typeColors.general;
                    return (
                      <div key={announcement.id} className="w-full flex-shrink-0">
                        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                          {announcement.imageUrl && (
                            <div className="h-64 md:h-80 overflow-hidden">
                              <img 
                                src={announcement.imageUrl} 
                                alt={announcement.title} 
                                className="w-full h-full object-cover" 
                              />
                            </div>
                          )}
                          <div className="p-6 md:p-8">
                            <div className="flex flex-wrap items-center gap-3 mb-4">
                              <span className={`text-xs px-3 py-1 rounded-full ${typeStyle.bg} ${typeStyle.text}`}>{typeStyle.label}</span>
                              <span className="text-sm text-gray-400 flex items-center gap-1"><Calendar className="w-4 h-4" />{new Date(announcement.date).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })}</span>
                            </div>
                            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">{announcement.title}</h3>
                            <p className="text-gray-600 leading-relaxed line-clamp-3">{announcement.fullContent || announcement.content}</p>
                            <button onClick={() => openReadMore(announcement)} className="mt-4 text-green-600 font-medium hover:text-green-700 transition flex items-center gap-1">
                              Read more <ExternalLink className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {announcements.length > 1 && (
                <>
                  <button onClick={prevSlide} className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg"><ChevronLeft className="w-6 h-6 text-gray-600" /></button>
                  <button onClick={nextSlide} className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg"><ChevronRight className="w-6 h-6 text-gray-600" /></button>
                </>
              )}

              {announcements.length > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                  {announcements.map((_, index) => (
                    <button key={index} onClick={() => setCurrentSlide(index)} className={`w-2 h-2 rounded-full transition-all ${index === currentSlide ? "w-6 bg-green-600" : "bg-gray-300"}`} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Read More Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedAnnouncement && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">{selectedAnnouncement.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {selectedAnnouncement.imageUrl && (
                  <div className="rounded-lg overflow-hidden bg-gray-100 flex justify-center">
                    <img 
                      src={selectedAnnouncement.imageUrl} 
                      alt={selectedAnnouncement.title}
                      className="w-full max-h-[400px] object-contain" 
                    />
                  </div>
                )}
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`text-xs px-3 py-1 rounded-full ${typeColors[selectedAnnouncement.type]?.bg || "bg-gray-100"} ${typeColors[selectedAnnouncement.type]?.text || "text-gray-700"}`}>
                    {typeColors[selectedAnnouncement.type]?.label || "General"}
                  </span>
                  <span className="text-sm text-gray-400 flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(selectedAnnouncement.date).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })}
                  </span>
                </div>
                <div className="prose max-w-none">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{selectedAnnouncement.fullContent || selectedAnnouncement.content}</p>
                </div>
                {selectedAnnouncement.link && (
                  <a href={selectedAnnouncement.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-medium">
                    Report an issue here <ExternalLink className="w-4 h-4" />
                  </a>
                )}
                {selectedAnnouncement.contactInfo && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">{selectedAnnouncement.contactInfo}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* About Us Section */}
      <section id="about" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">About Us</h2>
            <div className="w-16 h-1 bg-green-600 mx-auto rounded-full"></div>
          </div>
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-gray-600 text-lg leading-relaxed">The Barangay New Kalalake Health Center is dedicated to providing accessible, quality healthcare services to all residents of our community. We believe that good health is a right, not a privilege.</p>
            <p className="text-gray-600 text-lg leading-relaxed mt-6">Our team of skilled healthcare professionals works tirelessly to ensure that every patient receives compassionate, comprehensive care. From general check-ups to vaccinations and maternal care, we are here for you.</p>
            <p className="text-gray-600 text-lg leading-relaxed mt-6">We are committed to promoting health and wellness in the community through education, preventive care, and responsive medical services.</p>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Our Services</h2>
            <div className="w-16 h-1 bg-green-600 mx-auto rounded-full"></div>
            <p className="text-gray-500 mt-4 text-lg">Comprehensive Healthcare for Everyone</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <div key={index} className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 group">
                <div className="h-56 overflow-hidden"><img src={service.image} alt={service.alt} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /></div>
                <div className="p-6"><h3 className="text-xl font-semibold text-gray-900 mb-2">{service.title}</h3><p className="text-gray-500 leading-relaxed">{service.description}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Our Location</h2>
            <div className="w-16 h-1 bg-green-600 mx-auto rounded-full"></div>
            <p className="text-gray-500 mt-4">Visit us at Barangay New Kalalake Health Center</p>
          </div>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="rounded-2xl overflow-hidden shadow-lg border border-gray-100">
              <iframe src="https://www.google.com/maps/embed?pb=!4v1777221291345!6m8!1m7!1sNDEqslvHJ7-wMBn7yM8yTQ!2m2!1d14.83097358465975!2d120.2890180879222!3f136.17856904107464!4f5.770855429113169!5f0.7820865974627469" width="100%" height="320" style={{ border: 0 }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="Barangay New Kalalake Health Center Map" className="w-full"></iframe>
            </div>
            <div className="space-y-6">
              <div className="flex items-start gap-4"><MapPin className="w-6 h-6 text-green-600 mt-1" /><div><h3 className="font-semibold text-gray-900">Address</h3><p className="text-gray-500">Ground Floor Barangay New Kalalake Multi Purpose Hall, 14th St. Corner Murphy Street, New Kalalake, Olongapo City</p></div></div>
              <div className="flex items-start gap-4"><Phone className="w-6 h-6 text-green-600 mt-1" /><div><h3 className="font-semibold text-gray-900">Contact Numbers</h3><p className="text-gray-500">047 224-8264</p><p className="text-gray-500">Mobile: 0907 265 0471</p><p className="text-gray-500 font-semibold text-green-600">Emergency: 0917-987-6543</p></div></div>
              <div className="flex items-start gap-4"><Clock className="w-6 h-6 text-green-600 mt-1" /><div><h3 className="font-semibold text-gray-900">Working Hours</h3><p className="text-gray-500">Monday - Friday: 8:00 AM - 5:00 PM</p><p className="text-gray-500">Saturday: 8:00 AM - 12:00 PM</p><p className="text-gray-500">Sunday: Emergency Only</p></div></div>
              <Button onClick={() => window.open("https://maps.app.goo.gl/tMKXvCRT3jHxTsJ77", "_blank")} className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-full">Open in Google Maps →</Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-12 pb-8 border-b border-gray-800">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain rounded-full bg-white p-1" />
                <span className="font-bold text-white text-xl">KomuniCare</span>
              </div>
              <p className="text-sm text-gray-400 mb-4">Barangay New Kalalake Health Center — providing quality healthcare services to every resident.</p>
              <div className="flex gap-4">
                <a href="https://www.facebook.com/profile.php?id=100065236850871" target="_blank" rel="noopener noreferrer" className="hover:text-white transition"><Facebook className="w-5 h-5" /></a>
                <Twitter className="w-5 h-5 hover:text-white cursor-pointer transition" />
                <Instagram className="w-5 h-5 hover:text-white cursor-pointer transition" />
              </div>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#home" onClick={(e) => handleScroll(e, "#home")} className="hover:text-white transition block">Home</a></li>
                <li><a href="#about" onClick={(e) => handleScroll(e, "#about")} className="hover:text-white transition block">About Us</a></li>
                <li><a href="#services" onClick={(e) => handleScroll(e, "#services")} className="hover:text-white transition block">Services</a></li>
                <li><a href="#contact" onClick={(e) => handleScroll(e, "#contact")} className="hover:text-white transition block">Contact</a></li>
                <li><Link to="/privacy-policy" className="hover:text-white transition block">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-white transition block">Terms & Conditions</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Quick Contact</h4>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-3"><Phone className="w-4 h-4" /><span>047 224-8264</span></li>
                <li className="flex items-center gap-3"><Mail className="w-4 h-4" /><span>healthcenter@newkalalake.gov.ph</span></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 text-center text-xs text-gray-500">
            <p>&copy; 2026 Barangay New Kalalake Health Center. All rights reserved.</p>
            <p className="mt-1">Powered by KomuniCare</p>
          </div>
        </div>
      </footer>
    </div>
  );
}