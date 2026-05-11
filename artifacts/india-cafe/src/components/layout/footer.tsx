import { Link } from "wouter";
import { MapPin, Phone, Clock } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-[#383E56] text-white py-16 mt-auto">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-12">
        <div>
          <h3 className="font-serif text-2xl font-bold mb-4 text-primary">India Cafe</h3>
          <p className="text-sm text-white/80 mb-4 leading-relaxed">
            Authentic Indian cuisine serving Fairfield and Iowa City since 1994. Savor authentic Indian flavors — freshly made every day.
          </p>
        </div>
        <div>
          <h4 className="font-sans font-bold mb-6 uppercase tracking-wider text-sm text-primary">Quick Links</h4>
          <ul className="space-y-3 text-sm text-white/80">
            <li><Link href="/" className="hover:text-primary transition-colors">Home</Link></li>
            <li><Link href="/menu" className="hover:text-primary transition-colors">Menu</Link></li>
            <li><Link href="/about" className="hover:text-primary transition-colors">About Us</Link></li>
            <li><Link href="/testimonials" className="hover:text-primary transition-colors">Testimonials</Link></li>
            <li><Link href="/contact" className="hover:text-primary transition-colors">Contact</Link></li>
            <li><Link href="/track" className="hover:text-primary transition-colors">Track Order</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-sans font-bold mb-6 uppercase tracking-wider text-sm text-primary">Fairfield Location</h4>
          <ul className="space-y-4 text-sm text-white/80">
            <li className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <span>50 W Burlington Ave<br />Fairfield, IA 52556</span>
            </li>
            <li className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-primary shrink-0" />
              <span>(641) 472-1792</span>
            </li>
            <li className="flex items-start gap-3">
              <Clock className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <span>Mon-Sat: 11am - 9pm<br />Sun: Closed</span>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="font-sans font-bold mb-6 uppercase tracking-wider text-sm text-primary">Iowa City Location</h4>
          <ul className="space-y-4 text-sm text-white/80">
            <li className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <span>227 E Washington St<br />Iowa City, IA 52240</span>
            </li>
            <li className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-primary shrink-0" />
              <span>(319) 354-2775</span>
            </li>
            <li className="flex items-start gap-3">
              <Clock className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <span>Mon-Sun: 11am - 10pm</span>
            </li>
          </ul>
        </div>
      </div>
      <div className="container mx-auto px-4 mt-16 pt-8 border-t border-white/10 text-center text-sm text-white/60">
        &copy; {new Date().getFullYear()} India Cafe. All rights reserved.
      </div>
    </footer>
  );
}
