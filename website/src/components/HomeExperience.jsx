import { useState } from "react";
import executiveImage from "../assets/premium/service-eclass.jpg";
import vanImage from "../assets/premium/service-vito.jpg";
import luxuryImage from "../assets/premium/service-sclass.jpg";

const Arrow = () => <span aria-hidden="true">↗</span>;

export default function HomeExperience({ language, booking }) {
  const tr = language === "tr";
  const [vehicle, setVehicle] = useState(0);
  const fleet = [
    { name: "Mercedes Vito", category: tr ? "BİRİNCİ SINIF VAN" : "FIRST CLASS VAN", image: vanImage, seats: "5–7", bags: "5–7", title: tr ? "Birlikte yolculuk, daha fazla konfor." : "More room. The same attention to detail.", text: tr ? "Aileler, arkadaş grupları ve iş seyahatleri için geniş bir kabin. Yolcularınız ve bagajlarınız için rahat bir transfer deneyimi." : "A spacious cabin for families, small groups and business travel. Room for your people, your luggage and a comfortable journey." },
    { name: "Mercedes E-Class", category: tr ? "EXECUTIVE SEDAN" : "EXECUTIVE SEDAN", image: executiveImage, seats: "1–3", bags: "2", title: tr ? "İşiniz kadar özenli bir yolculuk." : "A considered arrival, every time.", text: tr ? "İş görüşmeleri, havalimanı transferleri ve özel seyahatler için dengeli bir seçim. Sade bir zarafet ve sakin bir yolculuk." : "A refined choice for airport arrivals, business meetings and private travel. Understated elegance and a quieter way to get there." },
    { name: "Mercedes S-Class", category: tr ? "LÜKS SEDAN" : "LUXURY SEDAN", image: luxuryImage, seats: "1–3", bags: "2", title: tr ? "Yolculuğun her ayrıntısı size özel." : "Exceptional comfort. Quiet confidence.", text: tr ? "Özel konuklar ve üst düzey seyahatler için ferah bir arka kabin, özenli bir karşılama ve ayrıcalıklı bir transfer deneyimi." : "A generous rear cabin and an attentive arrival for special guests and executive journeys. Travel with space to relax and time to yourself." },
  ];
  const chosen = fleet[vehicle];
  const services = tr ? [
    ["01", "Havalimanı transferleri", "İlk karşılamadan son varışa kadar, yolculuğunuz bir arada planlanır.", vanImage],
    ["02", "İş seyahatleri", "Toplantılar, otel transferleri ve kurumsal konuklar için özenli ulaşım.", executiveImage],
    ["03", "Özel yolculuklar", "Şehirlerarası ve özel seyahat ihtiyaçlarınız için transfer talebinizi iletin.", luxuryImage],
  ] : [
    ["01", "Airport transfers", "From the first welcome to the final arrival, your journey is thoughtfully arranged.", vanImage],
    ["02", "Business travel", "Considered transportation for meetings, hotel transfers and corporate guests.", executiveImage],
    ["03", "Private journeys", "Request a transfer for intercity travel, special occasions and your own itinerary.", luxuryImage],
  ];
  const faq = tr ? [
    ["Transferimi nasıl rezerve ederim?", "Alış ve varış noktalarını adres listesinden seçin, tarih ve saatinizi girin. Fiyatı bulunan araçlardan birini seçerek iletişim bilgilerinizi ve transfer talebinizi gönderebilirsiniz. Operasyon ekibi talebinizi teyit eder."],
    ["Fiyat nasıl hesaplanır?", "Fiyatlandırma, seçilen rota için geçerli yerel taksi tarifesine ve araç sınıfına bağlıdır. Tarih, saat ve para birimi de hesaplamaya dahil edilir. Geçerli tarife alınamazsa teklif talebi oluşturabilirsiniz."],
    ["Şoförümü takip edebilir miyim?", "Transferiniz için takip bağlantısı oluşturulduğunda yolculuk durumunu bu bağlantı üzerinden görüntüleyebilirsiniz. Operasyon ekibi gerekli bilgileri sizinle paylaşır."],
    ["Özel bir isteğimi nasıl iletebilirim?", "Rezervasyon talebindeki not alanına uçuş bilgilerinizi, çocuk koltuğu veya ek bagaj gibi ihtiyaçlarınızı yazın. Operasyon ekibi uygunluğu sizinle teyit eder."],
  ] : [
    ["How do I book my transfer?", "Choose both locations from the address suggestions and enter your date and time. Select an available vehicle quote, add your contact details and submit your request. Our operations team will confirm your journey."],
    ["How is my price calculated?", "Pricing is based on the applicable local taxi tariff and your selected vehicle class. Your date, time and currency are included in the calculation. When a valid tariff is unavailable, you can request a quote."],
    ["Can I follow my transfer?", "When a tracking link is created for your transfer, you can use it to view the journey status. Our operations team will share the relevant details with you."],
    ["How do I request something extra?", "Add flight details, child-seat requirements or extra luggage in the booking notes. Our operations team will confirm availability with you."],
  ];
  return (
    <main className="sky-experience">
      <section className="sky-hero" aria-labelledby="hero-title">
        <div className="sky-hero-photo" aria-hidden="true" />
        <div className="sky-container sky-hero-layout">
          <div className="sky-hero-content">
            <span className="sky-eyebrow"><i /> {tr ? "YOLCULUĞUNUZ, ÖZENLE PLANLANDI" : "YOUR JOURNEY, THOUGHTFULLY ARRANGED"}</span>
            <h1 id="hero-title">{tr ? <>Yolculuğunuz<br />iyi ellerde.</> : <>A better journey.<br />From the first hello.</>}</h1>
            <p>{tr ? "Havalimanından şehre, iş seyahatinden özel bir güne. Konforlu araçlar, profesyonel bir karşılama ve size ayrılan bir yolculuk." : "From airport arrivals to business trips and special occasions. Refined vehicles, a professional welcome and a journey made for you."}</p>
            <div id="book-a-transfer" className="sky-booking-wrap">
              <div className="sky-booking-heading"><span>{tr ? "YOLCULUĞUNUZU PLANLAYIN" : "PLAN YOUR JOURNEY"}</span><span>01 — 03</span></div>
              {booking}
              <p className="sky-booking-note"><span aria-hidden="true">◇</span> {tr ? "Talebiniz operasyon ekibimiz tarafından teyit edilir." : "Your request is confirmed by our operations team."}</p>
            </div>
          </div>
          <div className="sky-hero-caption"><span>SKYFLEET / GLOBAL TRANSFERS</span><p>{tr ? "Her varışın güzel bir başlangıcı olsun." : "Every arrival deserves a good beginning."}</p></div>
        </div>
      </section>

      <div className="sky-assurance"><div className="sky-container">
        {(tr ? ["Profesyonel karşılama", "Özenli araç seçimi", "Bağlantılı operasyon", "Size özel transfer"] : ["A professional welcome", "Considered vehicle classes", "Connected operations", "Your own private transfer"]).map((item) => <span key={item}><i aria-hidden="true">✓</i>{item}</span>)}
      </div></div>

      <section className="sky-section sky-container sky-intro" id="our-approach">
        <div><span className="sky-eyebrow">{tr ? "SKYFLEET DENEYİMİ" : "THE SKYFLEET EXPERIENCE"}</span><h2>{tr ? <>Sadece bir transferden<br />daha fazlası.</> : <>More than a transfer.<br />A little peace of mind.</>}</h2></div>
        <div className="sky-intro-copy"><p>{tr ? "Bir yolculuğun iyi geçmesi, ayrıntıların iyi planlanmasıyla başlar. SKYFLEET, yolcuları, profesyonel tedarikçileri ve operasyon ekiplerini tek bir transfer ağı içinde buluşturur." : "A good journey starts with the details. SKYFLEET brings passengers, professional suppliers and operations teams together in one connected transfer network."}</p><a className="sky-text-link" href="/about">{tr ? "Bizi tanıyın" : "Get to know us"}<Arrow /></a></div>
      </section>

      <section className="sky-section sky-container" id="services">
        <div className="sky-section-heading"><div><span className="sky-eyebrow">{tr ? "YOLCULUĞUNUZA UYGUN" : "MADE FOR YOUR PLANS"}</span><h2>{tr ? "Nasıl yolculuk etmek istersiniz?" : "Wherever the day takes you."}</h2></div><a className="sky-text-link" href="/transfer">{tr ? "Transfer planlayın" : "Arrange a transfer"}<Arrow /></a></div>
        <div className="sky-service-grid">{services.map(([number, title, description, photo]) => <a className="sky-service" href="/transfer" key={number}><div className="sky-service-image"><img src={photo} alt="" loading="lazy" /><span>{number}</span></div><div className="sky-service-copy"><h3>{title}<Arrow /></h3><p>{description}</p></div></a>)}</div>
      </section>

      <section className="sky-fleet-section" id="vehicle-classes"><div className="sky-container sky-section">
        <div className="sky-section-heading"><div><span className="sky-eyebrow">{tr ? "KONFORUNUZU SEÇİN" : "CHOOSE YOUR COMFORT"}</span><h2>{tr ? "Her yolculuğa uygun bir sınıf." : "The right class for your journey."}</h2></div><div className="sky-fleet-tabs" role="tablist" aria-label={tr ? "Araç sınıfları" : "Vehicle classes"}>{fleet.map((item, index) => <button type="button" role="tab" key={item.name} id={`fleet-tab-${index}`} aria-selected={index === vehicle} aria-controls="fleet-panel" onClick={() => setVehicle(index)}>{["Vito", "E-Class", "S-Class"][index]}</button>)}</div></div>
        <div className="sky-fleet-panel" role="tabpanel" id="fleet-panel" aria-labelledby={`fleet-tab-${vehicle}`}>
          <div className="sky-fleet-image"><img src={chosen.image} alt={chosen.name} loading="lazy" /><span>{chosen.category}</span></div>
          <div className="sky-fleet-copy"><span className="sky-eyebrow">{chosen.name}</span><h3>{chosen.title}</h3><p>{chosen.text}</p><div className="sky-fleet-specs"><span><b>{chosen.seats}</b> {tr ? "yolcu" : "passengers"}</span><span><b>{chosen.bags}</b> {tr ? "bagaj" : "luggage"}</span></div><small>{tr ? "Araç ve bagaj kapasitesi operasyon teyidine bağlıdır." : "Vehicle and luggage capacity are subject to operational confirmation."}</small><a href="#book-a-transfer" className="sky-primary-link">{tr ? "Yolculuğunuzu planlayın" : "Plan your journey"}<Arrow /></a></div>
        </div>
      </div></section>

      <section className="sky-section sky-container sky-steps-section"><div><span className="sky-eyebrow">{tr ? "BAŞLANGIÇTAN VARIŞA" : "FROM REQUEST TO ARRIVAL"}</span><h2>{tr ? "Üç adımda yola çıkın." : "Good journeys start simply."}</h2></div><div className="sky-steps">{(tr ? [["Rotanızı belirleyin", "Adreslerinizi, tarih ve saatinizi seçin."], ["Aracınızı seçin", "Mevcut fiyatları inceleyip talebinizi iletin."], ["Teyidinizi alın", "Operasyon ekibimiz yolculuğunuzu teyit eder."]] : [["Tell us your plans", "Choose your locations, date and time."], ["Find your vehicle", "Review available quotes and send your request."], ["Receive confirmation", "Our operations team confirms your journey."]]).map(([title, text], index) => <article key={title}><span>0{index + 1}</span><h3>{title}</h3><p>{text}</p></article>)}</div></section>

      <section className="sky-partners"><div className="sky-container sky-partners-layout"><div><span className="sky-eyebrow">{tr ? "BİRLİKTE DAHA İLERİYE" : "GO FURTHER, TOGETHER"}</span><h2>{tr ? "İşiniz için bir ulaşım ortağı." : <>One mobility partner.<br />More possibilities.</>}</h2><p>{tr ? "Acentanızın transfer taleplerini yönetin veya tedarikçi ağımıza katılın. Yolcular, araçlar ve operasyonlar aynı platformda buluşsun." : "Manage your agency’s transfer requests or join our supplier network. Bring passengers, vehicles and operations together on one platform."}</p></div><div className="sky-partner-links"><a href="/agency/join"><span><small>{tr ? "SEYAHAT ACENTALARI" : "TRAVEL AGENCIES"}</small><strong>{tr ? "Acenta olarak katılın" : "Become an agency partner"}</strong></span><Arrow /></a><a href="/supplier/join"><span><small>{tr ? "PROFESYONEL TEDARİKÇİLER" : "PROFESSIONAL SUPPLIERS"}</small><strong>{tr ? "Tedarikçi ağımıza katılın" : "Join our supplier network"}</strong></span><Arrow /></a></div></div></section>

      <section className="sky-section sky-container sky-faq" id="faq"><div><span className="sky-eyebrow">{tr ? "YOLA ÇIKMADAN ÖNCE" : "BEFORE YOU GO"}</span><h2>{tr ? "Merak ettikleriniz." : "A few helpful answers."}</h2><p>{tr ? "Yolculuğunuzu planlamayı kolaylaştıralım." : "A little clarity before your next journey."}</p></div><div className="sky-faq-list">{faq.map(([question, answer]) => <details key={question}><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>)}</div></section>
      <section className="sky-final sky-container"><span className="sky-eyebrow">{tr ? "BİR SONRAKİ YOLCULUĞUNUZ" : "YOUR NEXT JOURNEY"}</span><h2>{tr ? "Güzel bir başlangıç yapalım." : "Let’s make your next arrival a good one."}</h2><a href="#book-a-transfer" className="sky-primary-link">{tr ? "Transfer planlayın" : "Plan a transfer"}<Arrow /></a></section>
    </main>
  );
}
