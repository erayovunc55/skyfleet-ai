const tripSteps = [
  "Transfer Kabul Edildi",
  "Yola Çıkıldı",
  "Alış Noktasında",
  "Yolcu Arandı",
  "Yolcu Geldi",
  "Yolculuk Başladı",
  "Yolculuk Tamamlandı",
];

export default function TripTimeline({ currentStep }) {
  return (
    <div className="trip-timeline">
      {tripSteps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isActive = index === currentStep;

        return (
          <div
            className={`timeline-item ${
              isCompleted ? "completed" : ""
            } ${isActive ? "active" : ""}`}
            key={step}
          >
            <div className="timeline-marker">
              {isCompleted ? "✓" : index + 1}
            </div>

            <span>{step}</span>
          </div>
        );
      })}
    </div>
  );
}