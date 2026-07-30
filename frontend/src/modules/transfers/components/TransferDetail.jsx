import AssignmentCard from "./AssignmentCard";
import DispatcherActionsCard from "./DispatcherActionsCard";
import DocumentsCard from "./DocumentsCard";
import DriverCard from "./DriverCard";
import FlightCard from "./FlightCard";
import NotesCard from "./NotesCard";
import OperationStatusCard from "./OperationStatusCard";
import PassengerCard from "./PassengerCard";
import VehicleCard from "./VehicleCard";

export default function TransferDetail() {
  return (
    <div className="transfer-detail-grid">

      <OperationStatusCard />

      <AssignmentCard />

      <DispatcherActionsCard />

      <PassengerCard />

      <DriverCard />

      <VehicleCard />

      <FlightCard />

      <NotesCard />

      <DocumentsCard />



    </div>
  );
}