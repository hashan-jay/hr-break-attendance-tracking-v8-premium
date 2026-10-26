export default function PortalCredits({ className = '', employeePortal = false }) {
  if (employeePortal) {
    return (
      <p className={['portal-credits', className].filter(Boolean).join(' ')}>
        <span>HTSK - PortCity BPO ©2026 All rights reserved</span>
        <span>Employee Break & Attendance Tracking System</span>
        <span>Version 8.0 PREMIUM Edition</span>
      </p>
    );
  }

  return (
    <p className={['portal-credits', className].filter(Boolean).join(' ')}>
      <span>HTSK - PortCity BPO ©2026</span>
      {/*<span>©2026 All Rights Reserved</span>}*/}
      <span>Employee Break & Attendance Tracker</span>
      <span>Version 8.0 PREMIUM</span>
    </p>
  );
}
