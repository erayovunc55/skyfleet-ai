import welcomeImage from "../assets/premium/hero-experience-v1.png";
import executiveImage from "../assets/premium/service-eclass.jpg";
import "../styles/about-experience.css";

const Arrow = () => <span aria-hidden="true">↗</span>;

export default function AboutExperience({ language }) {
  const tr = language === "tr";
  const values = tr ? [
    ["01", "Özenli planlama", "Alış noktası, varış adresi, saat ve araç tercihi. Yolculuğunuzun ayrıntılarını bir araya getirerek operasyon ekibine aktarırız."],
    ["02", "Yerel uzmanlık", "Yolcuları, seyahat acentalarını ve yerel ulaşım tedarikçilerini aynı platformda buluştururuz. Her rotayı kendi ihtiyaçlarıyla değerlendiririz."],
    ["03", "Açık iletişim", "Rezervasyon talebinden operasyon teyidine kadar anlaşılır bir süreç sunarız. Özel ihtiyaçlarınızı planın bir parçası haline getiririz."],
  ] : [
    ["01", "Considered planning", "Your pick-up point, destination, time and vehicle preference. We bring the details together for our operations team to plan your journey."],
    ["02", "Local expertise", "We connect passengers, travel agencies and local transport suppliers on one platform, considering each route and its requirements."],
    ["03", "Clear communication", "From your booking request to operational confirmation, we keep the process easy to follow and make your individual needs part of the plan."],
  ];
  const steps = tr ? [
    ["Rotanızı paylaşın", "Adreslerinizi listeden seçin; tarih, saat ve yolcu bilgilerinizi ekleyin."],
    ["Tercihinizi belirleyin", "Uygun rotalardaki araç fiyatlarını inceleyin veya özel bir teklif talep edin."],
    ["Teyidinizi alın", "Operasyon ekibi talebinizi, araç uygunluğunu ve özel ihtiyaçlarınızı değerlendirip teyit eder."],
  ] : [
    ["Share your route", "Choose your locations from the suggestions and add your date, time and passenger details."],
    ["Choose your preference", "Review vehicle quotes for eligible routes or request a tailored quote."],
    ["Receive confirmation", "Our operations team reviews your request, vehicle availability and individual needs before confirming."],
  ];

  return (
    <main className="sky-about">
      <section className="sky-about-hero" aria-labelledby="about-title">
        <div className="sky-container sky-about-hero-grid">
          <div className="sky-about-hero-copy">
            <span className="sky-eyebrow"><i /> {tr ? "SKYFLEET HAKKINDA" : "ABOUT SKYFLEET"}</span>
            <h1 id="about-title">{tr ? <>Her yolculuk,<br /><em>özenle başlar.</em></> : <>Every journey.<br /><em>Thoughtfully begun.</em></>}</h1>
            <p>{tr ? "Havalimanından şehre, iş seyahatinden özel bir güne. SKYFLEET, yolculuğunuzun ayrıntılarını profesyonel ulaşım ekipleriyle bir araya getirir." : "From airport arrivals to business trips and special occasions. SKYFLEET brings the details of your journey together with professional transport teams."}</p>
            <a className="sky-about-button" href="/transfer">{tr ? "Yolculuğunuzu planlayın" : "Plan your journey"}<Arrow /></a>
            <a className="sky-about-discover" href="#our-approach">{tr ? "Yaklaşımımızı keşfedin" : "Discover our approach"}<span aria-hidden="true">↓</span></a>
          </div>
          <figure className="sky-about-hero-image">
            <img src={welcomeImage} alt={tr ? "Havalimanında özel araçla karşılama deneyimini temsil eden görsel" : "Illustration of a private chauffeur welcome at the airport"} fetchPriority="high" />
            <figcaption><span>SKYFLEET</span>{tr ? "İlk karşılamadan son varışa." : "From the first welcome to the final arrival."}</figcaption>
          </figure>
        </div>
      </section>

      <section id="our-approach" className="sky-container sky-about-section sky-about-intro" aria-labelledby="approach-title">
        <div><span className="sky-eyebrow">{tr ? "YAKLAŞIMIMIZ" : "OUR APPROACH"}</span><h2 id="approach-title">{tr ? <>Yolculuğun merkezinde<br />siz varsınız.</> : <>A journey built<br />around you.</>}</h2></div>
        <div className="sky-about-intro-copy"><p className="sky-about-lead">{tr ? "İyi bir transfer deneyimi, doğru aracın ötesinde iyi bir planlama ve açık iletişim gerektirir." : "A good transfer experience begins with more than the right vehicle. It takes thoughtful planning and clear communication."}</p><p>{tr ? "SKYFLEET; havalimanı transferleri, iş seyahatleri ve özel yolculuklar için yolcuları, acentaları ve tedarikçileri tek bir operasyon akışında buluşturur. Teknoloji ayrıntıları düzenler; operasyon ekibi yolculuğunuzu değerlendirir ve teyit eder." : "SKYFLEET connects passengers, agencies and suppliers in one operational flow for airport transfers, business travel and private journeys. Technology organizes the details; our operations team reviews and confirms your journey."}</p></div>
      </section>

      <section className="sky-about-values" aria-labelledby="values-title"><div className="sky-container sky-about-section">
        <div className="sky-about-section-heading"><span className="sky-eyebrow">{tr ? "BİZİM İÇİN ÖNEMLİ OLAN" : "WHAT MATTERS TO US"}</span><h2 id="values-title">{tr ? "Her ayrıntıda aynı özen." : "The same care, in every detail."}</h2></div>
        <div className="sky-about-value-grid">{values.map(([number, title, text]) => <article key={number}><span className="sky-about-number">{number}</span><h3>{title}</h3><p>{text}</p></article>)}</div>
      </div></section>

      <section className="sky-container sky-about-section sky-about-journey" aria-labelledby="journey-title">
        <figure className="sky-about-detail-image"><img src={executiveImage} alt={tr ? "Şehir yolculuğu için executive sınıfı araç" : "An executive vehicle for a city journey"} loading="lazy" /><figcaption>{tr ? "Konfor, yolculuğun bir parçasıdır." : "Comfort is part of the journey."}</figcaption></figure>
        <div><span className="sky-eyebrow">{tr ? "NASIL ÇALIŞIYORUZ" : "HOW WE WORK"}</span><h2 id="journey-title">{tr ? "Talebinizden teyidinize, anlaşılır bir süreç." : "A clear path from request to confirmation."}</h2><ol className="sky-about-steps">{steps.map(([title, text], index) => <li key={title}><span aria-hidden="true">0{index + 1}</span><div><h3>{title}</h3><p>{text}</p></div></li>)}</ol></div>
      </section>

      <section className="sky-about-network" aria-labelledby="network-title"><div className="sky-container sky-about-section sky-about-network-grid">
        <div><span className="sky-eyebrow">{tr ? "BİRLİKTE DAHA İLERİYE" : "GO FURTHER, TOGETHER"}</span><h2 id="network-title">{tr ? "Yolcular, acentalar ve ulaşım ekipleri. Tek bir ağ." : "Passengers, agencies and transport teams. One network."}</h2><p>{tr ? "Seyahat planlarınızı ve yerel ulaşım uzmanlığını aynı platformda buluşturuyoruz. İster bir yolculuk planlayın ister iş ortağı olarak katılın." : "We bring travel plans and local transport expertise together on one platform. Plan a journey or become part of our partner network."}</p></div>
        <div className="sky-about-network-links">
          <a href="/transfer"><div><small>{tr ? "YOLCULAR İÇİN" : "FOR PASSENGERS"}</small><strong>{tr ? "Size özel bir yolculuk" : "A journey made for you"}</strong></div><Arrow /></a>
          <a href="/agency/join"><div><small>{tr ? "SEYAHAT ACENTALARI İÇİN" : "FOR TRAVEL AGENCIES"}</small><strong>{tr ? "Birlikte planlayalım" : "Let’s plan together"}</strong></div><Arrow /></a>
          <a href="/supplier/join"><div><small>{tr ? "ULAŞIM TEDARİKÇİLERİ İÇİN" : "FOR TRANSPORT SUPPLIERS"}</small><strong>{tr ? "Ağımıza katılın" : "Join our network"}</strong></div><Arrow /></a>
        </div>
      </div></section>

      <section className="sky-container sky-about-section sky-about-final" aria-labelledby="about-cta-title"><span className="sky-eyebrow">{tr ? "BİR SONRAKİ YOLCULUĞUNUZ" : "YOUR NEXT JOURNEY"}</span><h2 id="about-cta-title">{tr ? "Güzel bir başlangıç yapalım." : "Let’s make a good beginning."}</h2><p>{tr ? "Rotanızı paylaşın. Ayrıntıları birlikte planlayalım." : "Share your route. Let’s take care of the details."}</p><a className="sky-about-button" href="/transfer">{tr ? "Transfer planlayın" : "Plan a transfer"}<Arrow /></a></section>
    </main>
  );
}
