import { ArrowLeft, Award } from "lucide-react";
import { Link } from "wouter";
import "@/components/free-learning.css";

export default function FreeCertificatePage() {
  return <main className="free-page"><Link href="/" className="free-back"><ArrowLeft size={16} /> Сургалтын төв рүү буцах</Link><section className="free-empty-card"><Award size={34} /><p className="section-kicker">OPEN LEARNING</p><h1>Бүх lesson шууд нээлттэй.</h1><p>CodeCraft Academy нь чөлөөт суралцах орчин тул lesson, exercise, quiz, sandbox болон Practice Guide бүрийг дуртай дарааллаар ашиглана.</p><Link href="/" className="free-primary-link">Сургалтын замууд руу очих</Link></section></main>;
}
