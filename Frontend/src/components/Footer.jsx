import React from "react";
import { UtensilsCrossed, Heart } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-[#B85C3B] text-[#F0EAF8] mt-20 border-t border-[#B85C3B]/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-[#B9A7E0] flex items-center justify-center text-[#B85C3B]">
                <UtensilsCrossed className="w-5 h-5" />
              </div>
              <span className="text-xl font-black text-[#FFFDF7] tracking-tight">Food Wave</span>
            </div>
            <p className="text-xs text-[#B9A7E0] leading-relaxed">
              Bringing delicious restaurant meals directly to your doorstep with speed and smile.
            </p>
          </div>

          <div>
            <h4 className="text-[#FFFDF7] font-bold mb-4 text-xs tracking-wider uppercase">Quick Links</h4>
            <ul className="space-y-2.5 text-xs text-[#F0EAF8]/80">
              <li><a href="#" className="hover:text-[#B9A7E0] transition">About Us</a></li>
              <li><a href="#" className="hover:text-[#B9A7E0] transition">Browse Restaurants</a></li>
              <li><a href="#" className="hover:text-[#B9A7E0] transition">Popular Cuisines</a></li>
              <li><a href="#" className="hover:text-[#B9A7E0] transition">Special Offers</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-[#FFFDF7] font-bold mb-4 text-xs tracking-wider uppercase">Contact & Support</h4>
            <ul className="space-y-2.5 text-xs text-[#F0EAF8]/80">
              <li>Help & Support</li>
              <li>Partner with Us</li>
              <li>Ride with Us</li>
              <li>Terms & Privacy Policy</li>
            </ul>
          </div>

          <div>
            <h4 className="text-[#FFFDF7] font-bold mb-4 text-xs tracking-wider uppercase">Cities We Deliver To</h4>
            <div className="flex flex-wrap gap-2 text-xs">
              {["Mumbai", "Delhi", "Bengaluru", "Pune", "Hyderabad", "Chennai", "Kolkata"].map((city) => (
                <span key={city} className="bg-[#292329] text-[#B9A7E0] px-2.5 py-1 rounded-md text-[11px] font-semibold">
                  {city}
                </span>
              ))}
            </div>
          </div>

        </div>

        <div className="mt-12 pt-8 border-t border-[#FFFDF7]/10 flex flex-col sm:flex-row items-center justify-between text-xs text-[#B9A7E0]">
          <p>© {new Date().getFullYear()} Food Wave. All rights reserved.</p>
          <p className="flex items-center mt-2 sm:mt-0">
            Made with <Heart className="w-3.5 h-3.5 text-[#B9A7E0] mx-1 fill-current" /> for food lovers everywhere.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
