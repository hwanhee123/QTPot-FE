import Navbar from "./Navbar";
import QtFab from "./QtFab";

export default function Layout({ children }) {
  return (
    <div className="layout">
      <Navbar />
      <div className="main-content">
        {children}
      </div>
      <QtFab />
    </div>
  );
}
