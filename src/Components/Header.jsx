import logo from "../assets/hat logo.png";

export default function Header() {
  return (
    <header>
      <img className="logo" src={logo} alt="logo" />
      <h1 className="header">Chef's Pick</h1>
    </header>
  );
}
