function About(){
  return(
    <div className="page">

      <div className="page-header">
        <div>
          <h1 className="page-title">About CivicWatch</h1>
          <p className="page-sub">Smart Infrastructure Monitoring</p>
        </div>
      </div>

      <div className="card">

        <p style={{marginBottom:"10px"}}>
          CivicWatch is a Smart Civic Infrastructure Monitoring System
          that enables citizens to report issues like potholes,
          garbage overflow, water leakage, and broken streetlights.
        </p>

        <p style={{marginBottom:"10px"}}>
          The platform provides real-time tracking, GIS-based mapping,
          and analytics dashboards for government authorities to
          manage city infrastructure efficiently.
        </p>

        <p>
          This system improves transparency, accountability, and
          response time in urban governance.
        </p>

      </div>
    </div>
  );
}

export default About;