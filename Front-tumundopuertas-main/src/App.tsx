import "./App.css";
import AppRouter from "./routers/routers";
import { FormatosProvider } from "./context/FormatosContext";

function App() {
  return (
    <FormatosProvider>
      <AppRouter />
    </FormatosProvider>
  );
}

export default App;
