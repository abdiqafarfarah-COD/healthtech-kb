import ChatWidget from "../components/ChatWidget";
import "./MockHMIS.css";

export default function MockHMIS() {
  return (
    <div className="hmis-page">
      <div className="hmis-topbar">
        <div className="hmis-logo">MediCore HMIS</div>
        <div className="hmis-topbar-links">
          <span>Dashboard</span>
          <span>Patients</span>
          <span>Appointments</span>
          <span>Billing</span>
          <span>Reports</span>
        </div>
      </div>

      <div className="hmis-body">
        <div className="hmis-sidebar">
          <div className="hmis-sidebar-item active">Patient Records</div>
          <div className="hmis-sidebar-item">Lab Results</div>
          <div className="hmis-sidebar-item">Prescriptions</div>
          <div className="hmis-sidebar-item">Staff Schedule</div>
          <div className="hmis-sidebar-item">Inventory</div>
        </div>

        <div className="hmis-main">
          <h1>Patient Records</h1>
          <p className="hmis-subtitle">
            This is a mock hospital information system screen, unrelated to
            the Healthtech Knowledge Base application. It demonstrates the
            chatbot widget embedded inside a third-party clinical workflow,
            as described in the capstone brief.
          </p>

          <table className="hmis-table">
            <thead>
              <tr>
                <th>Patient ID</th>
                <th>Name</th>
                <th>Department</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>P-1042</td>
                <td>Jane Kariuki</td>
                <td>Outpatient</td>
                <td>Active</td>
              </tr>
              <tr>
                <td>P-1043</td>
                <td>Peter Otieno</td>
                <td>Radiology</td>
                <td>Active</td>
              </tr>
              <tr>
                <td>P-1044</td>
                <td>Mary Njeri</td>
                <td>Maternity</td>
                <td>Discharged</td>
              </tr>
            </tbody>
          </table>

          <div className="hmis-hint">
            A healthcare worker using this screen can click the chat bubble
            in the bottom-right corner to query the Knowledge Base without
            leaving this page.
          </div>
        </div>
      </div>

      <ChatWidget />
    </div>
  );
}